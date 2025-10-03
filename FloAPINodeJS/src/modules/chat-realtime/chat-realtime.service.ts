import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { plainToClass } from "class-transformer";
import * as Jimp from 'jimp';
import {
  ApiLastModifiedName, IS_TRASHED,
  MEMBER_ACCESS, SHARE_STATUS, THUMBNAIL_TYPE
} from "../../common/constants";
import { ErrorCode } from "../../common/constants/error-code";
import {
  CHANNEL_DOES_NOT_EXIST,
  ERR_COLLECTION_ACTIVITY,
  ERR_REPLY_QUOTE_FORWARD_MESSAGE,
  MSG_CONFERENCE_NOT_EDIT_PER,
  MSG_ERR_DOWNLOAD,
  MSG_ERR_UPLOAD,
  MSG_FILE_NOT_EXIST
} from "../../common/constants/message.constant";
import { ResponseCode } from "../../common/constants/response-code";
import { IReq, IUser } from "../../common/interfaces";
import {
  CollectionRepository,
  ConferenceMemberRepository,
  ConferenceRepository,
  FileCommonRepository,
  LinkFileRepository,
  QuotaRepository,
  ShareMemberRepository
} from "../../common/repositories";
import { getChannelTypeNumber } from '../../common/utils/common';
import { CryptoUtil } from "../../common/utils/crypto.util";
import {
  getUpdateTimeByIndex, getUtcMillisecond,
  getUtcSecond
} from "../../common/utils/date.util";
import { buildFailItemResponse } from "../../common/utils/respond";
import { S3Util, S3Utility } from '../../common/utils/s3.util';
import { FileUploadUtil } from "../../common/utils/upload.util";
import cfApp from '../../configs/app';
import cfgAWS from '../../configs/aws';
import uploadConfig from "../../configs/upload.config";
import { ApiLastModifiedQueueService } from "../bullmq-queue";
import { EventNames } from "../communication/events";
import { ChatMentionToIndividual } from "../communication/events/chat.event";
import {
  ChannelType,
  ChannelTypeNumber,
  RealTimeMessageCode
} from "../communication/interfaces";
import { ChimeChatService, IChimeChatMessage, RealTimeService } from "../communication/services";
import { DeleteMessageIntDTO } from "../conference-chat/dtos/chatting-int.delete.dto";
import { EditMessageIntDTO } from "../conference-chat/dtos/conference-chat.put.dto";
import {
  ChatDownloadDTO,
  ChatMentionDto,
  ChimeFileDTO,
  DeleteChatDTO, GetAttachmentDTO, GetChatDTO, GetLastSeenDTO, PostChatDTO,
  PutChatDTO, PutLastSeenDTO
} from "./dtos";
@Injectable()
export class ChatService {
  private readonly thumbnailHeight: number;
  private readonly thumbnailUrl: string;
  private s3Util: S3Utility;
  private readonly s3Path: string;
  constructor(
    private readonly realTimeService: RealTimeService,
    private readonly linkedFileRepo: LinkFileRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly conferenceRepo: ConferenceRepository,
    private readonly conferenceMemberRepo: ConferenceMemberRepository,
    private readonly collectionRepo: CollectionRepository,
    private readonly sharedMemberRepo: ShareMemberRepository,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly chimeChatService: ChimeChatService,
    private readonly fileCommonRepo: FileCommonRepository,
    private readonly quotaRepo: QuotaRepository,
    private readonly httpClient: HttpService
  ) {
    this.s3Path = cfgAWS().s3Path;
    this.thumbnailHeight = cfApp().thumbnailHigh;
    this.thumbnailUrl = cfApp().thumbnailUrl;
    this.s3Util = S3Util({
      endpoint: cfgAWS().s3Endpoint,
      region: cfgAWS().s3Region,
      accessKeyId: cfgAWS().s3AccessKeyId,
      secretAccessKey: cfgAWS().s3SecretAccessKey,
    },
      cfgAWS().s3Bucket || 'bucket_name',
    );
  }

