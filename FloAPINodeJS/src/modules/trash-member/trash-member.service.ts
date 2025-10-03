import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository } from 'typeorm';
import {
  ApiLastModifiedName,
  IS_TRASHED, MEMBER_ACCESS, OBJECT_SHARE_ABLE, SHARE_STATUS, TRASH_TYPE
} from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_ID_UID_NOT_BLANK,
  MSG_ERR_LINK,
  MSG_ERR_NOT_EXIST,
  MSG_ERR_WHEN_CREATE
} from '../../common/constants/message.constant';
import { GeneralObjectId, LINK_OBJ_TYPE } from '../../common/dtos/object-uid';
import { LinkedCollectionObject } from '../../common/entities/linked-collection-object.entity';
import { ShareMember } from '../../common/entities/share-member.entity';
import { TrashEntity } from '../../common/entities/trash.entity';
import { IReq } from '../../common/interfaces';
import { LoggerService } from '../../common/logger/logger.service';
import { RuleRepository } from '../../common/repositories/rule.repository';
import { TrashRepository } from '../../common/repositories/trash.repository';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { TrashQueueService } from '../bullmq-queue/trash-queue.service';
import { SieveEmailService } from '../manual-rule/sieve.email';
import { ShareMemberService } from '../share-member/share-member.service';
import { TrashMemberCreateDto } from './dtos/trash-member.create.dto';
import { log } from 'console';
export type UserLastModified = {
  userId: number;
  email: string;
  updatedDate: number;
};
@Injectable()
export class TrashMemberService {
  constructor(
    private readonly trashRepository: TrashRepository,
    private readonly manualRuleRepo: RuleRepository,
    private readonly queueTrash: TrashQueueService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly shareMemberService: ShareMemberService,
    @InjectRepository(LinkedCollectionObject)
    private readonly linkRepository: Repository<LinkedCollectionObject>,
    private readonly sieveEmailService: SieveEmailService,
    private readonly logger: LoggerService
  ) { }

  private filterReponse(trash: TrashEntity) {
    let object_uid;
    if (trash.object_uid) {
      object_uid = new GeneralObjectId({ uidBuffer: trash.object_uid }).getPlain();
    }
    return {
      ...trash,
      user_id: undefined,
      object_uid
    };
  }

  private async getPermissionForTrash(user_id: number, params: TrashMemberCreateDto[]) {
    const object_ids: number[] = [];
    const object_uids: string[] = [];
    const object_types = [];
    const allSharedMembers: ShareMember[] = [];
    for (const p of params) {
      object_types.push(p.object_type);
      if (p.object_uid && p.object_type !== OBJECT_SHARE_ABLE.URL) {
        object_uids.push(p.object_uid.objectUid?.toString());
      }
      if (p.object_id && p.object_type === OBJECT_SHARE_ABLE.URL) {
        object_ids.push(p.object_id);
      }
    }

    if (object_ids.length > 0) {
      const rs: ShareMember[] = await this.shareMemberService
        .getShareMembersForTrashByObjectId(user_id
          , object_ids, object_types);
      allSharedMembers.push(...rs);
    }

    if (object_uids.length > 0) {
      const rs: ShareMember[] = await this.shareMemberService
        .getShareMembersForTrash(user_id
          , object_uids, object_types);
      allSharedMembers.push(...rs);
    }

    return allSharedMembers;
  }

  private checkPermission(perItems: ShareMember[], linkParams, errors) {
    const okParams = [];
    linkParams.forEach(item => {
      const found: ShareMember = perItems.find(mem => {
        const memUid: string = new GeneralObjectId({
          uidBuffer: mem['object_uid']
        }).getPlain();
        const memObjType: string = new GeneralObjectId({
          uidBuffer: mem['object_type']
        }).getPlain();
        return (memObjType === item.object_type
          && ((item.object_id && mem['object_id'] === item.object_id)
            || (memUid === item?.object_uid?.objectUid?.toString())));
      });

      if (found) {
        if (found.shared_status !== SHARE_STATUS.JOINED) {
          errors.push({
            attributes: {
              object_uid: item.object_uid,
              object_id: item.object_id,
              object_type: item.object_type,
            },
            code: ErrorCode.COLLECTION_NOT_JOIN,
            message: MSG_ERR_LINK.COLLECTION_NOT_JOIN,
          });
        } else if (found.access === MEMBER_ACCESS.READ_WRITE) {
          okParams.push({
            ownerId: found.user_id,
            email: found.email,
            collection_id: found['collection_id'],
            linkParam: {
              ...item,
              object_uid: new GeneralObjectId({
                uidBuffer: found['object_uid']
              }),
              object_id: found['object_id']
            }
          });
        } else {
          errors.push({
            attributes: {
              object_uid: item.object_uid,
              object_id: item.object_id,
              object_type: item.object_type,
            },
            code: ErrorCode.COLLECTION_NOT_EDIT_PER,
            message: MSG_ERR_LINK.COLLECTION_NOT_EDIT_PER,
          });
        }
      } else {
        errors.push({
          attributes: {
            object_uid: item.object_uid,
            object_id: item.object_id,
            object_type: item.object_type,
          },
          code: ErrorCode.COLLECTION_NOT_FOUND,
          message: MSG_ERR_LINK.COLLECTION_NOT_EXIST,
        });
      }
    });
    return okParams;
  }

