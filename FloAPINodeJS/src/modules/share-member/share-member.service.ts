import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import {
  ApiLastModifiedName,
  CHAT_CHANNEL_TYPE,
  COLLECTION_ALLOW_TYPE,
  DELETED_ITEM_TYPE,
  IS_TRASHED, MEMBER_ACCESS, SHARE_STATUS
} from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_COLECTION_ID_INVALID as MSG_COLLECTION_ID_INVALID,
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_EXISTED,
  MSG_ERR_LINK,
  MSG_ERR_NOT_EXIST,
  MSG_ERR_SYSTEM_KANBAN,
  MSG_ERR_WHEN_CREATE, MSG_NOT_FOUND_MEMBER
} from '../../common/constants/message.constant';
import { ShareMember, Users } from '../../common/entities';
import { IReq, IUser } from '../../common/interfaces';
import { CollectionOptionsInterface } from '../../common/interfaces/collection.interface';
import { KanbanRepository, ShareMemberRepository } from '../../common/repositories';
import {
  filterDuplicateItemsWithKey,
  memberIDWithoutDuplicates, userIDWithoutDuplicates
} from '../../common/utils/common';
import { getUpdateTimeByIndex, getUtcSecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService, LastModified, LastModifiedMember } from '../bullmq-queue/api-last-modified-queue.service';
import { CollectionService } from '../collection/collection.service';
import {
  CollectionInstanceMemberService
} from '../collection_instance_member/collection-instance-member.service';
import {
  ChangeRoleCollectionEvent,
  ChannelMember,
  CollectionEvent,
  EventNames,
} from '../communication/events';
import { ChannelType, ChatMember } from '../communication/interfaces';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { KanbanService } from '../kanban/kanban.service';
import {
  CreateMemberDTO, GetAllFilterMemberItem, UnShareDTO,
  UpdateMemberDTO, UpdateStatusMemberDTO
} from './dtos';

