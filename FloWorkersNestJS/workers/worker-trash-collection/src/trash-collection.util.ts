import { Injectable } from '@nestjs/common';
import { UpdateResult } from 'typeorm';
import { API_LAST_MODIFIED_NAME } from "../../common/constants/api-last-modify.constant";
import { DELETED_ITEM_TYPE } from "../../common/constants/sort-object.constant";
import { CommonEntity } from '../../common/models/common.entity';
import { DeletedItemEntity } from '../../common/models/deleted-item.entity';
import { TrashEntity } from '../../common/models/trash.entity';
import { CommonApiLastModifiedService } from '../../common/modules/last-modified/api-last-modify-common.service';
import { CollectionShareMemberRepository } from '../../common/repository/collection-share-member.repository';
import { DeleteItemRepository } from "../../common/repository/delete-item.repository";
import { LinksCollectionObjectRepository } from '../../common/repository/links-collection-object.repository';
import {
  getTimestampDoubleByIndex,
  getUtcMillisecond, IS_TRASHED, memberWithoutDuplicates, TimestampDouble, TRASH_TYPE
} from "../../common/utils/common";

@Injectable()
export class TrashUtil {
  constructor(
    private readonly linksCollectionObjectRepo: LinksCollectionObjectRepository,
    private readonly apiLastModifiedService: CommonApiLastModifiedService,
    private readonly shareMemberRepo: CollectionShareMemberRepository,
    private readonly deleteItemRepo: DeleteItemRepository
  ) { }
  async prepareToUpdate(repository, where, apiName: API_LAST_MODIFIED_NAME, itemProcessor) {
    const allObjects = await repository.find({ where });

    if (!allObjects?.length) return;
    const currentDate: number = getUtcMillisecond();
    const timeLastModify: number[] = [];
    const lastModifyMembers = [];

    for (const [idx, item] of allObjects.entries()) {
      const dateItem: number = getTimestampDoubleByIndex(currentDate, idx);
      const resUpdate: UpdateResult = await itemProcessor(item, dateItem);
      if (resUpdate.affected > 0) {
        timeLastModify.push(dateItem);
      }
      // last-modify for linked-collection-object-member
      if (item.collection_id && item.object_uid && item.object_type) {
        const members = await this.shareMemberRepo.find({
          select: ['member_user_id'],
          where: { collection_id: item.collection_id }
        });
        members.forEach(member => {
          lastModifyMembers.push({ memberId: member.member_user_id, updateTime: dateItem });
        });
      }
    }
    // update last-modified
    if (timeLastModify.length > 0) {
      await this.apiLastModifiedService.createLastModify({
        api_name: apiName,
        user_id: where.user_id as number,
        email: where.email as string,
        updated_date: Math.max(...timeLastModify)
      }, true);
    }
    if (lastModifyMembers.length > 0) {
      const removeDuplicateMemberIds = memberWithoutDuplicates(lastModifyMembers);
      // push last modify for each member
      await Promise.all(removeDuplicateMemberIds.map(async (item) => {
        this.apiLastModifiedService.createLastModify({
          api_name: API_LAST_MODIFIED_NAME.LINKED_COLLECTION_OBJECT_MEMBER,
          user_id: item.memberId,
          email: where.email as string,
          updated_date: item.updateTime
        }, true);
      }));
    }
  }

  async prepareToDelete(allObjects: CommonEntity[],
    userId: number,
    email: string,
    itemType: DELETED_ITEM_TYPE,
    apiName: API_LAST_MODIFIED_NAME): Promise<number[]> {

    if (!allObjects?.length) return [];
    const currentDate: number = getUtcMillisecond();
    const timeLastModify: number[] = [];
    const lastModifyMembers = [];
    const ids: number[] = [];
    const deletedItems: DeletedItemEntity[] = [];
    for (const [idx, item] of allObjects.entries()) {
      const dateItem: number = getTimestampDoubleByIndex(currentDate, idx);
      timeLastModify.push(dateItem);
      ids.push(item['id']);
      deletedItems.push(this.deleteItemRepo
        .createDeletedItemEntityNoUid({
          user_id: userId,
          item_id: item['id'],
          item_type: itemType,
          updated_date: dateItem
        }));
      if (itemType === DELETED_ITEM_TYPE.COLLECTION_LINK) {
        await this.linksCollectionObjectRepo
          .generateDeletedItemForShared({
            collection_id: item['collection_id'],
            collection_link_id: item['id'],
            updated_date: dateItem
          });
        // last-modify for linked-collection-object-member
        if (item['collection_id']) {
          const members = await this.shareMemberRepo.find({
            select: ['member_user_id'],
            where: { collection_id: item['collection_id'] }
          });
          members.forEach(member => {
            lastModifyMembers.push({ memberId: member.member_user_id, updateTime: dateItem });
          });
        }
      }
    }
    const maxDateModify = Math.max(...timeLastModify);
    await this.deleteItemRepo.insert(deletedItems);
    await this.apiLastModifiedService.createLastModify({
      api_name: apiName,
      user_id: userId,
      email,
      updated_date: maxDateModify
    }, true);
    if (lastModifyMembers.length > 0) {
      const removeDuplicateMemberIds = memberWithoutDuplicates(lastModifyMembers);
      // push last modify for each member
      await Promise.all(removeDuplicateMemberIds.map(async (item) => {
        this.apiLastModifiedService.createLastModify({
          api_name: API_LAST_MODIFIED_NAME.LINKED_COLLECTION_OBJECT_MEMBER,
          user_id: item.memberId,
          email,
          updated_date: item.updateTime
        }, true);
      }));
    }
    return ids;
  }

  async trashObject(repository,
    uid: Buffer,
    user_id: number,
    email: string,
    isTrashed: IS_TRASHED,
    lastModifiedName: API_LAST_MODIFIED_NAME) {
    const updatedDate: number = TimestampDouble();
    const updated: UpdateResult = await repository.update(
      { uid: uid.toString('utf8') },
      {
        trashed: isTrashed,
        updated_date: updatedDate
      });
    if (updated && updated.affected > 0) {
      await this.apiLastModifiedService.createLastModify({
        api_name: lastModifiedName,
        user_id,
        email,
        updated_date: updatedDate
      }, true);
    }
  }

  isSabreDav(trash: TrashEntity) {
    return trash.object_type === TRASH_TYPE.VCARD
      || trash.object_type === TRASH_TYPE.VEVENT
      || trash.object_type === TRASH_TYPE.VJOURNAL
      || trash.object_type === TRASH_TYPE.VTODO;
  }
}