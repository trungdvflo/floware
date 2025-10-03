import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { QueryFailedError } from 'typeorm';
import {
  ApiLastModifiedName,
  CHAT_CHANNEL_TYPE,
  DELETED_ITEM_TYPE,
  SOURCE_TYPE_FILE_COMMON
} from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import {
  CHANNEL_DOES_NOT_EXIST,
  ERR_COLLECTION_ACTIVITY,
  MSG_ERR_DOWNLOAD, MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_NOT_EXIST,
  MSG_ERR_UPLOAD,
  MSG_ERR_WHEN_CREATE,
  MSG_ERR_WHEN_DELETE,
  MSG_FILE_NOT_EXIST,
  MSG_FIND_NOT_FOUND,
  MSG_INVALID_CHANNEL_ID
} from '../../common/constants/message.constant';
import { TypeOrmErrorCode } from '../../common/constants/typeorm-code';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { ConferenceChatEntity } from '../../common/entities/conference-chat.entity';
import { IReq } from '../../common/interfaces';
import { LoggerService } from '../../common/logger/logger.service';
import { ShareMemberRepository } from '../../common/repositories';
import { ConferenceMemberRepository } from '../../common/repositories/conference-member.repository';
import { ConferenceChatRepository } from '../../common/repositories/conferencing-chat.repository';
import { FileCommonRepository } from '../../common/repositories/file-common.repository';
import { LinkFileRepository } from '../../common/repositories/link-file-common.repository';
import { QuotaRepository } from '../../common/repositories/quota.repository';
import { filterDuplicateItemsWithKey } from '../../common/utils/common';
import { CryptoUtil } from '../../common/utils/crypto.util';
import {
  getUpdateTimeByIndex,
  getUtcMillisecond,
  getUtcSecond
} from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { S3Util, S3Utility } from '../../common/utils/s3.util';
import cfgAWS from '../../configs/aws';
import uploadConfig from '../../configs/upload.config';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { ChatService } from '../chat-realtime/chat-realtime.service';
import { ChimeChatService } from '../communication/services';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { ListMessageIntDTO } from './dtos/chatting-int-message.post.dto';
import { DeleteMessageIntDTO } from './dtos/chatting-int.delete.dto';
import { EditMessageIntDTO, UpdateConferenceChatDTO } from './dtos/conference-chat.put.dto';
import { LinkFileDTO } from './dtos/createLinkFile.dto';
import { DeleteFileDTO } from './dtos/delete.dto';
import { GetDownloadDto } from './dtos/download.get.dto';
import { CreateFileDTO } from './dtos/upload.create.dto';

@Injectable()
export class ConferenceChatService {
  private s3Util: S3Utility;
  private readonly s3Path: string;

  constructor(
    private readonly file: FileCommonRepository,
    private readonly conferencingMemberRepo: ConferenceMemberRepository,
    private readonly shareMemberRepo: ShareMemberRepository,
    private readonly conferenceChatRepo: ConferenceChatRepository,
    private readonly linkFileRepo: LinkFileRepository,
    private readonly quota: QuotaRepository,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly loggerService: LoggerService,
    private readonly chimeService: ChimeChatService,
    private readonly chatService: ChatService,
    private readonly deletedItem: DeletedItemService,
  ) {
    this.s3Path = cfgAWS().s3Path;

    this.s3Util = S3Util({
      endpoint: cfgAWS().s3Endpoint,
      region: cfgAWS().s3Region,
      accessKeyId: cfgAWS().s3AccessKeyId,
      secretAccessKey: cfgAWS().s3SecretAccessKey,
    }, cfgAWS().s3Bucket || 'bucket_name');
  }

  public async channelMemberExisted(channelId: number, memberId: number) {
    const channelMemberItem = await this.conferencingMemberRepo.findOne({
      select: ['id'],
      where: {
        user_id: memberId,
        channel_id: channelId,
        revoke_time: 0,
      },
    });
    return channelMemberItem;
  }