  async getChannelChatMessage(
    {
      channel_id,
      channel_type,
      page_size,
      before_time,
      after_time,
      sort,
      page_no = 0,
      parent_uid,
    }: GetChatDTO,
    { headers, user }: IReq,
  ) {
    try {
      await this.checkPermissionBeforeChat(channel_id, channel_type, user, false);
      if (parent_uid) {
        await this._validateReplyQuoteForward(parent_uid, 'GET', {
          user,
          headers,
        });
      }

      // max before fo case REVOKE
      const before_sent_time: number = await this.getMaxBeforeTimeSend(
        channel_id,
        channel_type,
        user,
        before_time,
      );
      // min after for enable_chat_history
      const after_sent_time: number = await this.getMinAfterTimeSend(
        channel_id,
        channel_type,
        user,
        after_time,
      );

      const data = await this.realTimeService
        .setHeader(headers)
        .getChannelChatMessage(
          channel_id,
          parent_uid,
          this.getChannelTypeFromNumber(channel_type),
          {
            page_size,
            page_no,
            before_sent_time,
            after_sent_time,
            sort,
          },
        );

      return {
        data: !data.items?.length
          ? []
          : data.items.map(this.remapMessage(channel_id, channel_type)),
      };
      // meta
    } catch (error) {
      return { data: [] };
    }
  }

  async getMaxBeforeTimeSend(
    channelId: number,
    channelType: ChannelTypeNumber,
    user: IUser,
    before: number,
  ) {
    let rs: number = null;
    switch (channelType) {
      case ChannelTypeNumber.SHARED_COLLECTION:
        return before;
      case ChannelTypeNumber.CONFERENCE:
        rs = await this.getMaxBeforeByConference(channelId, user, before);
        break;
    }
    return rs;
  }

  async getMinAfterTimeSend(
    channelId: number,
    channelType: ChannelTypeNumber,
    user: IUser,
    after: number,
  ) {
    let rs: number = null;
    switch (channelType) {
      case ChannelTypeNumber.SHARED_COLLECTION:
        return after;
      case ChannelTypeNumber.CONFERENCE:
        rs = await this.getMinAfterByConference(channelId, user, after);
        break;
    }
    return rs;
  }
  // max before fo case REVOKE
  async getMaxBeforeByConference(channelId: number, user: IUser, before: number): Promise<number> {
    const member = await this.conferenceMemberRepo.findOne({
      select: ['revoke_time'],
      where: {
        channel_id: channelId,
        user_id: user.id,
      },
    });

    //
    if (member?.revoke_time > 0) {
      return Math.max(before || 0, member?.revoke_time);
    }
    return before;
  }
  // min after for enable_chat_history
  async getMinAfterByConference(channelId: number, user: IUser, after: number): Promise<number> {
    const member = await this.conferenceMemberRepo.findOne({
      select: ['created_date', 'view_chat_history'],
      where: {
        channel_id: channelId,
        revoke_time: 0,
        user_id: user.id,
      },
    });
    //
    if (+member?.view_chat_history === 0) {
      return Math.max(after || 0, member?.created_date);
    }
    return after;
  }

  remapMessage(channel_id: number, channel_type: ChannelTypeNumber) {
    return (msg) => ({
      channel_id,
      channel_type,
      message_uid: msg.uid || '',
      message_text: msg.content,
      metadata: msg.metadata,
      parent_uid: msg.parent_uid || '',
      reply_number: msg.reply_number || 0,
      content_marked: msg.content_marked || '',
      message_marked: msg.message_marked || {},
      email: msg.from || '',
      created_date: msg.created_date,
      updated_date: msg.edited?.time || msg.updated_date || 0,
      deleted_date: msg.deleted?.time || 0,
    });
  }

  async getListChatAttachments(
    { channel_id, channel_type }: GetAttachmentDTO,
    { headers, user }: IReq,
  ) {
    try {
      await this.checkPermissionBeforeChat(channel_id, channel_type, user, false);

      const data = await this.realTimeService
        .setHeader(headers)
        .getListChatAttachments(channel_id, this.getChannelTypeFromNumber(channel_type));

      return {
        data: !data.length
          ? []
          : data?.map((att) => ({
            message_uid: att.message_uid,
            file_id: att.file_id,
            email: att.owner,
            created_date: att.created_date,
            updated_date: att.updated_date,
          })),
      };
    } catch (error) {
      return { data: [] };
    }
  }

