import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from 'aws-sdk';
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import { ApiLastModifiedName, JobName } from '../../common/constants';
import { DELETED_ITEM_TYPE, DOWNLOAD_URL_FILE } from '../../common/constants/common';
import {
  MOD_FIELD
} from '../../common/constants/content-type.constant';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_LINK, MSG_ERR_UPLOAD,
  MSG_ERR_WHEN_DELETE, MSG_FIND_NOT_FOUND
} from '../../common/constants/message.constant';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { FileAttachment } from '../../common/entities/file-attachment.entity';
import { TrashEntity } from '../../common/entities/trash.entity';
import { UnknownExceptionFilter } from '../../common/filters/validation-exception.filters';
import { IReq } from '../../common/interfaces';
import { IDeleteItem } from '../../common/interfaces/delete-item.interface';
import { LoggerService } from '../../common/logger/logger.service';
import { ShareMemberRepository } from '../../common/repositories';
import { FileAttachmentRepository } from '../../common/repositories/file-attachment.repository';
import { LinkedCollectionObjectRepository } from '../../common/repositories/linked-collection-object.repository';
import {
  filterDuplicateItemsWithKey, memberIDWithoutDuplicates, randomStringGenerator
} from '../../common/utils/common';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { generateDeletedDateByLength, getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { FileAttachmentAcceptType } from '../../common/utils/upload.util';
import cfgAWS from '../../configs/aws';
import { ApiLastModifiedQueueService, LastModifiedMember } from '../bullmq-queue/api-last-modified-queue.service';
import { FileAttachmentQueueService } from '../bullmq-queue/file-queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { CreateFileDTO } from './dtos/file-attachment.dto';
import { DeleteFileDTO } from './dtos/file-delete.dto';
import { FileDownloadDTO } from './dtos/file-download.dto';

@Injectable()
export class FileService {
  private readonly s3Path: string;
  private readonly AWS_S3_BUCKET_NAME: string;
  private readonly s3: S3;

  constructor(
    private readonly fileAttachment: FileAttachmentRepository,
    private readonly shareMemberRepo: ShareMemberRepository,
    @InjectRepository(TrashEntity) private readonly trashRepository: Repository<TrashEntity>,
    private readonly fileAttachmentQueueService: FileAttachmentQueueService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly loggerService: LoggerService,
    private readonly deletedItem: DeletedItemService,
    private readonly linkedCollectionObjectRepo: LinkedCollectionObjectRepository,
  ) {
    this.s3 = new S3({
      endpoint: cfgAWS().s3Endpoint,
      region: cfgAWS().s3Region,
      accessKeyId: cfgAWS().s3AccessKeyId,
      secretAccessKey: cfgAWS().s3SecretAccessKey
    });
    this.s3Path = cfgAWS().s3Path;
    this.AWS_S3_BUCKET_NAME = cfgAWS().s3Bucket || 'bucket_name';
  }

  private async lastModifyShare({ user, headers }: IReq, object_uid: string, dateItem: number) {
    this.apiLastModifiedQueueService.addJob({
      apiName: ApiLastModifiedName.FILE,
      userId: user.id,
      email: user.email,
      updatedDate: dateItem
    }, headers);

    const collectionId: number = await this.linkedCollectionObjectRepo
      .getCollectionIdByObjectUid(Buffer.from(object_uid), user.id);
    // get all member by collection_id
    const itemMembers = await this.shareMemberRepo.find({
      select: ['member_user_id', 'shared_email'],
      where: { collection_id: collectionId }
    });
    // push last modify for each member
    await Promise.all(itemMembers.map(async (userMember) => {
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.FILE_MEMBER,
        userId: userMember.member_user_id,
        email: userMember.shared_email,
        updatedDate: dateItem
      }, headers);
    }));
  }

  async getAllFiles(filter: BaseGetDTO, user_id: number) {
    const { modified_gte, modified_lt, page_size } = filter;
    const collections: FileAttachment[] = await this.databaseUtilitiesService.getAll({
      userId: user_id,
      filter,
      repository: this.fileAttachment
    });

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(user_id, DELETED_ITEM_TYPE.FILE, {
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

  async downloadSingleFile(reqParam: FileDownloadDTO, { user, headers }: IReq)
    : Promise<{ stream: Readable, resContent: object }> {
    const { uid, client_id } = reqParam;
    const itemFile = await this.findItemFile({ where: { uid, client_id, user_id: user.id } });

    if (!itemFile) {
      throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
        MSG_FIND_NOT_FOUND, reqParam));
    }
    try {
      const md5Email = CryptoUtil.converToMd5(user.email);
      const keyDownload = `${this.s3Path}${md5Email}/${uid}${itemFile.ext}`;
      const wsa: any = await this.s3.getObject({
        Bucket: this.AWS_S3_BUCKET_NAME,
        Key: keyDownload
      }).promise();
      let contentType = null;
      for (const [k, v] of Object.entries(FileAttachmentAcceptType)) {
        const found = v.find(e => e === itemFile.ext.toLowerCase());
        if (found) contentType = `${k}/${itemFile.ext}`;
      }
      const resContent = {
        'Content-Disposition': 'attachment',
        'Content-Type': contentType || 'unknown',
        'Content-Length': (wsa.Body).length,
      };
      const stream = this.getReadableStream(wsa.Body);
      return {
        stream,
        resContent
      };
    } catch (e) {
      if (e && e.code && e.code === 'NoSuchKey') {
        throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
          MSG_FIND_NOT_FOUND, reqParam));
      }
      throw new UnknownExceptionFilter();
    }
  }

  async fileSingleUpload(createFileDTO: CreateFileDTO, file: any, ext: string,
    { user, headers }: IReq) {
    try {
      // check object uid and object type in table trash collection
      const isNoteExisted = await this.trashRepository.findOne({
        select: ['id'],
        where: {
          user_id: user.id,
          object_uid: Buffer.from(createFileDTO.object_uid),
          object_type: createFileDTO.object_type
        }
      });
      if (isNoteExisted && isNoteExisted.id > 0) {
        throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
          MSG_ERR_LINK.OBJECT_UID_TRASHED, createFileDTO));
      }

      // check object uid and object type in table delete item
      const isNoteDel = await this.deletedItem
        .findOneByUid(user.id, createFileDTO.object_type, createFileDTO.object_uid);
      if (isNoteDel) {
        throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
          MSG_ERR_LINK.OBJECT_UID_DELETE, createFileDTO));
      }

      const currentTime = getUtcMillisecond();
      const dateItem = getUpdateTimeByIndex(currentTime, 0);
      const { local_path, uid, object_uid, object_type } = createFileDTO;
      let client_id: string = createFileDTO.client_id;
      const size = file.size;
      const filename = file.originalname || 'unknown';
      // uid is blank, it will auto create new record, client id
      if (!uid) {
        if (!createFileDTO.client_id) client_id = randomStringGenerator();
        const newUid = randomStringGenerator();
        const url = `${DOWNLOAD_URL_FILE}${newUid}`;
        const md5Email = CryptoUtil.converToMd5(user.email);
        const keyUpload = `${this.s3Path}${md5Email}/${newUid}${ext}`;

        const isUpload = await this.uploadPrivateFile(file.buffer, ext, keyUpload);
        if (!isUpload) {
          throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
            MSG_ERR_UPLOAD, createFileDTO));
        }

        const colEntity = this.fileAttachment.create({
          user_id: user.id,
          uid: newUid,
          ext,
          local_path,
          filename,
          size,
          object_uid,
          object_type,
          client_id,
          url,
          created_date: dateItem,
          updated_date: dateItem,
        });
        const data = await this.fileAttachment.save(colEntity);
        await this.lastModifyShare({ user, headers }, object_uid, dateItem);

        return data;
      } else {
        const itemFile = await this.findItemFile({ where: { uid, user_id: user.id } });
        if (!itemFile) {
          throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
            MSG_FIND_NOT_FOUND, createFileDTO));
        }
        const md5Email = CryptoUtil.converToMd5(user.email);
        const keyUpload = `${this.s3Path}${md5Email}/${uid}${ext}`;
        const isUpload = await this.uploadPrivateFile(file.buffer, ext, keyUpload);
        if (!isUpload) {
          throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
            MSG_ERR_UPLOAD, createFileDTO));
        }

        const itemUpdate = this.fileAttachment.create({
          ...itemFile, // existing fields
          ...createFileDTO,// updated fields,
          updated_date: dateItem
        });
        const rs = await this.fileAttachment.save(itemUpdate);
        await this.lastModifyShare({ user, headers }, object_uid, dateItem);

        return rs;
      }

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errException = {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        attributes: createFileDTO
      };
      this.loggerService.logError(error);
      throw new InternalServerErrorException();
    }
  }

  async uploadPrivateFile(dataBuffer: Buffer, ext: string, keyUpload: string) {
    try {
      await this.s3.upload({
        Bucket: this.AWS_S3_BUCKET_NAME,
        Body: dataBuffer,
        ContentType: ext,
        Key: keyUpload,
        ACL: 'private',
      }).promise();
      return true;
    } catch (error) {
      this.loggerService.logError(error);
      return false;
    }
  }

  async deleteFile(data: DeleteFileDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];

    const deletedDates: number[] = generateDeletedDateByLength(data.length);
    const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['id', 'mod']);
    if (dataError.length > 0) {
      dataError.map(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    const deletedItemMembers: IDeleteItem[] = [];
    const lastModifyMembers: LastModifiedMember[] = [];
    await Promise.all(dataPassed.map(async (item, index) => {
      try {
        const queryField = {};
        queryField[MOD_FIELD[item.mod]] = item.id;
        queryField['user_id'] = user.id;
        const itemFile = await this.findItemFile({ where: queryField });
        if (!itemFile) {
          const errItem = buildFailItemResponse(ErrorCode.FILE_NOT_FOUND, MSG_FIND_NOT_FOUND, item);
          itemFail.push(errItem);
        } else {
          // save item to redis
          const fileRedis = await this.deleteFileWasabi(user.id, itemFile.uid, itemFile.ext);

          if (!fileRedis) { // push item into itemFail if false
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
            itemFail.push(errItem);
          } else { // remove item in file table
            await this.deletedItem.create(user.id, {
              item_id: itemFile.id,
              item_type: DELETED_ITEM_TYPE.FILE,
              created_date: deletedDates[index],
              updated_date: deletedDates[index]
            });
            // get all members
            const members = await this.fileAttachment.findShareMembers(itemFile);
            for (const member of members) {
              deletedItemMembers.push({
                item_id: itemFile.id,
                user_id: member.member_user_id,
                item_type: DELETED_ITEM_TYPE.FILE_MEMBER,
                created_date: deletedDates[index],
                updated_date: deletedDates[index],
              });
              lastModifyMembers.push({
                memberId: member.member_user_id,
                email: member.shared_email,
                updatedDate: deletedDates[index]
              });
            }

            await this.fileAttachment.delete({ id: itemFile.id, user_id: user.id });
            itemPass.push({ id: itemFile.id });
          }
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
        this.loggerService.logError(error);
        itemFail.push(errItem);
      }
    }));

    this.deletedItem.createMultiple(deletedItemMembers);
    if (itemPass.length > 0) {
      const updatedDate = Math.max(...deletedDates);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.FILE,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
      const removeDuplicateMemberIds = memberIDWithoutDuplicates(lastModifyMembers);
      // push last modify for each member
      await Promise.all(removeDuplicateMemberIds.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.FILE_MEMBER,
          userId: item.memberId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      }));
    }
    return { itemPass, itemFail };
  }

  public findItemFile(reqParam) {
    return this.fileAttachment.findOne(reqParam);
  }

  public getReadableStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  async deleteFileWasabi(userId: number, uid: string, ext: string) {
    return this.fileAttachmentQueueService.addJob(JobName.DELETE_FILE, {
      userId,
      data: { ext, uid }
    });
  }
}
