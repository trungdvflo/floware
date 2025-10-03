import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiLastModifiedName, CHAT_CHANNEL_TYPE, DELETED_ITEM_TYPE, IS_TRASHED, SHARE_STATUS } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_NOT_EXIST
} from '../../common/constants/message.constant';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { ShareMember } from '../../common/entities';
import { Collection } from '../../common/entities/collection.entity';
import { CollectionOptionsInterface, IReq } from '../../common/interfaces';
import { filterDuplicateItemsWithKey, memberIDWithoutDuplicates } from '../../common/utils/common';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { CollectionService } from '../collection/collection.service';
import { CollectionInstanceMemberService } from '../collection_instance_member/collection-instance-member.service';
import { ChannelMember, CollectionEvent, EventNames } from '../communication/events';
import { ChannelType, ChatMember } from '../communication/interfaces';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { KanbanService } from '../kanban/kanban.service';
import { ShareMemberService } from '../share-member/share-member.service';
import { LeaveShareDTO } from './dto/leave-share.dto';

export interface CollectionServiceOptions {
  fields: (keyof Collection)[];
}
@Injectable()
export class CollectionMemberService {
  constructor(
    // we create a repository for the Collection entity
    // and then we inject it as a dependency in the service
    @InjectRepository(Collection) private readonly collection: Repository<Collection>,
    private readonly deletedItem: DeletedItemService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly shareMemberService: ShareMemberService,
    private readonly collectionInstanceMemberService: CollectionInstanceMemberService,
    private readonly kanbanService: KanbanService,
    private readonly eventEmitter: EventEmitter2,
    private readonly collectionService: CollectionService
  ) { }
  // this method retrieves all entries
  async getAllFiles(filter: BaseGetDTO, { user, headers }: IReq) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const collections: Collection[] = await this.databaseUtilitiesService.synDataMember({
      userId: user.id,
      filter: {
        ...filter,
        remove_deleted: true
      },
      repository: this.collection
    });

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(user.id, DELETED_ITEM_TYPE.FOLDER_MEMBER, {
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

  async leaveShareMember(data: LeaveShareDTO[], { user, headers }: IReq) {
    const ownerUsers = [];
    const memberAllUsers = [];
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const updatedDates = [];
    const colIds: number[] = [];

    const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['id']);
    if (dataError.length > 0) {
      dataError.forEach(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    if (dataPassed.length === 0) {
      return { itemPass, itemFail };
    }

    await Promise.all(dataPassed.map(
      async (item: LeaveShareDTO, idx) => {
        try {
          const itemMembers = await this.shareMemberService.getShareMembers(item.id, user.userId,
            Object.values(SHARE_STATUS)
              .map(Number)
              .filter(Boolean)
              .filter(v => v !== SHARE_STATUS.LEAVED));

          if (!itemMembers || itemMembers.length === 0) {
            const errNotFound = buildFailItemResponse(ErrorCode.MEMBER_NOT_FOUND,
              MSG_ERR_NOT_EXIST, item);
            itemFail.push(errNotFound);
          } else {
            const itemMember: ShareMember = itemMembers[0];
            if (itemMember.shared_status !== SHARE_STATUS.JOINED) {
              const errNotFound = buildFailItemResponse(ErrorCode.MEMBER_NOT_JOINED,
                MSG_ERR_NOT_EXIST, item);
              itemFail.push(errNotFound);
            } else {
              const dateItem = getUpdateTimeByIndex(currentTime, idx);
              updatedDates.push(dateItem);
              await this.shareMemberService.updateMemberObject({
                collection_id: item.id,
                member_user_id: user.userId,
                id: itemMember.id
              }, {
                shared_status: SHARE_STATUS.LEAVED,
                updated_date: dateItem
              });
              // add owner id to push last modify
              ownerUsers.push({
                ownerId: itemMember.user_id,
                email: itemMember.email,
                updatedDate: dateItem
              });
              // all members
              const allMembers = await this.shareMemberService
                .getShareMembers(itemMember.collection_id, user.userId, [SHARE_STATUS.JOINED]);

              allMembers.forEach(member => {
                memberAllUsers.push({
                  memberId: member.member_user_id,
                  email: member.shared_email,
                  updatedDate: dateItem
                });
              });
              itemPass.push({ id: item.id, shared_status: SHARE_STATUS.LEAVED });
              colIds.push(item.id);

              // create event notify member leave shared collection
              const options: CollectionOptionsInterface = {
                fields: ['id', 'name'],
                conditions: {
                  id: itemMember.collection_id,
                  is_trashed: IS_TRASHED.NOT_TRASHED
                }
              };
              const rsCollection = await this.collectionService
                .findOneWithCondition(options);

              const eventData: CollectionEvent = {
                headers,
                from: user.email,
                collection: rsCollection,
                email: itemMember.shared_email,
                type: ChannelType.SHARED_COLLECTION,
                dateItem
              };

              this.eventEmitter.emit(EventNames.MEMBER_LEAVE_COLLECTION, eventData);
            }
          }
        } catch (error) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
          itemFail.push(errItem);
        }
      }));

    if (updatedDates.length > 0) {
      const updatedDate = Math.max(...updatedDates);
      // push last modify for member
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.COLLECTION_MEMBER,
        userId: user.userId,
        email: user.email,
        updatedDate
      }, headers);

      // push last modify for each owner
      await Promise.all(this.ownerIDWithoutDuplicates(ownerUsers)
        .map(async (item) => {
          this.apiLastModifiedQueueService.addJob({
            apiName: ApiLastModifiedName.SHARE_MEMBER,
            userId: item.ownerId,
            email: item.email,
            updatedDate: item.updatedDate
          }, headers);
        }));

      await Promise.all(memberIDWithoutDuplicates(memberAllUsers)
        .map(async (item) => {
          this.apiLastModifiedQueueService.addJob({
            apiName: ApiLastModifiedName.SHARE_MEMBER_MEMBER,
            userId: item.memberId,
            email: item.email,
            updatedDate: item.updatedDate
          }, headers);
        }));
    }
    this.collectionInstanceMemberService.deleteByColIdsAndUserId(colIds, { user, headers });
    this.kanbanService.deleteByColIdsAndUserId(colIds, user.userId);

    // Create event to remove member out of channel
    if (colIds?.length) {
      const chimeMember: ChatMember[] = colIds?.map(
        (mm) => ({
          internal_channel_id: mm,
          internal_channel_type: CHAT_CHANNEL_TYPE.SHARED_COLLECTION,
          internal_user_id: user.userId,
          internal_user_email: user.email
        }));
      const eventData: ChannelMember = {
        headers,
        members: chimeMember
      };
      this.eventEmitter.emit(EventNames.CHATTING_REMOVE_MEMBER, eventData);
    }
    return { itemPass, itemFail };
  }

  // remove duplicate user owner

  ownerIDWithoutDuplicates = (ownerUsers: any[]) => Array.from(
    ownerUsers.reduce((m: Map<number,
      { email: string, updatedDate: number }>, { ownerId, email, updatedDate }) =>
      m.set(ownerId, {
        email,
        updatedDate: Math.max(m.get(ownerId)?.updatedDate || 0, updatedDate)
      }), new Map()),
    ([ownerId, { email, updatedDate }]) => ({ ownerId, email, updatedDate })
  )
}