  async getLastSeenMessages({ channel_id, channel_type }: GetLastSeenDTO, { headers, user }: IReq) {
    try {
      await this.checkPermissionBeforeChat(channel_id, channel_type, user);
      const data = await this.realTimeService
        .setHeader(headers)
        .getLastSeenMessages(channel_id, this.getChannelTypeFromNumber(channel_type));

      return {
        data: !data?.length
          ? []
          : data?.map((seen) => ({
            message_uid: seen.last_message_uid,
            email: seen.email,
          })),
      };
    } catch (error) {
      return { data: [] };
    }
  }

  // async makeSignedUrl(fileId: number): Promise<string> {
  //   const fileItem = await this.linkedFileRepo.getFileByFileID(fileId);
  //   if (!fileItem)
  //     return null;
  //   const source = this.s3Util.GenSource(this.s3Path, fileItem.uid, fileItem.dir, fileItem.ext);
  //   const isExistFile = await this.s3Util.FileExist(source);
  //   if (!isExistFile) {
  //     return null;
  //   }
  //   const expires = uploadConfig().s3DownloadExpireTime;
  //   const s3Object = await this.s3Util.DownloadUrl(source, +expires);
  //   return s3Object.url;
  // }

  sendChatToChime(message: IChimeChatMessage, headers) {
    setTimeout(() => {
      this.chimeChatService.setHeader(headers).sendChatMessage(message);
    }, 0);
  }

  updateChatToChime(data: EditMessageIntDTO, headers, user) {
    setTimeout(() => {
      this.chimeChatService.setHeader(headers).batchUpdateMessage([data], user);
    }, 0);
  }

  delChatToChime(data: DeleteMessageIntDTO, headers, user) {
    setTimeout(() => {
      this.chimeChatService.setHeader(headers).batchDeleteMessage([data], user);
    }, 0);
  }

