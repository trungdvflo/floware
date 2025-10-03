import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  MSG_ERR_DOWNLOAD,
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_WHEN_DELETE,
  MSG_FIND_NOT_FOUND,
} from '../../common/constants/message.constant';
import { LoggerService } from '../../common/logger/logger.service';
import {
  getUpdateTimeByIndex,
  getUtcMillisecond,
  getUtcSecond
} from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedName, AWS_S3_DOWNLOAD_EXPIRE_TIME_DEFAULT, DELETED_ITEM_TYPE } from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import { filterDuplicateItemsWithKey } from '../../common/utils/common';
import { S3Util, S3Utility } from '../../common/utils/s3.util';
import cfgAWS from '../../configs/aws';
import { ApiLastModifiedQueueService } from '../queue/api-last-modified-queue.service';
import { CreateFileDTO } from './dtos/upload.create.dto';
import { GetDownloadDto } from './dtos/download.get.dto';
import { FileCommonRepository } from '../../common/repositories/file-common.repository';
import { IUser } from '../../common/interfaces';
import { DeleteFileDTO } from './dtos/delete.dto';
import { DeletedItemRepository } from '../../common/repositories/delete-item.repository';
import { CryptoUtil } from '../../common/utils/crypto.util';

@Injectable()
export class CommentAttachmentService {
  private s3Util: S3Utility;
  private readonly s3Path: string;

  constructor(
    private readonly file: FileCommonRepository,
    private readonly deleteItem: DeletedItemRepository,
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
          message: MSG_ERR_DOWNLOAD.FILE_NOT_EXIST
        };
      }
      const source = this.s3Util.GenSource(this.s3Path, params.uid, item.dir, item.ext);
      const isExistFile = await this.s3Util.FileExist(source);
      if (isExistFile === false) {
        return {
          code: ErrorCode.FILE_NOT_FOUND,
          message: MSG_ERR_DOWNLOAD.FILE_NOT_EXIST
        };
      }

      const expires = process.env.AWS_S3_DOWNLOAD_EXPIRE_TIME
        || AWS_S3_DOWNLOAD_EXPIRE_TIME_DEFAULT;
        console.log('expiresexpiresexpires: ', expires);
      const s3Object = await this.s3Util.DownloadUrl(source, +expires);
      return {
        code: ErrorCode.REQUEST_SUCCESS,
        url: s3Object.url
      };
    } catch (error) {
      return {
        code: ErrorCode.BAD_REQUEST,
        message: MSG_ERR_DOWNLOAD.DOWNLOAD_ERROR
      };
    }
  }

  async fileSingleUpload(createFileDTO: CreateFileDTO, file: any, ext: string,
    user: IUser ) {
    try {
      const dateItem = getUtcSecond();
      const size = file.size;
      const filename = file.originalname || 'unknown';

      const roleCode = await this.file.checkRoleUpload(createFileDTO, user);
      if (roleCode === 2) {
        throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
          this.file.getErrorMessageByCode(roleCode), createFileDTO));
      }
      const newUid = this.s3Util.GenUid();
      const dir = CryptoUtil.converToMd5(user.email);
      const source = this.s3Util.GenSource(this.s3Path, newUid, dir, ext);
      const isUpload = await this.s3Util.uploadFromBuffer(file.buffer, ext, source);
      if (!isUpload) {
        throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
          MSG_ERR_DOWNLOAD.ITEM_CAN_NOT_UL, createFileDTO));
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
      }, createFileDTO.source_id, createFileDTO.source_type);

      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.FILE,
        userId: user.userId,
        updatedDate: data.created_date
      });

      return data;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errException = {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        attributes: createFileDTO
      };
      this.loggerService.error(errException);
      throw new InternalServerErrorException();
    }
  }

  async deleteFile(data: DeleteFileDTO[], user: IUser) {
    const itemPass = [];
    const itemFail = [];

    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
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
        const itemFile = await this.file.checkRoleDelete(item, user);
        if (!itemFile) {
          const errItem = buildFailItemResponse(ErrorCode.FILE_NOT_FOUND, MSG_FIND_NOT_FOUND, item);
          itemFail.push(errItem);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, index);
          const source = this.s3Util.GenSource(this.s3Path
            , itemFile.uid, itemFile.dir, itemFile.ext);
          await this.s3Util.Delete(source);

          timeLastModify.push(dateItem);
          await this.deleteItem.save({
            user_id: user.userId,
            item_id: itemFile.id,
            item_type: DELETED_ITEM_TYPE.FILE,
            created_date: dateItem,
            updated_date: dateItem
          });
          await this.file.deleteFileAndLinked({ id: itemFile.id, user_id: user.userId });
          itemPass.push(item);
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
        this.loggerService.error(errItem);
        itemFail.push(errItem);
      }
    }));

    if (itemPass.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.FILE,
        userId: user.userId,
        updatedDate
      });
    }
    return { itemPass, itemFail };
  }
}