@Injectable()
export class ShareMemberService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
    private readonly shareMemberRepo: ShareMemberRepository,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly collectionService: CollectionService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly collectionInstanceMemberService: CollectionInstanceMemberService,
    private readonly kanbanService: KanbanService,
    private readonly eventEmitter: EventEmitter2,
    private readonly deletedItem: DeletedItemService,
    private readonly kanbanRepo: KanbanRepository) { }

  async getShareMembers(collection_id: number | number[], member_user_id: number,
    shared_status: number[] = Object
      .values(SHARE_STATUS)
      .map(Number)
      .filter(Boolean)) {
    if (!collection_id || (Array.isArray(collection_id)
      && collection_id.length === 0)
      || (typeof collection_id === 'number'
        && collection_id === 0)) {
      return [];
    }
    return await this.shareMemberRepo.getShareMembers(collection_id, member_user_id, shared_status);
  }

  async getShareMembersWithCollectionInfo(member_user_id: number, col_ids: number[]) {
    return await this.shareMemberRepo.getShareMembersWithCollectionInfo(member_user_id, col_ids);
  }

  async getShareMembersForTrashByObjectId(member_user_id: number
    , object_ids: number[], object_types: string[]) {
    return await this.shareMemberRepo
      .getShareMembersForTrashByObjectId(member_user_id, object_ids, object_types);
  }

  async getShareMembersForTrash(member_user_id: number
    , object_uids: string[], object_types: string[]) {
    return await this.shareMemberRepo
      .getShareMembersForTrash(member_user_id, object_uids, object_types);
  }

  async updateMemberObject(
    options: FindOptionsWhere<ShareMember>,
    entity: QueryDeepPartialEntity<ShareMember>) {
    return this.shareMemberRepo.update(options, entity);
  }

  async getAllFiles(filter: GetAllFilterMemberItem<ShareMember>, { user, headers }: IReq) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const collections: ShareMember[] = await this.databaseUtilitiesService.getAllMember({
      userId: user.id,
      filter: { ...filter, shared_status: SHARE_STATUS.TEMP_REMOVE },
      repository: this.shareMemberRepo
    });

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(user.id, DELETED_ITEM_TYPE.MEMBER, {
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

  async getAllByMember(filter: GetAllFilterMemberItem<ShareMember>, user_id: number) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const collections: ShareMember[] = await this.databaseUtilitiesService.syncDataByMember({
      filter,
      repository: this.shareMemberRepo,
    }, user_id);

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(user_id, DELETED_ITEM_TYPE.MEMBER, {
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

  public filterDuplicateItem(data: CreateMemberDTO[]) {
    const dataError = [];
    const dataFilter = data.filter((value, index, self) => {
      if (index === self.findIndex(
        (t) =>
          t.collection_id === value.collection_id &&
          t.shared_email === value.shared_email
      )
      ) {
        return value;
      }
      dataError.push(value);
    });
    return { dataFilter, dataError };
  }

  async createMember(data: CreateMemberDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const filterData = this.filterDuplicateItem(data);

    if (filterData && filterData.dataError.length > 0) {
      filterData.dataError.map(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    if (filterData && filterData.dataFilter.length > 0) {
      const lastData = filterData.dataFilter;
      const timeLastModifyOwner: number[] = [];
      const memberUsers: LastModifiedMember[] = [];
      const memberAllUsers: LastModifiedMember[] = [];
      const currentTime = await this.shareMemberRepo.getCurrentTime();

      await Promise.all(lastData.map(async (item: CreateMemberDTO, idx) => {
        const shareCollectionType = COLLECTION_ALLOW_TYPE.SharedCollection as number;
        const { collection_id, shared_email, account_id = 0 } = item;
        try {
          const optionUser = {
            repository: this.userRepo,
            filter: {
              fields: ['id', 'email'],
              email: shared_email
            }
          };
          const rsUser = await this.databaseUtilitiesService.findOneByEmail(optionUser);
          if (!rsUser) {
            const errItem = buildFailItemResponse(ErrorCode.MEMBER_NOT_FOUND,
              MSG_NOT_FOUND_MEMBER, item);
            return itemFail.push(errItem);
          }
          const options: CollectionOptionsInterface = {
            fields: ['id', 'type', 'name'],
            conditions: {
              id: collection_id,
              user_id: user.id,
              is_trashed: IS_TRASHED.NOT_TRASHED
            }
          };
          const rsCollection = await this.collectionService
            .findOneWithCondition(options);

          if (!rsCollection) {
            const errItem = buildFailItemResponse(ErrorCode.COLLECTION_NOT_FOUND,
              MSG_ERR_LINK.COLLECTION_NOT_EXIST, item);
            return itemFail.push(errItem);
          }

          if (rsCollection && rsCollection.type !== shareCollectionType) {
            const errItem = buildFailItemResponse(ErrorCode.COLLECTION_ID_INVALID,
              MSG_COLLECTION_ID_INVALID, item);
            return itemFail.push(errItem);
          }
          // check collection_id and share_email exist?
          const shareMemberExisted = await this.shareMemberRepo.findOne({
            where: {
              user_id: user.id,
              collection_id,
              shared_email
            }
          });
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          // Real-time event data
          const eventData: CollectionEvent = {
            headers,
            from: user.email,
            collection: rsCollection,
            email: shared_email,
            type: ChannelType.SHARED_COLLECTION,
            dateItem
          };
          if (shareMemberExisted) {
            if (shareMemberExisted.shared_status < SHARE_STATUS.DECLINED) {
              const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
                MSG_ERR_EXISTED, item);
              return itemFail.push(errItem);
            }
            shareMemberExisted.shared_status = 0;
            shareMemberExisted.calendar_uri = item.calendar_uri;
            shareMemberExisted.access = item.access;
            shareMemberExisted.updated_date = dateItem;
            const itemUpdate = await this.shareMemberRepo.save(shareMemberExisted);

            if (item.ref) itemUpdate['ref'] = item.ref;
            itemPass.push(itemUpdate);
          } else {
            const colEntity = this.shareMemberRepo.create({
              user_id: user.id,
              member_user_id: rsUser.id,
              account_id,
              shared_status: 0, // always is 0 when create
              ...item,
              created_date: dateItem,
              updated_date: dateItem
            });
            const itemRespond = await this.shareMemberRepo.save(colEntity);

            if (item.ref) itemRespond['ref'] = item.ref;
            itemPass.push(itemRespond);
          }

          // send realtime event to new member
          this.eventEmitter.emit(EventNames.INVITE_COLLECTION, eventData);
          // add member id to push last modify
          memberUsers.push({
            memberId: rsUser.id,
            email: rsUser.email,
            updatedDate: dateItem
          });
          // all members
          const allMembers = await this.shareMemberRepo.find({
            where: [{
              collection_id,
              shared_status: SHARE_STATUS.JOINED
            }, { member_user_id: rsUser.id }]
          });
          allMembers.forEach(member => {
            memberAllUsers.push({
              memberId: member.member_user_id,
              email: member.shared_email,
              updatedDate: dateItem
            });
          });
          timeLastModifyOwner.push(dateItem);
        } catch (error) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_CREATE, item);
          itemFail.push(errItem);
        }
      }));

      // remove duplicate user member
      const removeDuplicateMemberIds = memberIDWithoutDuplicates(memberUsers);
      const removeDuplicateMemberAllIds = memberIDWithoutDuplicates(memberAllUsers);

      if (timeLastModifyOwner.length > 0) {
        const updatedDate = Math.max(...timeLastModifyOwner);
        // push last modify for owner

        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.SHARE_MEMBER,
          userId: user.id,
          email: user.email,
          updatedDate
        }, headers);
        // push last modify for each member
        await Promise.all(removeDuplicateMemberIds.map(async (item) => {
          this.apiLastModifiedQueueService.addJob({
            apiName: ApiLastModifiedName.COLLECTION_MEMBER,
            userId: item.memberId,
            email: item.email,
            updatedDate: item.updatedDate
          }, headers);
        }));
        await Promise.all(removeDuplicateMemberAllIds.map(async (item) => {
          this.apiLastModifiedQueueService.addJob({
            apiName: ApiLastModifiedName.SHARE_MEMBER_MEMBER,
            userId: item.memberId,
            email: item.email,
            updatedDate: item.updatedDate
          }, headers);
        }));
      }
    }

    // Create event to generate member arn
    const chimeMember: ChatMember[] = itemPass.map(
      (mm) => ({
        internal_user_id: mm.member_user_id,
        internal_user_email: mm.shared_email
      }));
    const eventChimeData: ChannelMember = {
      headers,
      user,
      members: chimeMember
    };
    this.eventEmitter.emit(EventNames.CHATTING_GENERATE_MEMBER, eventChimeData);

    return { itemPass, itemFail };
  }

  async updateMember(data: UpdateMemberDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const timeLastModifyOwner: number[] = [];
    const membersLastModified: LastModifiedMember[] = [];
    const memberAllUsers: LastModifiedMember[] = [];
    const memberUnShares = [];

    const currentTime = await this.shareMemberRepo.getCurrentTime();
    await Promise.all(data.map(async (item: UpdateMemberDTO, idx) => {
      try {
        const itemMember: ShareMember = await this.shareMemberRepo
          .getOneByCollection(item.id, user.userId);
        if (!itemMember || ![SHARE_STATUS.WAITING, SHARE_STATUS.JOINED]
          .includes(itemMember.shared_status)) {
          const errNotFound = buildFailItemResponse(ErrorCode.MEMBER_NOT_FOUND,
            MSG_ERR_NOT_EXIST, item);
          itemFail.push(errNotFound);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          timeLastModifyOwner.push(dateItem);

          const result = await this.shareMemberRepo.save({
            ...itemMember, // existing fields
            ...item,// updated fields,
            updated_date: dateItem
          });

          const options: CollectionOptionsInterface = {
            fields: ['id', 'name'],
            conditions: {
              id: itemMember.collection_id,
              is_trashed: IS_TRASHED.NOT_TRASHED
            }
          };
          const rsCollection = await this.collectionService
            .findOneWithCondition(options);
          // emit event change role member
          if (item.access !== itemMember.access) {
            if (rsCollection.id) {
              this.eventEmitter.emit(EventNames.CHANGE_ROLE_MEMBER_COLLECTION, {
                targetMember: itemMember.shared_email,
                changeByMember: user.email,
                access: item.access,
                collection_id: rsCollection.id,
                collection_name: rsCollection.name,
              } as ChangeRoleCollectionEvent);
            }
          }

          // add member id to push last modify
          membersLastModified.push({
            memberId: itemMember.member_user_id,
            email: itemMember.shared_email,
            updatedDate: dateItem
          });
          // all members
          const allMembers = await this.shareMemberRepo.find({
            where: [{
              collection_id: itemMember.collection_id,
              shared_status: SHARE_STATUS.JOINED
            }, { member_user_id: itemMember.member_user_id }]
          });
          allMembers.forEach(member => {
            memberAllUsers.push({
              memberId: member.member_user_id,
              email: member.shared_email,
              updatedDate: dateItem
            });
          });

          itemPass.push(result);

          if (item.shared_status === SHARE_STATUS.LEAVED
            || item.shared_status === SHARE_STATUS.REMOVED) {
            memberUnShares.push(itemMember);

            // Real-time event data
            const eventData: CollectionEvent = {
              headers,
              from: user.email,
              collection: rsCollection,
              email: itemMember.shared_email,
              type: ChannelType.SHARED_COLLECTION,
              dateItem
            };

            if (item.shared_status === SHARE_STATUS.REMOVED) {
              // leave real-time channel for user removed
              this.eventEmitter.emit(EventNames.REMOVED_MEMBER_FROM_COLLECTION, eventData);
            } else {
              // leave real-time channel for shared collection
              this.eventEmitter.emit(EventNames.MEMBER_LEAVE_COLLECTION, eventData);
            }
          }
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        itemFail.push(errItem);
      }
    }));

    // remove duplicate user member
    const removeDuplicateMemberIds = memberIDWithoutDuplicates(membersLastModified);
    const removeDuplicateAllMemberIds = memberIDWithoutDuplicates(memberAllUsers);

    if (timeLastModifyOwner.length > 0) {
      const updatedDate = Math.max(...timeLastModifyOwner);
      // push last modify for owner
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.SHARE_MEMBER,
        userId: user.userId,
        email: user.email,
        updatedDate
      }, headers);
      // push last modify for each member
      await Promise.all(removeDuplicateMemberIds.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.COLLECTION_MEMBER,
          userId: item.memberId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      }));
      await Promise.all(removeDuplicateAllMemberIds.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.SHARE_MEMBER_MEMBER,
          userId: item.memberId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      }));
    }
    this.deleteAfterUnShareMembers(memberUnShares);

    // call to Chime create channel
    const chimeCreateMember = itemPass.filter(item => {
      const { shared_status, access } = item;
      return ((shared_status === SHARE_STATUS.JOINED)
        && (access === MEMBER_ACCESS.OWNER || access === MEMBER_ACCESS.READ_WRITE));
    });
    if (chimeCreateMember?.length > 0) {
      const membersChime: ChatMember[] = chimeCreateMember.map(mm => ({
        internal_channel_id: mm.collection_id,
        internal_channel_type: CHAT_CHANNEL_TYPE.SHARED_COLLECTION,
        internal_user_id: mm.member_user_id,
        internal_user_email: mm.shared_email,
        ref: mm.id
      }));
      const eventChimeData: ChannelMember = {
        headers,
        members: membersChime
      };
      this.eventEmitter
        .emit(EventNames.CHATTING_CREATE_MEMBER, eventChimeData);
    }

    // Remove if access = 1
    const chimeRemoveMember = itemPass.filter(item => item.access === MEMBER_ACCESS.READ);
    if (chimeRemoveMember?.length > 0) {
      const chimeMember: ChatMember[] = chimeRemoveMember.map(
        (mm) => ({
          internal_channel_id: mm.collection_id,
          internal_channel_type: CHAT_CHANNEL_TYPE.SHARED_COLLECTION,
          internal_user_id: mm.member_user_id,
          internal_user_email: mm.shared_email
        }));
      const eventData: ChannelMember = {
        headers,
        members: chimeMember
      };
      this.eventEmitter
        .emit(EventNames.CHATTING_REMOVE_MEMBER, eventData);
    }

    return { itemPass, itemFail };
  }

  private deleteAfterUnShareMembers(memberUnShares: any[]) {
    memberUnShares.forEach((member) => {
      this.collectionInstanceMemberService
        .deleteByColIdsAndUserId([member.collection_id], {
          user: {
            id: member.member_user_id,
            email: member.shared_email
          } as IUser,
          headers: null
        });
      this.kanbanService.deleteByColIdsAndUserId([member.collection_id], member.member_user_id);
    });
  }

  async updateStatusMember(data: UpdateStatusMemberDTO[], { user, headers }: IReq) {
    const ownerUsers: LastModified[] = [];
    const itemPass = [];
    const itemFail = [];
    const timeLastModifyMember: number[] = [];
    const memberAllUsers: LastModifiedMember[] = [];
    const colIdLeaves: number[] = [];
    const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['collection_id']);

    if (dataError.length > 0) {
      dataError.map(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    const currentTime = await this.shareMemberRepo.getCurrentTime();
    await Promise.all(dataPassed.map(async (item: UpdateStatusMemberDTO, idx) => {
      try {
        const options: CollectionOptionsInterface = {
          fields: ['id', 'name'],
          conditions: {
            id: item.collection_id,
            is_trashed: IS_TRASHED.NOT_TRASHED
          }
        };
        const rsCollection = await this.collectionService
          .findOneWithCondition(options);

        if (!rsCollection) {
          const errItem = buildFailItemResponse(ErrorCode.COLLECTION_NOT_FOUND,
            MSG_ERR_LINK.COLLECTION_NOT_EXIST, item);
          return itemFail.push(errItem);
        }

        const itemMember = await this.shareMemberRepo.
          getOneMemberByMemberId(item.collection_id, user.id);

        if (!itemMember) {
          const errNotFound = buildFailItemResponse(ErrorCode.MEMBER_NOT_FOUND,
            MSG_ERR_NOT_EXIST, item);
          return itemFail.push(errNotFound);
        }
        if (itemMember.shared_status === SHARE_STATUS.REMOVED) {
          const errRemove = buildFailItemResponse(ErrorCode.MEMBER_NOT_FOUND,
            MSG_ERR_NOT_EXIST, item);
          return itemFail.push(errRemove);
        }
        if (item.shared_status === SHARE_STATUS.JOINED
          && itemMember.shared_status !== SHARE_STATUS.WAITING) {
          const errJoined = buildFailItemResponse(ErrorCode.INVITEE_NOT_FOUND,
            MSG_ERR_NOT_EXIST, item);
          return itemFail.push(errJoined);
        }
        if (item.shared_status === SHARE_STATUS.DECLINED
          && itemMember.shared_status !== SHARE_STATUS.WAITING) {
          const errDeclined = buildFailItemResponse(ErrorCode.INVITEE_NOT_FOUND,
            MSG_ERR_NOT_EXIST, item);
          return itemFail.push(errDeclined);
        }
        if (item.shared_status === SHARE_STATUS.LEAVED
          && itemMember.shared_status !== SHARE_STATUS.JOINED) {
          const errLeaved = buildFailItemResponse(ErrorCode.MEMBER_NOT_FOUND,
            MSG_ERR_NOT_EXIST, item);
          return itemFail.push(errLeaved);
        }
        const dateItem = getUpdateTimeByIndex(currentTime, idx);
        timeLastModifyMember.push(dateItem);

        const entityShareMember = this.shareMemberRepo.create({
          ...itemMember,
          ...item,
          updated_date: dateItem,
        });

        const updateResult = await this.shareMemberRepo.update({
          id: itemMember.id
        }, entityShareMember);

        // TODO: remove if no issues from QA
        // if (updateResult.affected === 0) {
        // const errItem =
        // buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_UPDATE, item);
        // return itemFail.push(errItem);
        // }

        // add member id to push last modify
        ownerUsers.push({
          userId: itemMember.user_id,
          email: itemMember.email,
          updatedDate: dateItem
        });
        // all members
        const allMembers = await this.shareMemberRepo.find({
          where: [{
            collection_id: itemMember.collection_id,
            shared_status: SHARE_STATUS.JOINED
          }, { member_user_id: itemMember.member_user_id }]
        });

        memberAllUsers.push(...allMembers
          .map(member => ({
            memberId: member.member_user_id,
            email: member.shared_email,
            updatedDate: dateItem
          })));

        // Real-time event data
        const eventData: CollectionEvent = {
          headers,
          from: user.email,
          collection: rsCollection,
          email: itemMember.shared_email,
          type: ChannelType.SHARED_COLLECTION,
          dateItem
        };

        if (item.shared_status === SHARE_STATUS.LEAVED
          || item.shared_status === SHARE_STATUS.REMOVED) {
          colIdLeaves.push(item.collection_id);

          if (item.shared_status === SHARE_STATUS.REMOVED) {
            // leave real-time channel for user removed
            this.eventEmitter.emit(EventNames.REMOVED_MEMBER_FROM_COLLECTION, eventData);
          } else {
            // leave real-time channel for shared collection
            this.eventEmitter.emit(EventNames.MEMBER_LEAVE_COLLECTION, eventData);
          }
        } else if (item.shared_status === SHARE_STATUS.JOINED) {
          // TODO: remove code commented after QA test passed with new solution
          // this.collQueueService.createSystemKanbanOfCollection(memberId, item.collection_id);
          const isGeneratedSystemKanban = await this.kanbanRepo
            .generateSystemKanban(
              item.collection_id,
              user.id,
              getUtcSecond() + (idx * 20)); // 20 buffer time
          if (isGeneratedSystemKanban === 0) {
            const errItem = buildFailItemResponse(
              ErrorCode.BAD_REQUEST, MSG_ERR_SYSTEM_KANBAN, item);
            return itemFail.push(errItem);
          }
          // leave real-time channel for shared collection
          this.eventEmitter.emit(EventNames.JOIN_COLLECTION, eventData);
          // remove un-use
        } else if (item.shared_status === SHARE_STATUS.DECLINED) {
          this.eventEmitter.emit(EventNames.DECLINE_INVITE_COLLECTION, eventData);
        }

        delete entityShareMember.shared_email;
        delete entityShareMember.member_user_id;
        itemPass.push(entityShareMember);
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        itemFail.push(errItem);
      }
    }));
    // remove duplicate user member
    // const ownerIDWithoutDuplicates = Array.from(
    //   ownerUsers.reduce((m, { ownerId, email, updatedDate }) =>
    //     m.set(ownerId, {
    //       email,
    //       updatedDate: Math.max(m.get(ownerId) || 0, updatedDate)
    //     }), new Map()),
    //   ([ownerId, { email, updatedDate }]) =>
    //     ({ ownerId, email, updatedDate }));

    const ownerIDWithoutDuplicates = userIDWithoutDuplicates(ownerUsers);
    const membersLastModified: LastModifiedMember[] = memberAllUsers.map(m => ({
      ...m,
      userId: m.memberId
    }));

    const removeDuplicateAllMemberIds = memberIDWithoutDuplicates(membersLastModified);
    if (timeLastModifyMember.length > 0) {
      const updatedDate = Math.max(...timeLastModifyMember);
      // push last modify for each owner
      await Promise.all(ownerIDWithoutDuplicates.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.SHARE_MEMBER,
          userId: item.userId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      }));
      // push last modify for member
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.COLLECTION_MEMBER,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
      await Promise.all(removeDuplicateAllMemberIds
        .map(async (item) => {
          this.apiLastModifiedQueueService.addJob({
            apiName: ApiLastModifiedName.SHARE_MEMBER_MEMBER,
            userId: item.memberId,
            email: item.email,
            updatedDate: item.updatedDate
          }, headers);
        }));
    }

    this.collectionInstanceMemberService.deleteByColIdsAndUserId(colIdLeaves, { user, headers });
    this.kanbanService.deleteByColIdsAndUserId(colIdLeaves, user.id);

    // call to Chime create channel
    const chimeMember: ChatMember[] = itemPass
      .filter(item => {
        const { shared_status, access } = item;
        return ((shared_status === SHARE_STATUS.JOINED)
          && (access === MEMBER_ACCESS.OWNER || access === MEMBER_ACCESS.READ_WRITE));
      }).map(mm => ({
        internal_channel_id: mm.collection_id,
        internal_channel_type: CHAT_CHANNEL_TYPE.SHARED_COLLECTION,
        internal_user_id: user.id,
        internal_user_email: user.email,
        ref: mm.id
      }));
    if (chimeMember?.length > 0) {
      const eventChimeData: ChannelMember = {
        headers,
        members: chimeMember
      };
      this.eventEmitter
        .emit(EventNames.CHATTING_CREATE_MEMBER, eventChimeData);
    }
    return { itemPass, itemFail };
  }

  async unShareMember(data: UnShareDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const updatedDatesOwner = [];
    const memberUsers: LastModifiedMember[] = [];
    const memberAllUsers: LastModifiedMember[] = [];
    const memberUnShares = [];
    const currentTime = await this.shareMemberRepo.getCurrentTime();

    await Promise.all(data.map(async (item: UnShareDTO, idx) => {
      try {
        const itemMember = await this.shareMemberRepo.findOne({
          select: [
            'id', 'collection_id', 'account_id', 'member_user_id',
            'calendar_uri', 'access', 'shared_status', 'shared_email',
            'contact_uid', 'contact_href', 'created_date'
          ],
          where: { id: item.id, user_id: user.userId }
        });

        if (!itemMember
          || itemMember.shared_status === SHARE_STATUS.REMOVED
          || itemMember.shared_status === SHARE_STATUS.DECLINED
          || itemMember.shared_status === SHARE_STATUS.LEAVED) {
          const errNotFound = buildFailItemResponse(ErrorCode.MEMBER_NOT_FOUND,
            MSG_ERR_NOT_EXIST, item);
          itemFail.push(errNotFound);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          updatedDatesOwner.push(dateItem);

          await this.shareMemberRepo.update({
            id: item.id, user_id: user.userId
          }, {
            shared_status: SHARE_STATUS.REMOVED,
            updated_date: dateItem
          });

          const options: CollectionOptionsInterface = {
            fields: ['id', 'type', 'name'],
            conditions: {
              id: itemMember.collection_id,
              user_id: user.id,
              is_trashed: IS_TRASHED.NOT_TRASHED
            }
          };
          const rsCollection = await this.collectionService
            .findOneWithCondition(options);
          // Real-time event data
          const eventData: CollectionEvent = {
            headers,
            from: user.email,
            collection: rsCollection,
            email: itemMember.shared_email,
            type: ChannelType.SHARED_COLLECTION,
            dateItem
          };
          // leave real-time channel for user removed
          this.eventEmitter.emit(EventNames.REMOVED_MEMBER_FROM_COLLECTION, eventData);

          // add member id to push last modify
          memberUsers.push({
            memberId: itemMember.member_user_id,
            email: itemMember.shared_email,
            updatedDate: dateItem
          });
          // all members
          const allMembers = await this.shareMemberRepo.find({
            where: [{
              collection_id: itemMember.collection_id,
              shared_status: SHARE_STATUS.JOINED
            }, { member_user_id: itemMember.member_user_id }]
          });
          memberAllUsers.push(
            ...allMembers.map(member => ({
              memberId: member.member_user_id,
              email: member.shared_email,
              updatedDate: dateItem
            }))
          );
          itemPass.push({
            ...itemMember,
            shared_status: SHARE_STATUS.REMOVED,
            updated_date: dateItem
          });
          memberUnShares.push(itemMember);
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        itemFail.push(errItem);
      }
    }));

    // remove duplicate user member
    const removeDuplicateMemberIds = memberIDWithoutDuplicates(memberUsers);
    const removeDuplicateMemberAllIds = memberIDWithoutDuplicates(memberAllUsers);

    if (updatedDatesOwner.length > 0) {
      const updatedDate = Math.max(...updatedDatesOwner);
      // push last modify for owner
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.SHARE_MEMBER,
        userId: user.userId,
        email: user.email,
        updatedDate
      }, headers);
      // push last modify for each member
      await Promise.all(removeDuplicateMemberIds.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.COLLECTION_MEMBER,
          userId: item.memberId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      }));
      await Promise.all(removeDuplicateMemberAllIds.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.SHARE_MEMBER_MEMBER,
          userId: item.memberId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      }));
    }

    this.deleteAfterUnShareMembers(memberUnShares);

    // Create event to remove member out of channel
    if (itemPass?.length) {
      const chimeMember: ChatMember[] = itemPass?.map(
        (mm) => ({
          internal_channel_id: mm.collection_id,
          internal_channel_type: CHAT_CHANNEL_TYPE.SHARED_COLLECTION,
          internal_user_id: mm.member_user_id,
          internal_user_email: mm.shared_email
        }));
      const eventData: ChannelMember = {
        headers,
        members: chimeMember
      };
      this.eventEmitter
        .emit(EventNames.CHATTING_REMOVE_MEMBER, eventData);
    }
    return { itemPass, itemFail };
  }
}
export interface SharedMemberServiceOptions extends FindOneOptions<ShareMember> {
}