  private async createTrashItem(
    dto: TrashMemberCreateDto,
    createDate: number,
    ownerId: number,
    errors: { message: string; code: ErrorCode; attributes: any }[],
  ) {
    if (!dto.object_uid && !dto.object_id) {
      errors.push({
        message: MSG_ERR_ID_UID_NOT_BLANK,
        code: ErrorCode.INVALID_DATA,
        attributes: dto,
      });
      return;
    }
    let trash_time: number = dto.trash_time;
    if (!trash_time) {
      trash_time = createDate;
    }
    const ownerHref: string = await this.getOwnerHref(ownerId, dto);
    const trash: TrashEntity = this.trashRepository.create({
      user_id: ownerId,
      trash_time,
      object_id: dto.object_id,
      object_type: dto.object_type,
      object_href: ownerHref,
      created_date: createDate,
      updated_date: createDate
    });
    if (dto.object_uid) {
      trash.object_uid = dto.object_uid.objectUid;
    }
    // fix bug 1827
    trash['oldHref'] = dto.object_href || '';
    if (dto.ref) {
      trash['ref'] = dto.ref;
    }
    return trash;
  }

  async saveBatch(
    params: TrashMemberCreateDto[],
    errors: any,
    { user, headers }: IReq
  ): Promise<{ results: any; errors: any }> {
    const results = [];
    const currentTime = getUtcMillisecond();
    const ownerLastModify: UserLastModified[] = [];
    const memberLastModify: UserLastModified[] = [];
    const colIds = [];
    let okParams;
    if (params.length > 0) {
      const existedItems: ShareMember[] = await this.getPermissionForTrash(user.userId, params);
      okParams = this.checkPermission(existedItems, params, errors);
      await Promise.all(
        okParams.map(async (okParam, idx) => {
          const dateItem: number = getUpdateTimeByIndex(currentTime, idx);
          const trashEntity: TrashEntity = await this
            .createTrashItem(okParam.linkParam, dateItem, okParam.ownerId, errors);
          if (!trashEntity) return;
          try {
            const res = await this.save(trashEntity);
            if (res && res.id) {
              ownerLastModify.push({
                userId: okParam.ownerId,
                email: okParam.email,
                updatedDate: dateItem
              });
              const allMember: ShareMember[] = await this
                .getAllMemberToSendLastModify(okParam.collection_id);
              const allMemberLastModify: any = allMember
                .map(mem => ({
                  userId: mem.member_user_id,
                  email: mem.shared_email,
                  updatedDate: dateItem
                }));
              memberLastModify.push(...allMemberLastModify);
              // fix bug 1827s
              res.object_href = res['oldHref'];
              delete res['oldHref'];
              results.push(res);
              if (trashEntity.object_type === TRASH_TYPE.FOLDER) {
                colIds.push(trashEntity.object_id);
              }
            } else {
              errors.push({
                message: MSG_ERR_WHEN_CREATE,
                code: ErrorCode.INVALID_DATA,
                attributes: this.filterReponse(trashEntity),
              });
            }
          } catch (err) {
            this.logger.logError(err);
            errors.push({
              message: err.sqlMessage ? err.sqlMessage : err.message,
              code: ErrorCode.BAD_REQUEST,
              errno: err.errno,
              attributes: this.filterReponse(trashEntity),
            });
          }
        }),
      );
    }
    if (ownerLastModify.length > 0) {
      this.removeDuplicateUserById(ownerLastModify)
        .map(async ({ userId: ownerId, email, updatedDate }) => {

          await this.apiLastModifiedQueueService.addJob({
            apiName: ApiLastModifiedName.TRASH,
            userId: ownerId,
            email,
            updatedDate
          }, headers);
        });
      this.removeDuplicateUserById(memberLastModify)
        .map(async ({ userId, email, updatedDate }) =>
          await this.apiLastModifiedQueueService.addJob({
            apiName: ApiLastModifiedName.LINKED_COLLECTION_OBJECT_MEMBER,
            userId,
            email,
            updatedDate
          }, headers)
        );
    }
    await this.sieveEmailService.trashRuleByCollection(
      colIds, user.userId, user.email
      , this.manualRuleRepo
      , this.apiLastModifiedQueueService
      , IS_TRASHED.TRASHED
    );
    return { results, errors };
  }

  removeDuplicateUserById(allTimes: UserLastModified[]) {
    const setId: Set<number> = new Set(allTimes.map(usr => usr.userId));
    const allId: number[] = Array.from(setId);
    return allId.map(id => {

      const allDate = allTimes
        .filter(({ userId }) => id === userId);

      return {
        userId: id,
        email: allDate[0]?.email || '',
        updatedDate: Math.max(...allDate.map(({ updatedDate }) => updatedDate))
      };
    });
  }

  private getAllMemberToSendLastModify(collection_id: number) {
    return this.shareMemberService.getShareMembers(collection_id, null,
      Object.values(SHARE_STATUS)
        .map(Number)
        .filter(Boolean)
        .filter(v => v !== SHARE_STATUS.LEAVED));
  }
  async save(trashInfo: TrashEntity): Promise<any> {
    const trash: InsertResult = await this.trashRepository.insert(trashInfo);
    if (!trash || !trash.raw || !trash.raw.insertId) {
      throw new Error(MSG_ERR_NOT_EXIST);
    }
    const trashRes: TrashEntity = {
      id: trash.raw.insertId,
      ...trashInfo,
    };
    await this.queueTrash.afterCreated(trashRes);
    return this.filterReponse(trashRes);
  }
  private async getOwnerHref(ownerId: number, dto: TrashMemberCreateDto) {
    try {
      const object_type: string = dto.object_type;
      const link: LinkedCollectionObject = await this.linkRepository
        .findOne({
          select: ['object_href'],
          where: {
            user_id: ownerId,
            object_uid: dto.object_uid.objectUid,
            object_type: object_type as LINK_OBJ_TYPE
          }
        });
      return link.object_href;
    } catch {
      return dto.object_href;
    }
  }
}