  async sendChatMessage(msg: PostChatDTO, { user, headers }: IReq) {
    try {
      // 0. check permission
      await this.checkPermissionBeforeChat(msg.channel_id, msg.channel_type, user);
      // 1. send to Chime
      this.sendChatToChime({
        internal_channel_id: msg.channel_id,
        internal_channel_type: msg.channel_type,
        msg: msg.message_text,
        is_realtime: 1 // ALREADY SENT, please do not send to real-time again
      }, headers);

      /*
        if parent_uid or marked.message_uid is exist, get origin message
      */
      if (msg.parent_uid || msg.marked) {
        const message_uid = msg.parent_uid || msg.marked.message_uid;
        await this._validateReplyQuoteForward(message_uid, 'POST', {
          user,
          headers,
        });
      }

      const respond = await this.realTimeService
        .setHeader(headers)
        .sendChatMessage(
          msg.channel_id,
          this.getChannelTypeFromNumber(msg.channel_type),
          msg.metadata,
          msg.message_text,
          msg.parent_uid,
          msg.marked
        );

      if (!respond?.data?.status) {
        this.handleError(respond, 'Can not send this message');
      }
      // SOON:: send last modified chat
      await this.sendLastModifiedChat(msg.channel_id, msg.channel_type,
        getUtcSecond(), { user, headers });

      if (msg.metadata?.mentions?.length) {
        this.pushMentionNotifications(respond?.data?.message_uid || '', msg.metadata.mentions, {
          user,
          headers,
        });
      }

      this.updateLastUsedChannelForConference(msg, respond?.data?.created_date,
        { user, headers });
      const { marked, ...msgRest } = msg;

      const result = {
        data: {
          message_uid: respond?.data?.message_uid || '',
          ...msgRest, // ignore marked
          message_text: msg.message_text,
          metadata: msg.metadata,
          parent_uid: respond?.data?.parent_uid,
          content_marked: respond?.data?.content_marked,
          message_marked: respond?.data?.message_marked,
          created_date: respond?.data?.created_date,
          updated_date: respond?.data?.updated_date,
          deleted_date: respond?.data?.deleted_date,
        } as any,
      };

      return result;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  private async _validateReplyQuoteForward(
    message_uid: string,
    method: 'GET' | 'POST',
    { user, headers }: IReq,
  ) {
    const originMessage = await this.realTimeService.setHeader(headers).getChatMessage(message_uid);
    const { channel_id, channel_type } = originMessage?.data;
    const channelTypeNumber = getChannelTypeNumber(channel_type);
    const before = 0;
    const after = 0;

    // max before for case REVOKE
    const before_sent_time: number = await this.getMaxBeforeTimeSend(
      channel_id,
      channelTypeNumber,
      user,
      before,
    );
    // min after for enable_chat_history=0
    const after_sent_time: number = await this.getMinAfterTimeSend(
      channel_id,
      channelTypeNumber,
      user,
      after,
    );

    if (!originMessage?.data?.status) {
      this.handleError(originMessage, ERR_REPLY_QUOTE_FORWARD_MESSAGE.MSG_ERR_GET_ORIGINAL_MESSAGE);
    }

    if (originMessage?.data?.deleted_date && method === 'POST') {
      this.handleError(
        originMessage,
        ERR_REPLY_QUOTE_FORWARD_MESSAGE.MSG_ERR_CANNOT_ACTION_ON_DELETED_MESSAGE,
      );
    }

    if (before_sent_time && originMessage?.data?.created_date > before_sent_time) {
      this.handleError(
        originMessage,
        ERR_REPLY_QUOTE_FORWARD_MESSAGE.MSG_ERR_NOT_FOUND_ORIGINAL_MESSAGE,
      );
    }

    if (after_sent_time && originMessage?.data?.created_date < after_sent_time) {
      this.handleError(
        originMessage,
        ERR_REPLY_QUOTE_FORWARD_MESSAGE.MSG_ERR_NOT_FOUND_ORIGINAL_MESSAGE,
      );
    }
  }

  handleError(respond, defaultMessage: string, needReturn: boolean = false) {
    let message = defaultMessage;
    if (!respond?.data?.status) {
      if (respond.error?.statusCode === ResponseCode.NOT_FOUND) {
        message = CHANNEL_DOES_NOT_EXIST;
      }
      message = respond.error?.message || defaultMessage;
    }
    if (needReturn) {
      return message;
    }
    throw new Error(message);
  }

  async updateChatMessage(msg: PutChatDTO, { user, headers }: IReq) {
    try {
      // 0. check permission
      await this.checkPermissionBeforeChat(msg.channel_id, msg.channel_type, user);

      // 1. update message to Chime
      const editMessagePayload: EditMessageIntDTO = {
        internal_channel_id: msg.channel_id,
        internal_channel_type: msg.channel_type,
        internal_message_uid: msg.message_uid,
        msg: msg.message_text,
        metadata: msg.metadata,
      };
      await this.updateChatToChime(editMessagePayload, headers, user);

      // 2. create comment
      const respond = await this.realTimeService
        .setHeader(headers)
        .updateChatMessage(msg.message_uid, msg.message_text, msg.metadata);

      if (!respond?.data?.status) {
        this.handleError(respond, 'Can not update this message');
      }
      await this.sendLastModifiedChat(msg.channel_id, msg.channel_type,
        getUtcSecond(), { user, headers });

      if (msg.metadata?.mentions?.length) {
        this.pushMentionNotifications(respond?.data?.message_uid || '', msg.metadata.mentions, {
          user,
          headers,
        });
      }

      return {
        data: {
          ...msg,
          message_text: msg.message_text,
          metadata: msg.metadata,
          created_date: respond?.data?.created_date,
          updated_date: respond?.data?.updated_date,
          deleted_date: respond?.data?.deleted_date,
        },
      };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async updateLastChatSeen(msg: PutLastSeenDTO, { user, headers }: IReq) {
    try {
      // 0. check permission
      await this.checkPermissionBeforeChat(msg.channel_id, msg.channel_type, user);
      // 1. update seen comment
      const respond = await this.realTimeService
        .setHeader(headers)
        .updateLastChatSeen(
          msg.channel_id,
          this.getChannelTypeFromNumber(msg.channel_type),
          msg.message_uid,
        );

      if (!respond?.data?.status) {
        this.handleError(respond, 'Can not update last seen for this channel');
      }
      return { data: msg };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async deleteChatMessage(data: DeleteChatDTO[], { user, headers }: IReq) {
    const itemFail = [];
    const itemPass = [];
    const channelIds = [];
    try {
      for (const msg of data) {
        if (msg.channel_type === ChannelTypeNumber.CONFERENCE) {
          channelIds.push(msg.channel_id);
        }
        // 0. check permission
        await this.checkPermissionBeforeChat(msg.channel_id, msg.channel_type, user);

        // 1. delete message to Chime
        const delMesPayload: DeleteMessageIntDTO = {
          internal_channel_id: msg.channel_id,
          internal_channel_type: msg.channel_type,
          internal_message_uid: msg.message_uid,
        };
        this.delChatToChime(delMesPayload, headers, user);

        // 2. delete file upload
        const filesItem = await this.linkedFileRepo
          .getFileDownloadByMessageUID(msg.message_uid);
        if (filesItem?.length > 0) {
          await Promise.all(filesItem.map(async (fileItem) => {
            const { id, uid, dir, ext, size } = fileItem;
            const source = this.s3Util.GenSource(this.s3Path, uid, dir, ext);
            this.s3Util.Delete(source);
            await Promise.all([
              this.quotaRepo.changeQuotaFileCommon(-size, user.email),
              this.linkedFileRepo.delete({ file_common_id: id }),
              this.fileCommonRepo.delete({ id })
            ]);
          }));
        }

        // 3. create comment
        const respond = await this.realTimeService
          .setHeader(headers)
          .deleteChatMessage(msg.message_uid);

        if (!respond?.data?.status) {
          const message = this.handleError(respond, 'Can not delete this message', true);
          itemFail.push(
            buildFailItemResponse(ErrorCode.BAD_REQUEST, message, {
              ...msg,
            }),
          );
          continue;
        }
        await this.sendLastModifiedChat(msg.channel_id, msg.channel_type,
          getUtcSecond(), { user, headers });
        itemPass.push({
          ...msg,
          created_date: respond?.data?.created_date,
          updated_date: respond?.data?.updated_date,
          deleted_date: respond?.data?.deleted_date,
        });
      }
      return { itemPass: itemPass.filter(Boolean), itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message);
      itemFail.push(errItem);
      return { itemPass, itemFail };
    }
  }

  pushMentionNotifications(
    message_uid: string,
    mentions: ChatMentionDto[],
    { user, headers }: IReq,
  ) {
    mentions?.forEach((mention) => {
      const eventData: ChatMentionToIndividual = {
        headers,
        message_code: RealTimeMessageCode.CHAT_USER_MENTION,
        email: mention.email,
        message_uid,
        content: `You were mentioned in a message by ${user.email}!`,
        metadata: {
          from: user.email,
          email: mention.email,
          updated_date: getUtcSecond(),
          event_timestamp: getUtcSecond(),
        },
      };
      this.eventEmitter.emit(EventNames.NOTIFICATION_TO_INDIVIDUAL, eventData);
    });
  }

  getChannelTypeFromNumber(channelTypeNumber: ChannelTypeNumber): ChannelType | null {
    switch (channelTypeNumber) {
      case ChannelTypeNumber.SHARED_COLLECTION:
        return ChannelType.SHARED_COLLECTION;
      case ChannelTypeNumber.CONFERENCE:
        return ChannelType.CONFERENCE;
    }
  }

  async updateLastUsedChannelForConference({
    channel_id: channelId,
    channel_type: channelType
  }: PostChatDTO,
    updatedDate: number,
    { user, headers }: IReq) {
    if (channelType !== ChannelTypeNumber.CONFERENCE) {
      return;
    }
    // update updated date
    await this.conferenceRepo.update(
      { id: channelId },
      {
        last_used: updatedDate,
        updated_date: updatedDate,
      },
    );

    await this.apiLastModifiedQueueService.addJobConference({
      apiName: ApiLastModifiedName.CONFERENCING,
      userId: user.id,
      channelId,
      updatedDate
    }, headers);
  }

  async sendLastModifiedChat(channelId: number, channelType: ChannelTypeNumber,
    updatedDate: number, { user, headers }: IReq): Promise<boolean> {
    return false;
    // const rs: boolean = false;
    // switch (channelType) {
    //   case ChannelTypeNumber.SHARED_COLLECTION:
    //     await this.apiLastModifiedQueueService.addJobCollection({
    //       apiName: ApiLastModifiedName.CHAT,
    //       userId: user.id,
    //       collectionId: channelId,
    //       updatedDate
    //     });
    //     break;
    //   case ChannelTypeNumber.CONFERENCE:
    //     await this.apiLastModifiedQueueService.addJobConference({
    //       apiName: ApiLastModifiedName.CHAT,
    //       userId: user.id,
    //       channelId,
    //       updatedDate
    //     });
    //     break;
    // }
    // return rs;
  }

  async checkPermissionBeforeChat(
    channelId: number,
    channelType: ChannelTypeNumber,
    user: IUser,
    requiredActiveUser: boolean = true,
  ) {
    let rs: number | boolean = null;
    switch (channelType) {
      case ChannelTypeNumber.SHARED_COLLECTION:
        rs = await this.checkExistSharedCollection(channelId, user);
        break;
      case ChannelTypeNumber.CONFERENCE:
        rs = await this.checkExistConference(channelId, user, requiredActiveUser);
        break;
    }
    return rs;
  }

  async checkExistSharedCollection(collectionId: number, user: IUser): Promise<boolean> {
    // 1 check owner
    const collection = await this.collectionRepo
      .findOne({
        select: ['id', 'is_trashed', 'user_id'],
        where: {
          id: collectionId
        }
      });
    // Deleted collection
    // Trashed
    if (!collection || collection?.is_trashed !== IS_TRASHED.NOT_TRASHED) {
      throw new Error(ERR_COLLECTION_ACTIVITY.COLLECTION_NOT_EDIT_PER);
    }
    // owner detected
    if (collection?.user_id === user.id) {
      return true;
    }
    // 1 check member editor
    const member = await this.sharedMemberRepo.findOne({
      select: ['id'],
      where: {
        collection_id: collectionId,
        member_user_id: user.id,
        shared_status: SHARE_STATUS.JOINED,
        access: MEMBER_ACCESS.READ_WRITE,
      },
    });

    if (!member?.id) {
      throw new Error(ERR_COLLECTION_ACTIVITY.COLLECTION_NOT_EDIT_PER);
    }
    return collection?.id > 0;
  }

  async checkExistConference(
    channelId: number,
    user: IUser,
    requiredActiveUser: boolean,
  ): Promise<boolean> {
    const member = await this.conferenceMemberRepo.findOne({
      select: ['id'],
      where: {
        channel_id: channelId,
        revoke_time: requiredActiveUser ? 0 : null,
        user_id: user.id,
      },
    });
    if (!member?.id) {
      throw new Error(MSG_CONFERENCE_NOT_EDIT_PER);
    }
    return member?.id > 0;
  }

  async createThumbnail(file: Express.Multer.File) {
    const image = await Jimp.read(file.buffer);
    // Resize the image
    image.resize(Jimp.AUTO, this.thumbnailHeight);
    // Get the resized image buffer
    const resizedBuffer = await image.getBufferAsync(file.mimetype); // Adjust MIME type if needed
    return resizedBuffer;
  }

  async fileSingleUpload(dataFile: ChimeFileDTO,
    files: Express.Multer.File[], { user, headers }: IReq) {
    try {
      const itemFail = [];
      const itemPass = [];
      const { channel_id, channel_type, message_uid } = dataFile;
      // check upload permission
      const currentTime = getUtcMillisecond();
      const timeLastModify = [];
      await this.checkPermissionBeforeChat(channel_id, channel_type, user);

      await Promise.all(files.map(async (file: Express.Multer.File, idx) => {
        const mineTypeFile = file.mimetype; // get mime type of file
        const ext = FileUploadUtil.getFileTypeFromFileName(file.originalname);
        const size = file.size;
        const filename = file.originalname || 'unknown';
        const newUid = this.s3Util.GenUid();
        const dir = CryptoUtil.converToMd5(user.email);

        // create thumbnail if file is image
        if (mineTypeFile.startsWith('image/')) {
          const thumbFilename = `${THUMBNAIL_TYPE.prefix}${mineTypeFile}`;
          const thumbSource = this.s3Util.GenSource(this.s3Path, newUid, dir, thumbFilename);
          const thumbBuffer = await this.createThumbnail(file);
          const thumpUpload =
            await this.s3Util.uploadFromBuffer(thumbBuffer, mineTypeFile, thumbSource);
          if (!thumpUpload) {
            const error = buildFailItemResponse(ErrorCode.BAD_REQUEST,
              MSG_ERR_UPLOAD, dataFile);
            return itemFail.push(error);
          }
        }

        const source = this.s3Util.GenSource(this.s3Path, newUid, dir, mineTypeFile);
        const isUpload = await this.s3Util.uploadFromBuffer(file.buffer, mineTypeFile, source);
        if (!isUpload) {
          const error = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_UPLOAD, dataFile);
          return itemFail.push(error);
        }
        const dateItem = getUpdateTimeByIndex(currentTime, idx);
        timeLastModify.push(dateItem);
        // step1: save file into file common table
        const fileEnity = this.fileCommonRepo.create({
          user_id: user.userId,
          uid: newUid,
          ext,
          mime: mineTypeFile,
          filename,
          dir,
          size,
          created_date: dateItem,
          updated_date: dateItem,
        });
        const rsFileCommon = await this.fileCommonRepo.save(fileEnity);
        await this.quotaRepo.changeQuotaFileCommon(size, user.email);
        // get name of type channel
        const channelTypeName = this.getChannelTypeFromNumber(channel_type);
        // create link file common
        const linkFileCommonEntity = this.linkedFileRepo.create({
          user_id: user.userId,
          source_id: channel_id,
          source_uid: message_uid,
          source_type: channelTypeName,
          file_common_id: rsFileCommon.id
        });
        await this.linkedFileRepo.save(linkFileCommonEntity);
        itemPass.push(rsFileCommon);
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
    } catch (error) {
      throw new BadRequestException(
        buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, dataFile),
      );
    }
  }

  async download(data: ChatDownloadDTO, { user, headers }: IReq): Promise<any> {
    const dtoDownload = plainToClass(ChatDownloadDTO, data);
    try {
      const { channel_id, channel_type, file_uid, thumb } = dtoDownload;
      // check upload permission
      await this.checkPermissionBeforeChat(channel_id, channel_type, user);
      const timeJoined: number = await this.getMinAfterTimeSend(
        channel_id,
        channel_type,
        user,
        0,
      );
      const fileData = await this.linkedFileRepo
      .getFileByChanleIdAndTimeDownload(file_uid, channel_id, timeJoined);

      if (!fileData) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
          MSG_FILE_NOT_EXIST, dtoDownload);
        return errItem;
      }
      let thumbImage = fileData.mime;
      if (thumb === 1) {
        const isImage = fileData.mime.startsWith('image/');
        if (isImage) {
          thumbImage = `${THUMBNAIL_TYPE.prefix}${fileData.mime}`;
        } else {
          const ext = fileData.ext;
          const urlDownload = `${this.thumbnailUrl}/thumb/${ext.toLocaleLowerCase()}.png`;
          try {
            await this.httpClient.head(urlDownload).toPromise();
            return {
              code: ErrorCode.REQUEST_SUCCESS,
              url: urlDownload,
            };
          } catch (error) {
            try {
              const otherExt = FileUploadUtil.getTypeFile(ext);
              const otherExtDownload = `${this.thumbnailUrl}/thumb/${otherExt.toLocaleLowerCase()}.png`;
              return {
                code: ErrorCode.REQUEST_SUCCESS,
                url: otherExtDownload,
              };
            } catch (error) {
              return {
                code: ErrorCode.REQUEST_SUCCESS,
                urlDownload: `${this.thumbnailUrl}/thumb/unkown.png`
              };
            }
          }
        }
      }
      const source = this.s3Util.GenSource(this.s3Path, file_uid, fileData.dir, thumbImage);
      const isExistFile = await this.s3Util.FileExist(source);
      if (isExistFile === false) {
        return {
          code: ErrorCode.FILE_NOT_FOUND,
          message: MSG_ERR_DOWNLOAD,
        };
      }

      const expires = uploadConfig().s3DownloadExpireTime;
      const s3Object = await this.s3Util.DownloadUrl(source, +expires);
      return {
        code: ErrorCode.REQUEST_SUCCESS,
        url: s3Object.url,
      };
    } catch (error) {
      const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
        error.message, dtoDownload);
      return errItem;
    }
  }
}