  async getAllItems(filter: BaseGetDTO, { user, headers }: IReq) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const collections: ConferenceChatEntity[] = await this.databaseUtilitiesService.getAll({
      userId: user.id,
      filter,
      repository: this.conferenceChatRepo
    });

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(user.id, DELETED_ITEM_TYPE.CONFERENCE_CHAT, {
        ids,
        modified_gte,
        modified_lt,
        page_size
      });
    }
    return {
      data: collections,
      data_del: deletedItems
    };
  }

  async getListMessagesChannel(params: ListMessageIntDTO, { user, headers }: IReq) {
    try {
      const boundParams = plainToClass(ListMessageIntDTO, params);
      const { internal_channel_id, internal_channel_type,
        sort_order, max_results, next_token } = boundParams;
      // calling Chime internal to get message
      const channels: ListMessageIntDTO = {
        internal_channel_id,
        internal_channel_type,
        sort_order,
        max_results,
        next_token
      };

      if (internal_channel_type === CHAT_CHANNEL_TYPE.CONFERENCE) {
        const confExisted = await this.conferencingMemberRepo
          .checkConferenceWithEmail(params.internal_channel_id, user.email, user.userId);
        if (!confExisted || !confExisted.channel_id) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
            CHANNEL_DOES_NOT_EXIST);
          return { error: errItem };
        }
        if (confExisted.view_chat_history === 0) {
          channels.not_before = confExisted.join_time;
        }
      }
      if (internal_channel_type === CHAT_CHANNEL_TYPE.SHARED_COLLECTION) {
        // TODO: check channel of collection if have ticket handle this thing
      }
      const rs = await this.chimeService.setHeader(headers).batchGetMessagesChannel(channels);
      return rs;
    } catch (error) {
      return error;
    }
  }

  async createConferenceChat(dataLink: LinkFileDTO[], { user, headers }: IReq) {
    const itemFail = [];
    const itemPass = [];
    const timeLastModify = [];

    const currentTime = getUtcMillisecond();
    // check channel existed
    const channeMemberlItem = await this.channelMemberExisted(
      dataLink[0].channel_id,
      user.userId,
    );
    if (!channeMemberlItem) {
      const errItem = buildFailItemResponse(
        ErrorCode.BAD_REQUEST,
        MSG_INVALID_CHANNEL_ID
      );
      itemFail.push(errItem);
    } else {
      await Promise.all(dataLink.map(async (data, idx) => {
        try {
          const memberInfor = await this.conferencingMemberRepo.getInfoMember({
            channelId: data.channel_id,
            userId: user.userId
          });
          if (!memberInfor) {
            const errItem = buildFailItemResponse(
              ErrorCode.BAD_REQUEST,
              MSG_INVALID_CHANNEL_ID,
              data,
            );
            itemFail.push(errItem);
          } else {
            const dateItem = getUpdateTimeByIndex(currentTime, idx);
            timeLastModify.push(dateItem);
            if (data.message_type === 1) {
              const isExistFile = await this.file.findOne({
                select: ['id'],
                where: {
                  id: data.file_common_id,
                  user_id: user.userId
                }
              });
              if (!isExistFile) {
                const errItem = buildFailItemResponse(
                  ErrorCode.BAD_REQUEST,
                  MSG_FILE_NOT_EXIST,
                  data,
                );
                return itemFail.push(errItem);
              }
              const conferenceChatEntity = this.conferenceChatRepo.create({
                user_id: user.userId,
                parent_id: 0,
                conference_member_id: memberInfor.id,
                email: user.email,
                message_uid: data.message_uid,
                message_text: data.message_text,
                message_type: data.message_type,
                created_date: dateItem,
                updated_date: dateItem
              });
              const rsConferencingChat = await this.conferenceChatRepo.save(conferenceChatEntity);
              // create link file common
              const linkFileCommonEntity = this.linkFileRepo.create({
                user_id: user.userId,
                source_id: rsConferencingChat.id,
                source_type: SOURCE_TYPE_FILE_COMMON.CHAT,
                file_common_id: data.file_common_id
              });
              await this.linkFileRepo.save(linkFileCommonEntity);
              itemPass.push(rsConferencingChat);
            } else {
              const conferenceChatEntity = this.conferenceChatRepo.create({
                user_id: user.userId,
                parent_id: 0,
                conference_member_id: memberInfor.id,
                email: user.email,
                message_uid: data.message_uid,
                message_text: data.message_text,
                message_type: data.message_type,
                created_date: dateItem,
                updated_date: dateItem
              });
              const rsConferencingChat = await this.conferenceChatRepo.save(conferenceChatEntity);
              itemPass.push(rsConferencingChat);
            }
          }
        } catch (error) {
          if (error instanceof QueryFailedError &&
            error.message.includes(TypeOrmErrorCode.ER_DUP_ENTRY)) {
            const errDubItem = buildFailItemResponse(
              ErrorCode.BAD_REQUEST, MSG_ERR_DUPLICATE_ENTRY, data);
            itemFail.push(errDubItem);
            return true;
          }
          const errItem = buildFailItemResponse(
            ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_CREATE, data);
          itemFail.push(errItem);
        }
      }));
    }

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.CONFERENCE_CHAT,
        userId: user.userId,
        email: user.email,
        updatedDate
      }, headers);
    }
    return { itemPass, itemFail };
  }

  async update(data: UpdateConferenceChatDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const timeLastModify = [];
    const currentTime = getUtcMillisecond();

    await Promise.all(data.map(async (item, idx) => {
      try {
        const itemConferenceChat = await this.conferenceChatRepo.findOne({
          where: {
            user_id: user.userId,
            id: item.id
          }
        });
        if (!itemConferenceChat) {
          const errNotFound = buildFailItemResponse(ErrorCode.BAD_REQUEST,
            MSG_ERR_NOT_EXIST, item);
          itemFail.push(errNotFound);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(dateItem);

          await this.conferenceChatRepo.update({ id: item.id }, {
            message_text: item.message_text, updated_date: dateItem
          });
          itemPass.push({ ...itemConferenceChat, ...item, updated_date: dateItem });
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        itemFail.push(errItem);
      }
    }));
    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.CONFERENCE_CHAT,
        userId: user.userId,
        email: user.email,
        updatedDate
      }, headers);
    }
    return { itemPass, itemFail };
  }

  async download(data: GetDownloadDto, { user, headers }: IReq): Promise<any> {
    const dtoDownload = plainToClass(GetDownloadDto, data);
    try {
      const { channel_id, channel_type, file_uid } = dtoDownload;
      // check upload permission
      await this.chatService.checkPermissionBeforeChat(channel_id, channel_type, user);

      const fileData = await this.linkFileRepo.getFileByFileIDAndChannelId(file_uid, channel_id);
      if (!fileData) {
        const errItem = buildFailItemResponse(
          ErrorCode.BAD_REQUEST,
          MSG_FILE_NOT_EXIST,
          data,
        );
        return errItem;
      }

      const source = this.s3Util.GenSource(this.s3Path, fileData.uid, fileData.dir, fileData.ext);
      const isExistFile = await this.s3Util.FileExist(source);
      if (isExistFile === false) {
        return {
          code: ErrorCode.FILE_NOT_FOUND,
          message: MSG_ERR_DOWNLOAD
        };
      }

      const expires = uploadConfig().s3DownloadExpireTime;
      const s3Object = await this.s3Util.DownloadUrl(source, +expires);
      return {
        code: ErrorCode.REQUEST_SUCCESS,
        url: s3Object.url
      };
    } catch (error) {
      const errItem = buildFailItemResponse(
        ErrorCode.BAD_REQUEST,
        error.message,
        dtoDownload
      );
      return errItem;
    }
  }

  async fileSingleUpload(createFileDTO: CreateFileDTO, file: Express.Multer.File
    , ext: string, { user, headers }: IReq) {
    try {
      const { channel_id, channel_type, message_uid } = createFileDTO;
      // check upload permission
      await this.chatService.checkPermissionBeforeChat(channel_id, channel_type, user);

      const dateItem = getUtcSecond();
      const size = file.size;
      const filename = file.originalname || 'unknown';
      const newUid = this.s3Util.GenUid();
      const dir = CryptoUtil.converToMd5(user.email);
      const source = this.s3Util.GenSource(this.s3Path, newUid, dir, ext);
      const isUpload = await this.s3Util.uploadFromBuffer(file.buffer, ext, source);

      if (!isUpload) {
        throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
          MSG_ERR_UPLOAD, createFileDTO));
      }
      // step1: save file into file common table
      const fileEnity = this.file.create({
        user_id: user.userId,
        uid: newUid,
        ext,
        filename,
        dir,
        size,
        created_date: dateItem,
        updated_date: dateItem,
      });
      const rsFileCommon = await this.file.save(fileEnity);
      await this.quota.changeQuotaFileCommon(size, user.email);

      // get name of type channel
      const channelTypeName = this.chatService.getChannelTypeFromNumber(channel_type);
      // create link file common
      const linkFileCommonEntity = this.linkFileRepo.create({
        user_id: user.userId,
        source_id: channel_id,
        source_uid: message_uid,
        source_type: channelTypeName,
        file_common_id: rsFileCommon.id
      });
      await this.linkFileRepo.save(linkFileCommonEntity);

      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.CONFERENCE_CHAT,
        userId: user.userId,
        email: user.email,
        updatedDate: dateItem
      }, headers);
      // delete data.user_id;
      // delete data.dir;
      return rsFileCommon;
    } catch (error) {
      this.loggerService.logError(error);
      throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
        error.message, createFileDTO));
    }
  }

  async deleteConferenceChat(data: DeleteFileDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];

    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['id']);
    if (dataError.length > 0) {
      dataError.forEach(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    await Promise.all(dataPassed.map(async (item, index) => {
      try {
        const itemConferenceChat = await this.conferenceChatRepo.findOne({
          where: {
            user_id: user.userId,
            id: item.id
          }
        });
        if (!itemConferenceChat) {
          const errItem = buildFailItemResponse(ErrorCode.FILE_NOT_FOUND, MSG_FIND_NOT_FOUND, item);
          itemFail.push(errItem);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, index);
          timeLastModify.push(dateItem);
          if (itemConferenceChat.message_type === 1) {
            const fileItem = await this.conferenceChatRepo
              .getFileDownloadByMessageUID(itemConferenceChat.message_uid);
            const { id, uid, dir, ext, size } = fileItem;
            const source = this.s3Util.GenSource(this.s3Path, uid, dir, ext);
            this.s3Util.Delete(source);
            await Promise.all([
              this.quota.changeQuotaFileCommon(-size, user.email),
              this.linkFileRepo.delete({ file_common_id: id }),
              this.file.delete({ id })
            ]);
          }
          await this.deletedItem.create(user.userId, {
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.CONFERENCE_CHAT,
            created_date: dateItem,
            updated_date: dateItem
          });
          await this.conferenceChatRepo.delete({ id: item.id });
          itemPass.push(item);
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
        this.loggerService.logError(error);
        itemFail.push(errItem);
      }
    }));
    if (timeLastModify.length > 0) {
      await this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.CONFERENCE_CHAT,
        userId: user.userId,
        email: user.email,
        updatedDate: Math.max(...timeLastModify)
      }, headers);
    }
    return { itemPass, itemFail };
  }

  async updateMessage(data: EditMessageIntDTO[], { user, headers }: IReq) {
    const itemFail = [];
    const itemFilter = [];
    const itemPass = [];
    // remove dubplicate item
    const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['internal_message_uid']);
    if (dataError.length > 0) {
      dataError.forEach(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    if (dataPassed.length > 0) {
      await Promise.all(dataPassed.map(async (item: EditMessageIntDTO) => {
        if (item.internal_channel_type === CHAT_CHANNEL_TYPE.SHARED_COLLECTION) {
          const isPermission = await this.shareMemberRepo
            .getPermissionMember(item.internal_channel_id, user.userId);

          if (!isPermission) {
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
              ERR_COLLECTION_ACTIVITY.COLLECTION_NOT_EDIT_PER, item);
            return itemFail.push(errItem);
          }
          itemFilter.push(item);
        } else {
          const isPermission = await this.channelMemberExisted(
            item.internal_channel_id, user.userId,
          );
          if (!isPermission) {
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
              ERR_COLLECTION_ACTIVITY.COLLECTION_NOT_EDIT_PER, item);
            return itemFail.push(errItem);
          }
          itemFilter.push(item);
        }
      }));
      if (itemFilter.length > 0) {
        const dataUpdate = await this.chimeService.setHeader(headers)
          .batchUpdateMessage(itemFilter, user);

        return { itemPass: dataUpdate, itemFail };
      }
    }
    return { itemPass, itemFail };
  }

  async deleteMessage(data: DeleteMessageIntDTO[], { user, headers }: IReq) {
    const itemFail = [];
    const itemFilter = [];
    const itemPass = [];
    // remove dubplicate item
    const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['internal_message_uid']);
    if (dataError.length > 0) {
      dataError.forEach(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    if (dataPassed.length > 0) {
      await Promise.all(dataPassed.map(async (item: DeleteMessageIntDTO) => {
        if (item.internal_channel_type === CHAT_CHANNEL_TYPE.SHARED_COLLECTION) {
          const isPermission = await this.shareMemberRepo
            .getPermissionMember(item.internal_channel_id, user.userId);

          if (!isPermission) {
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
              ERR_COLLECTION_ACTIVITY.COLLECTION_NOT_EDIT_PER, item);
            return itemFail.push(errItem);
          }
          itemFilter.push(item);
        } else {
          const isPermission = await this.channelMemberExisted(
            item.internal_channel_id, user.userId,
          );
          if (!isPermission) {
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
              ERR_COLLECTION_ACTIVITY.COLLECTION_NOT_EDIT_PER, item);
            return itemFail.push(errItem);
          }
          itemFilter.push(item);
        }
      }));
      if (itemFilter.length > 0) {
        const dataUpdate = await this.chimeService.setHeader(headers)
          .batchDeleteMessage(itemFilter, user);
        return { itemPass: dataUpdate, itemFail };
      }
    }
    return { itemPass, itemFail };
  }
}