import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import {
  ApiLastModifiedName,
  DELETED_ITEM_TYPE, SOURCE_TYPE_FILE_COMMON
} from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import {
  ERR_COLLECTION_ACTIVITY, MSG_ERR_DOWNLOAD, MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_UPLOAD,
  MSG_ERR_WHEN_DELETE,
  MSG_FIND_NOT_FOUND
} from '../../common/constants/message.constant';
import { IReq, IUser } from '../../common/interfaces';
import { LoggerService } from '../../common/logger/logger.service';
import { DeletedItemRepository } from '../../common/repositories/deleted-item.repository';
import { FileCommonRepository } from '../../common/repositories/file-common.repository';
import { QuotaRepository } from '../../common/repositories/quota.repository';
import { LastModify, filterDuplicateItemsWithKey, generateLastModifyItem } from '../../common/utils/common';
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
import { DeleteFileDTO } from './dtos/delete.dto';
import { GetDownloadDto } from './dtos/download.get.dto';
import { CreateFileDTO } from './dtos/upload.create.dto';

@Injectable()
export class CommentAttachmentService {
  private s3Util: S3Utility;
  private readonly s3Path: string;

  constructor(
    private readonly file: FileCommonRepository,
    private readonly deleteItem: DeletedItemRepository,
    private readonly quota: QuotaRepository,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly loggerService: LoggerService,
  ) {
    this.s3Path = cfgAWS().s3Path;

    this.s3Util = S3Util({
      endpoint: cfgAWS().s3Endpoint,
      region: cfgAWS().s3Region,
      accessKeyId: cfgAWS().s3AccessKeyId,
      secretAccessKey: cfgAWS().s3SecretAccessKey,
    }, cfgAWS().s3Bucket || 'bucket_name');
  }

  async download(params: GetDownloadDto, user: IUser): Promise<any> {
    try {
      const item = await this.file.checkRoleDownload(params, user);
      if (!item || !item.id) {
        return {
          code: ErrorCode.BAD_REQUEST,
          message: MSG_ERR_DOWNLOAD
        };
      }
      const source = this.s3Util.GenSource(this.s3Path, params.uid, item.dir, item.ext);
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
      return {
        code: ErrorCode.BAD_REQUEST,
        message: MSG_ERR_DOWNLOAD
      };
    }
  }

  async fileSingleUpload(createFileDTO: CreateFileDTO, file: Express.Multer.File
    , ext: string, { user, headers }: IReq) {
    try {
      const dateItem = getUtcSecond();
      const size = file.size;
      const filename = file.originalname || 'unknown';

      const roleItem = await this.file.checkRoleUpload(createFileDTO, user);
      const filterMsg = this.file.filterMessage(roleItem, user.userId
        , ERR_COLLECTION_ACTIVITY.MSG_ERR_DELETE_COMMENT_FAILED);
      if (filterMsg.error) {
        throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
          filterMsg.msg, createFileDTO));
      }
      const newUid = this.s3Util.GenUid();
      const dir = CryptoUtil.converToMd5(user.email);
      const source = this.s3Util.GenSource(this.s3Path, newUid, dir, ext);
      const isUpload = await this.s3Util.uploadFromBuffer(file.buffer, ext, source);
      if (!isUpload) {
        throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
          MSG_ERR_UPLOAD, createFileDTO));
      }

      const data = await this.file.createFileAndLinked({
        user_id: user.userId,
        uid: newUid,
        ext,
        filename,
        dir,
        size,
        created_date: dateItem,
        updated_date: dateItem,
      }, createFileDTO.comment_id, SOURCE_TYPE_FILE_COMMON.COMMENT);
      await this.file.updateComment(createFileDTO.comment_id, dateItem);
      await this.quota.changeQuotaFileCommon(size, user.email);

      this.apiLastModifiedQueueService.addJobCollection({
        apiName: ApiLastModifiedName.COLLECTION_COMMENT,
        userId: user.id,
        collectionId: roleItem.collection_id,
        updatedDate: data.created_date
      }, headers);

      delete data.user_id;
      delete data.dir;
      return data;
    } catch (error) {
      const errException = {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        attributes: createFileDTO
      };
      this.loggerService.logError(error);
      throw error;
    }
  }

  async deleteFile(data: DeleteFileDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];

    const currentTime = getUtcMillisecond();
    let lastModifies: LastModify[] = [];
    const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['uid']);
    if (dataError.length > 0) {
      dataError.map(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    await Promise.all(dataPassed.map(async (item, index) => {
      try {
        const roleItem = await this.file.checkRoleDelete(item, user);
        const filterMsg = this.file.filterMessage(roleItem, user.userId
          , MSG_FIND_NOT_FOUND, true);
        if (filterMsg.error) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, filterMsg.msg, item);
          itemFail.push(errItem);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, index);
          const source = this.s3Util.GenSource(this.s3Path
            , roleItem.uid, roleItem.dir, roleItem.ext);
          this.s3Util.Delete(source);

          const collectionId = roleItem['collection_id'];
          const commentId = roleItem['comment_id'];
          lastModifies = generateLastModifyItem(lastModifies,
            collectionId, dateItem);
          await this.deleteItem.generateDeletedItemForShared({
            vItemType: DELETED_ITEM_TYPE.COMMENT_ATTACHMENT
            , nCollectionId: collectionId
            , nItemId: roleItem.id
            , nDeleteDate: dateItem
            , nOwnerUserId: roleItem['co_user_id']
          });
          await this.file.deleteFileAndLinked({ id: roleItem.id, user_id: user.userId });
          await this.file.updateComment(commentId, dateItem);
          await this.quota.changeQuotaFileCommon(-roleItem.size, user.email);
          itemPass.push(item);
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
        this.loggerService.logError(error);
        itemFail.push(errItem);
      }
    }));

    this.apiLastModifiedQueueService
      .sendLastModifiedByCollectionId(lastModifies,
        ApiLastModifiedName.COLLECTION_COMMENT, headers);

    return { itemPass, itemFail };
  }
}