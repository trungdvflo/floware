import { Injectable } from '@nestjs/common';
import { Equal, In } from 'typeorm';
import { API_LAST_MODIFIED_NAME } from '../../common/constants/api-last-modify.constant';
import { DELETED_ITEM_TYPE } from '../../common/constants/sort-object.constant';
import { EmailTrackingEntity } from '../../common/models/email-tracking.entity';
import { KanbanCardEntity } from '../../common/models/kanban-card.entity';
import { LinkedCollectionObjectEntity } from '../../common/models/linked-collection-object.entity';
import { LinkedObjectEntity } from '../../common/models/linked-object.entity';
import { RecentObjectEntity } from '../../common/models/recent-object.entity';
import { SortObjectEntity } from '../../common/models/sort-object.entity';
import { CommonApiLastModifiedService } from '../../common/modules/last-modified/api-last-modify-common.service';
import { LastModifyRepository } from '../../common/repository/api-last-modify.repository';
import { ContactHistoryRepository } from '../../common/repository/contact-history.repository';
import { DeleteItemRepository } from '../../common/repository/delete-item.repository';
import { EmailTrackingRepository } from '../../common/repository/email-tracking.repository';
import { KanbanCardRepository } from '../../common/repository/kanban-card.repository';
import { LinksCollectionObjectRepository } from '../../common/repository/links-collection-object.repository';
import { LinksObjectRepository } from '../../common/repository/links-object.repository';
import { RecentObjectRepository } from '../../common/repository/recent-object.repository';
import { SortObjectRepository } from '../../common/repository/sort-object.repository';
import { getTimestampDoubleByIndex, getUtcMillisecond } from '../../common/utils/common';
@Injectable()
export class ThirdPartyAccountService {
  constructor(
    private readonly linksCollectionObjectRepo: LinksCollectionObjectRepository,
    private readonly linksObjectRepo: LinksObjectRepository,
    private readonly sortObjectRepo: SortObjectRepository,
    private readonly contactHistoryRepo: ContactHistoryRepository,
    private readonly emailTrackingRepo: EmailTrackingRepository,
    private readonly kanbanCardRepo: KanbanCardRepository,
    private readonly recentObjectRepo: RecentObjectRepository,
    private readonly deleteItemRepo: DeleteItemRepository,
    private readonly lastModifyRepo: LastModifyRepository,
    private readonly apiLastModifiedService: CommonApiLastModifiedService
  ) { }
  /**
   * Delete LinkedCollectionObject
   * @param user_id
   * @param account_id
   */
  async deleteLinkedCollectionObject(user_id: number, email: string, account_ids: number[]) {
    const allLink: LinkedCollectionObjectEntity[] = await this.linksCollectionObjectRepo
      .find({
        select: ['id'],
        where: {
          account_id: In(account_ids),
          user_id: Equal(user_id)
        }
      });
    if (allLink && allLink.length > 0) {
      const currentDate: number = getUtcMillisecond();
      const timeLastModify: number[] = [currentDate * 1e-3];
      let index: number = 0;
      for (const item of allLink) {
        const dateItem: number = getTimestampDoubleByIndex(currentDate, index);
        timeLastModify.push(dateItem);
        this.deleteItemRepo.createDeleteItemNoUid({
          item_id: item.id,
          user_id,
          item_type: DELETED_ITEM_TYPE.COLLECTION_LINK,
          updated_date: dateItem
        });
        index++;
      }
      await this.apiLastModifiedService.createLastModify({
        user_id,
        email,
        api_name: API_LAST_MODIFIED_NAME.LINKED_COLLECTION_OBJECT,
        updated_date: Math.max(...timeLastModify)
      }, true);
      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.KANBAN_CARD,
        user_id,
        email,
        updated_date: Math.max(...timeLastModify)
      }, true);
      return await this.linksCollectionObjectRepo.delete({
        account_id: In(account_ids), user_id: Equal(user_id)
      });
    }
  }
  /**
   * Delete RecentObject
   * @param user_id
   * @param account_ids
   */
  async deleteRecentObject(user_id: number, email: string, account_ids: number[]) {
    const allObject: RecentObjectEntity[] = await this.recentObjectRepo
      .find({
        select: ['id'],
        where: {
          account_id: In(account_ids),
          user_id: Equal(user_id)
        }
      });
    if (allObject && allObject.length > 0) {
      const currentDate: number = getUtcMillisecond();
      const timeLastModify: number[] = [currentDate * 1e-3];
      let index: number = 0;
      for (const item of allObject) {
        const dateItem: number = getTimestampDoubleByIndex(currentDate, index);
        timeLastModify.push(dateItem);
        this.deleteItemRepo.createDeleteItemNoUid({
          user_id,
          item_id: item.id,
          item_type: DELETED_ITEM_TYPE.RECENT_OBJ,
          updated_date: dateItem
        });
        index++;
      }
      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.RECENT_OBJECT,
        user_id,
        email,
        updated_date: Math.max(...timeLastModify)
      }, true);
      return await this.recentObjectRepo.delete({
        account_id: In(account_ids), user_id: Equal(user_id)
      });
    }
  }
  /**
   * Delete LinkedObject
   * @param user_id
   * @param account_ids
   */
  async deleteLinkedObject(user_id: number, email: string, account_ids: number[]) {
    const linkSrc: LinkedObjectEntity[] = await this.linksObjectRepo
      .find({
        select: ['id'],
        where: {
          source_account_id: In(account_ids),
          user_id: Equal(user_id)
        }
      });
    const linkDest: LinkedObjectEntity[] = await this.linksObjectRepo
      .find({
        select: ['id'],
        where: {
          destination_account_id: In(account_ids),
          user_id: Equal(user_id)
        }
      });
    const objs: LinkedObjectEntity[] = [...linkSrc, ...linkDest];
    const setIds: number[] = [...new Set(objs.map((lnk: LinkedObjectEntity) => lnk.id))];
    const links: LinkedObjectEntity[] = setIds.map(
      (id: number) => objs.find((o: LinkedObjectEntity) => o.id === id)
    );
    if (links?.length > 0) {
      const currentDate: number = getUtcMillisecond();
      const timeLastModify: number[] = [currentDate * 1e-3];
      let index: number = 0;
      for (const item of links) {
        const dateItem: number = getTimestampDoubleByIndex(currentDate, index);
        timeLastModify.push(dateItem);
        this.deleteItemRepo.createDeleteItemNoUid({
          user_id,
          item_id: item.id,
          item_type: DELETED_ITEM_TYPE.LINK,
          updated_date: dateItem
        });
        index++;
      }

      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.LINKED_OBJECT,
        updated_date: Math.max(...timeLastModify),
        user_id,
        email
      }, true);

      await this.linksObjectRepo.delete({
        destination_account_id: In(account_ids),
        user_id: Equal(user_id)
      });
      return await this.linksObjectRepo.delete({
        source_account_id: In(account_ids),
        user_id: Equal(user_id)
      });
    }
  }
  /**
   * Delete SortObject
   * @param user_id
   * @param account_ids
   */
  async deleteSortObject(user_id: number, email: string, account_ids: number[]) {
    const sortItems: SortObjectEntity[] = await this.sortObjectRepo
      .find({
        select: ['id'],
        where: {
          user_id,
          account_id: In(account_ids)
        }
      });

    if (sortItems && sortItems.length > 0) {
      const lastTime = await this.lastModifyRepo
        .getLastTime(user_id, API_LAST_MODIFIED_NAME.TODO);
      const currentDate: number = Math.max(lastTime * 1000, getUtcMillisecond());
      const timeLastModify: number[] = [];
      let index: number = 0;
      for (const item of sortItems) {
        const dateItem: number = getTimestampDoubleByIndex(currentDate, index);
        timeLastModify.push(dateItem);
        this.deleteItemRepo.createDeleteItemNoUid({
          user_id,
          item_id: item.id,
          item_type: DELETED_ITEM_TYPE.VTODO,
          updated_date: dateItem
        });
        index++;
      }
      // FB-2149: remove dubplicate code
      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.TODO,
        updated_date: Math.max(...timeLastModify),
        user_id,
        email
      }, true);
      return await this.sortObjectRepo.delete({
        user_id,
        account_id: In(account_ids)
      });
    }
  }
  /**
   * Delete ContactHistory
   * @param user_id
   * @param account_ids
   */
  async deleteContactHistory(user_id: number, email: string, account_ids: number[]) {
    const histories = await this.contactHistoryRepo
      .getContactHistories(account_ids, user_id);
    if (histories?.length > 0) {
      const currentDate: number = getUtcMillisecond();
      const timeLastModify: number[] = [currentDate * 1e-3];
      let index: number = 0;
      for (const item of histories) {
        const dateItem: number = getTimestampDoubleByIndex(currentDate, index);
        timeLastModify.push(dateItem);
        this.deleteItemRepo.createDeleteItemNoUid({
          user_id,
          item_id: item.id,
          item_type: DELETED_ITEM_TYPE.HISTORY,
          updated_date: dateItem
        });
        index++;
      }
      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.CONTACT_HISTORY,
        updated_date: Math.max(...timeLastModify),
        user_id,
        email
      }, true);

      this.contactHistoryRepo.delete(
        { destination_account_id: In(account_ids), user_id: Equal(user_id) });
      return this.contactHistoryRepo.delete(
        { source_account_id: In(account_ids), user_id: Equal(user_id) });
    }
  }
  /**
   * Delete EmailTracking
   * @param user_id
   * @param account_id
   */
  async deleteEmailTracking(user_id: number, email: string, account_ids: number[]) {
    const allTracking: EmailTrackingEntity[] = await this.emailTrackingRepo
      .find({
        select: ['id'],
        where: {
          account_id: In(account_ids),
          user_id: Equal(user_id)
        }
      });
    if (allTracking && allTracking.length > 0) {
      const currentDate: number = getUtcMillisecond();
      const timeLastModify: number[] = [currentDate * 1e-3];
      let index: number = 0;
      for (const item of allTracking) {
        const dateItem: number = getTimestampDoubleByIndex(currentDate, index);

        timeLastModify.push(dateItem);
        this.deleteItemRepo.createDeleteItemNoUid({
          user_id,
          item_id: item.id,
          item_type: DELETED_ITEM_TYPE.TRACK,
          updated_date: dateItem
        });
        index++;
      }
      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.EMAIL_TRACKING,
        updated_date: Math.max(...timeLastModify),
        user_id,
        email,
      }, true);
      return this.emailTrackingRepo.delete({
        account_id: In(account_ids),
        user_id: Equal(user_id)
      });
    }
  }
  /**
   * Delete KanbanCard
   * @param user_id
   * @param account_ids
   */
  async deleteKanbanCard(user_id: number, email: string, account_ids: number[]) {
    const allKanban: KanbanCardEntity[] = await this.kanbanCardRepo
      .find({
        select: ['id'],
        where: {
          account_id: In(account_ids),
          user_id: Equal(user_id)
        }
      });

    if (allKanban && allKanban.length > 0) {
      const currentDate: number = getUtcMillisecond();
      const timeLastModify: number[] = [currentDate * 1e-3];
      let index: number = 0;
      for (const item of allKanban) {
        const dateItem: number = getTimestampDoubleByIndex(currentDate, index);
        timeLastModify.push(dateItem);
        this.deleteItemRepo.createDeleteItemNoUid({
          user_id,
          item_id: item.id,
          item_type: DELETED_ITEM_TYPE.CANVAS,
          updated_date: dateItem
        });
        index++;
      }
      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.KANBAN_CARD,
        updated_date: Math.max(...timeLastModify),
        user_id,
        email
      }, true);
      return this.kanbanCardRepo.delete({
        account_id: In(account_ids),
        user_id: Equal(user_id)
      });
    }
  }
}