import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from 'aws-sdk';
import { ShareMember } from 'src/common/entities';
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import { ApiLastModifiedName, JobName } from '../../common/constants';
import { DELETED_ITEM_TYPE, DOWNLOAD_URL_FILE, IS_TRASHED, MEMBER_ACCESS, SHARE_STATUS } from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_DOWNLOAD,
  MSG_ERR_LINK, MSG_ERR_UPLOAD, MSG_ERR_WHEN_DELETE,
  MSG_FIND_NOT_FOUND
} from '../../common/constants/message.constant';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import {
  LinkedCollectionObject
} from '../../common/entities/linked-collection-object.entity';
import { IReq } from '../../common/interfaces';
import { IDeleteItem, IItemDelete } from '../../common/interfaces/delete-item.interface';
import { ShareMemberRepository } from '../../common/repositories';
import { FileAttachmentRepository } from '../../common/repositories/file-attachment.repository';
import {
  ItemWithoutDuplicates,
  getReadableStream,
  getValueFromArrayObj,
  memberIDWithoutDuplicates,
  randomStringGenerator, userIDWithoutDuplicates
} from '../../common/utils/common';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import cfgAWS from '../../configs/aws';
import { ApiLastModifiedQueueService, LastModified, LastModifiedMember } from '../bullmq-queue/api-last-modified-queue.service';
import { FileAttachmentQueueService } from '../bullmq-queue/file-queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { DeleteFileDTO } from './dtos/file-member-delete.dto';
import { FileMemberDownloadDTO } from './dtos/file-member-download.dto';
import { FileMemberDTO } from './dtos/file-member.dto';
interface ShareMemberFile {
  collection_id: number;
  member_user_id: number;
  access: number[];
  shared_status: number;
}
@Injectable()
export class FileMemberService {
  private readonly s3Path: string;
  private readonly AWS_S3_BUCKET_NAME: string;
  private readonly s3: S3;

  constructor(
    private readonly fileMemberRepo: FileAttachmentRepository,
    private readonly shareMemberRepo: ShareMemberRepository,
    @InjectRepository(LinkedCollectionObject)
    private readonly linkedCollectionObject: Repository<LinkedCollectionObject>,
    private readonly fileAttachmentQueueService: FileAttachmentQueueService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly deletedItem: DeletedItemService) {
    this.s3 = new S3({
      endpoint: cfgAWS().s3Endpoint,
      region: cfgAWS().s3Region,
      accessKeyId: cfgAWS().s3AccessKeyId,
      secretAccessKey: cfgAWS().s3SecretAccessKey
    });
    this.s3Path = cfgAWS().s3Path;
    this.AWS_S3_BUCKET_NAME = cfgAWS().s3Bucket || 'bucket_name';
  }

  async getAllFiles(filter: BaseGetDTO, member_user_id: number) {
    const { modified_gte, modified_lt, page_size, collection_id } = filter;
    let deletedItems = [];
    let dataFile = [];
    if (collection_id) {
      dataFile = await this.databaseUtilitiesService.syncFileByMember({
        collectionIds: [collection_id],
        filter,
        repository: this.fileMemberRepo,
      });
    } else {
      const lstDataShare = await this.shareMemberRepo.find({
        select: ['collection_id'],
        where: {
          member_user_id,
          shared_status: SHARE_STATUS.JOINED
        }
      });
      if (lstDataShare.length > 0) {
        const collectionIds = getValueFromArrayObj(lstDataShare, 'collection_id');
        dataFile = await this.databaseUtilitiesService.syncFileByMember({
          collectionIds,
          filter,
          repository: this.fileMemberRepo,
        });
      }
    }
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(member_user_id, DELETED_ITEM_TYPE.FILE_MEMBER, {
        modified_gte,
        modified_lt,
        page_size
      });
    }

    return {
      data: dataFile,
      data_del: deletedItems
    };
  }

  async checkPermissionMember(options: ShareMemberFile) {
    const { member_user_id, collection_id, shared_status, access } = options;
    const query = this.shareMemberRepo
      .createQueryBuilder('sm')
      .select(['u.email AS owner_email', 'sm.user_id AS owner_user_id', 'sm.id AS id'])
      .innerJoin('user', 'u', `u.id = sm.user_id`)
      .where('sm.member_user_id = :member_user_id', { member_user_id })
      .andWhere('sm.collection_id = :collection_id', { collection_id })
      .andWhere('sm.shared_status = :shared_status', { shared_status })
      .andWhere('sm.access in (:...access)', { access });

    return await query.getRawOne();
  }

  public async createMemberForDeleteItem(allMembers: ShareMember[], itemDelete: IItemDelete) {
    const respond: {
      deleteItems: IDeleteItem[], memberLasModify: LastModifiedMember[]
    } = { deleteItems: [], memberLasModify: [] };

    const arrayData = allMembers.reduce((rs, member) => {
      rs.deleteItems.push({
        item_id: itemDelete.itemId,
        user_id: member.member_user_id,
        item_type: DELETED_ITEM_TYPE.FILE_MEMBER,
        created_date: itemDelete.updatedDate,
        updated_date: itemDelete.updatedDate
      });
      rs.memberLasModify.push({
        email: member.shared_email,
        memberId: member.member_user_id,
        updatedDate: itemDelete.updatedDate
      });
      return rs;
    }, respond);
    await this.deletedItem.createMultiple(arrayData.deleteItems);
    return arrayData.memberLasModify;
  }

  async downloadSingleFile(reqParam: FileMemberDownloadDTO, userId: number)
    : Promise<{ stream: Readable, resContent: object }> {
    const { uid, collection_id } = reqParam;
    // check permission of member by collection_id, member_user_id and share_status
    const itemShare = await this.checkPermissionMember({
      collection_id,
      member_user_id: userId,
      shared_status: SHARE_STATUS.JOINED,
      access: [
        ...Object.values(MEMBER_ACCESS).map(Number).filter(Boolean)
      ]
    });

    if (!itemShare) {
      throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
        MSG_ERR_LINK.COLLECTION_NOT_EDIT_PER, reqParam));
    }

    const itemFile = await this.databaseUtilitiesService.syncFileMemberByObjectUid({
      repository: this.fileMemberRepo,
      userId: itemShare.owner_user_id,
      colId: reqParam.collection_id,
      uid
    });

    if (!itemFile) {
      throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
        MSG_FIND_NOT_FOUND, reqParam));
    }

    if (itemFile.trashed !== IS_TRASHED.NOT_TRASHED) {
      throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
        MSG_ERR_LINK.LINK_TRASHED, reqParam));
    }

    try {
      const md5Email = CryptoUtil.converToMd5(itemFile['owner']);
      const keyDownload = `${this.s3Path}${md5Email}/${uid}${itemFile['ext']}`;
      const wsa: any = await this.s3.getObject({
        Bucket: this.AWS_S3_BUCKET_NAME,
        Key: keyDownload
      }).promise();

      const resContent = {
        'Content-Disposition': 'attachment',
        'Content-Type': itemFile['ext'] || 'unknown',
        'Content-Length': (wsa.Body).length,
      };
      const stream = getReadableStream(wsa.Body);
      return {
        stream,
        resContent
      };
    } catch (e) {
      throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
        MSG_ERR_DOWNLOAD, reqParam));
    }
  }

  async fileSingleUpload(item: FileMemberDTO, file: any, ext: string,
    { user, headers }: IReq) {
    try {
      let respondData = null;
      const currentTime = getUtcMillisecond();
      const dateItem = getUpdateTimeByIndex(currentTime, 0);
      const { local_path, uid, object_uid, object_type, collection_id } = item;
      let client_id: string = item.client_id;
      const size = file.size;
      const filename = file.originalname || 'unknown';

      // check permission of member by collection_id, member_user_id and share_status
      const itemShare = await this.checkPermissionMember({
        collection_id,
        member_user_id: user.id,
        access: [MEMBER_ACCESS.READ_WRITE],
        shared_status: SHARE_STATUS.JOINED
      });

      if (!itemShare) {
        throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
          MSG_ERR_LINK.COLLECTION_NOT_EDIT_PER, item));
      }

      // check object_ui is existed in link collection object table
      const itemLinkCollectionObject = await this.linkedCollectionObject.findOne({
        select: ['id', 'is_trashed'],
        where: {
          collection_id,
          object_uid: Buffer.from(object_uid)
        }
      });

      if (!itemLinkCollectionObject) {
        throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
          MSG_ERR_LINK.LINK_NOT_EXIST, item));
      }
      if (itemLinkCollectionObject.is_trashed !== IS_TRASHED.NOT_TRASHED) {
        throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
          MSG_ERR_LINK.LINK_TRASHED, item));
      }

      const md5Email = CryptoUtil.converToMd5(itemShare.owner_email);
      // uid is blank, it will auto create new record, client id
      if (!uid) {
        if (!item.client_id) client_id = randomStringGenerator();
        const newUid = randomStringGenerator();
        const url = `${DOWNLOAD_URL_FILE}${newUid}`;
        const keyUpload = `${this.s3Path}${md5Email}/${newUid}${ext}`;

        const isUpload = await this.uploadPrivateFile(file.buffer, ext, keyUpload);
        if (!isUpload) {
          throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
            MSG_ERR_UPLOAD, item));
        }

        const colEntity = this.fileMemberRepo.create({
          user_id: itemShare.owner_user_id,
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
        respondData = await this.fileMemberRepo.save(colEntity);
      } else {
        const itemFile = await this.fileMemberRepo.findOne({
          where: {
            uid,
            user_id: itemShare.owner_user_id
          }
        });

        if (!itemFile) {
          throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
            MSG_FIND_NOT_FOUND, item));
        }
        const keyUpload = `${this.s3Path}${md5Email}/${uid}${ext}`;
        const isUpload = await this.uploadPrivateFile(file.buffer, ext, keyUpload);
        if (!isUpload) {
          throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST,
            MSG_ERR_UPLOAD, item));
        }

        respondData = await this.fileMemberRepo.save({
          ...itemFile, // existing fields
          ...item,// updated fields,
          updated_date: dateItem
        });
      }

      // get all member by collection_id
      const itemMembers = await this.shareMemberRepo.find({
        select: ['member_user_id'],
        where: { collection_id }
      });

      if (itemMembers.length > 0) {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.FILE,
          userId: itemShare.owner_user_id,
          email: itemShare.owner_email,
          updatedDate: dateItem
        }, headers);
        // push last modify for each member
        await Promise.all(itemMembers.map(async (userMember) => {
          this.apiLastModifiedQueueService.addJob({
            apiName: ApiLastModifiedName.FILE_MEMBER,
            userId: userMember.member_user_id,
            email: itemShare.owner_email,
            updatedDate: dateItem
          }, headers);
        }));
      }
      return respondData;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
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
      return false;
    }
  }

  async deleteMemberFile(data: DeleteFileDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const ownerUsers: LastModified[] = [];
    const memberUsers: LastModifiedMember[] = [];
    const currentTime = getUtcMillisecond();
    const timeLastModifyMember: number[] = [];

    // remove duplicate id
    const removeDuplicateItem = ItemWithoutDuplicates(data);
    await Promise.all(removeDuplicateItem.map(async (item, idx) => {
      try {
        const { uid, collection_id } = item;
        const itemShare = await this.checkPermissionMember({
          collection_id,
          member_user_id: user.id,
          shared_status: SHARE_STATUS.JOINED,
          access: [MEMBER_ACCESS.READ_WRITE]
        });

        if (!itemShare) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
            MSG_ERR_LINK.COLLECTION_NOT_EDIT_PER, item);
          itemFail.push(errItem);
        } else {
          const itemFile: string = await this.databaseUtilitiesService.syncFileMemberByObjectUid({
            repository: this.fileMemberRepo,
            userId: itemShare.owner_user_id,
            colId: collection_id,
            uid
          });
          if (!itemFile) {
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
              MSG_FIND_NOT_FOUND, item);
            itemFail.push(errItem);
          } else {
            const dateItem = getUpdateTimeByIndex(currentTime, idx);
            timeLastModifyMember.push(dateItem);
            // get all member by collection_id
            const allMembers: ShareMember[] = await this.shareMemberRepo.find({
              select: ['member_user_id', 'shared_email'],
              where: { collection_id }
            });
            const itemDelete: IItemDelete = {
              collectionId: collection_id,
              itemId: itemFile['id'],
              updatedDate: dateItem
            };
            const [, memberLastModified = []] = await Promise.all([
              await this.deleteFileWasabi(itemShare.user_id, uid, itemFile['ext']),
              await this.createMemberForDeleteItem(allMembers, itemDelete),
              await this.deletedItem.create(itemShare.user_id, {
                item_id: itemFile['id'],
                item_type: DELETED_ITEM_TYPE.FILE,
                created_date: dateItem,
                updated_date: dateItem
              }),
              await this.fileMemberRepo.delete({
                id: itemDelete.itemId,
                user_id: itemShare.user_id
              })
            ]);
            // add member id to push last modify
            if (memberLastModified.length > 0) {
              memberUsers.push(...memberLastModified);
            }
            ownerUsers.push({
              // collectionId: collection_id,
              userId: itemShare.owner_user_id,
              email: itemShare.owner_email,
              updatedDate: dateItem
            });
            itemPass.push({ id: itemShare.id });
          }
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
        itemFail.push(errItem);
      }
    }));

    // remove duplicate user owner
    // push last modify for each owner
    await Promise.all(userIDWithoutDuplicates(ownerUsers).map(async (item) => {
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.FILE,
        userId: item.userId,
        email: item.email,
        updatedDate: item.updatedDate
      }, headers);
    }));
    // push last modify for each member
    await Promise.all(memberIDWithoutDuplicates(memberUsers).map(async (item) => {
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.FILE_MEMBER,
        userId: item.memberId,
        email: item.email,
        updatedDate: item.updatedDate
      }, headers);
    }));
    return { itemPass, itemFail };
  }

  public async deleteFileWasabi(userId: number, uid: string, ext: string) {
    return this.fileAttachmentQueueService.addJob(JobName.DELETE_FILE, {
      userId,
      data: { ext, uid }
    });
  }
}
