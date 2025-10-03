import { Injectable } from '@nestjs/common';
import { API_LAST_MODIFIED_NAME } from '../../common/constants/api-last-modify.constant';
import { DELETED_ITEM_TYPE, OBJ_TYPE } from '../../common/constants/sort-object.constant';
import { IDeleteWashabi } from '../../common/interface/file-attachment.interface';
import {
  IDeleteLinksObject,
  IDeleteObjectNoUid,
  IDeleteObjectUid
} from '../../common/interface/links-object.interface';
import { GetOptionInterface } from '../../common/interface/typeorm.interface';
import { ContactHistoryEntity } from '../../common/models/contact-history.entity';
import { FileAttachmentEntity } from '../../common/models/file-attachment.entity';
import { KanbanCardEntity } from '../../common/models/kanban-card.entity';
import { LinkedCollectionObjectEntity } from '../../common/models/linked-collection-object.entity';
import { LinkedObjectEntity } from '../../common/models/linked-object.entity';
import { RecentObjectEntity } from '../../common/models/recent-object.entity';
import { SortObjectEntity } from '../../common/models/sort-object.entity';
import { TrashEntity } from '../../common/models/trash.entity';
import { CommonApiLastModifiedService } from '../../common/modules/last-modified/api-last-modify-common.service';
import { ContactHistoryRepository } from '../../common/repository/contact-history.repository';
import { DeleteItemRepository } from '../../common/repository/delete-item.repository';
import { FileAttachmentRepository } from '../../common/repository/file.repository';
import { KanbanCardRepository } from '../../common/repository/kanban-card.repository';
import { LinksCollectionObjectRepository } from '../../common/repository/links-collection-object.repository';
import { LinksObjectRepository } from '../../common/repository/links-object.repository';
import { RecentObjectRepository } from '../../common/repository/recent-object.repository';
import { SortObjectRepository } from '../../common/repository/sort-object.repository';
import { TrashRepository } from '../../common/repository/trash.repository';
import { WasabiService } from '../../common/services/handle-washabi.service';
import { TimestampDouble, getTimestampDoubleByIndex, getUtcMillisecond } from '../../common/utils/common';

@Injectable()
export class LinksObjectService {
  constructor(
    private readonly linksObjectRepo: LinksObjectRepository,
    private readonly linksCollectionObjectRepo: LinksCollectionObjectRepository,
    private readonly trashRepo: TrashRepository,
    private readonly sortObjectRepo: SortObjectRepository,
    private readonly fileAttachmentRepo: FileAttachmentRepository,
    private readonly kanbanCardRepo: KanbanCardRepository,
    private readonly recentObjRepo: RecentObjectRepository,
    private readonly deleteItemRepo: DeleteItemRepository,
    private readonly contactHistoryRepo: ContactHistoryRepository,
    private readonly wasabiService: WasabiService,
    private readonly apiLastModifiedService: CommonApiLastModifiedService
  ) {}

  async deleteSortObjectOrder(data: IDeleteLinksObject): Promise<void> {
    try {
      const sortObjectOption: GetOptionInterface<SortObjectEntity> = {
        fields: ['id'],
        conditions: {
          user_id: data.user_id,
          object_uid: data.object_uid,
          object_type: data.object_type
        }
      };
      const item = await this.sortObjectRepo.getItemByOptions(sortObjectOption);
      if (!item) {
        return;
      }
      const updatedDate = TimestampDouble();
      const itemDelete: IDeleteObjectUid = {
        user_id: data.user_id,
        item_id: item.id,
        item_type: DELETED_ITEM_TYPE.RECENT_OBJ,
        item_uid: data.object_uid,
        updated_date: updatedDate
      };
      await Promise.all([
        this.deleteItemRepo.createDeleteItem(itemDelete),
        this.sortObjectRepo.delete({ id: item.id })
      ]);

      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.TODO,
        user_id: data.user_id,
        email: data.email,
        updated_date: updatedDate
      }, true);
    } catch (err) {
      return err;
    }
  }

  async deleteRecentObject(data: IDeleteLinksObject): Promise<void> {
    try {
      const recentObjOption: GetOptionInterface<RecentObjectEntity> = {
        fields: ['id'],
        conditions: {
          user_id: data.user_id,
          object_uid: data.object_uid,
          object_type: data.object_type
        }
      };
      const item = await this.recentObjRepo.getItemByOptions(recentObjOption);
      if (!item) {
        return;
      }

      const itemDelete: IDeleteObjectUid = {
        user_id: data.user_id,
        item_id: item.id,
        item_type: DELETED_ITEM_TYPE.RECENT_OBJ,
        item_uid: data.object_uid,
        updated_date: TimestampDouble()
      };
      await Promise.all([
        this.deleteItemRepo.createDeleteItem(itemDelete),
        this.recentObjRepo.delete({ id: item.id })
      ]);

    } catch (err) {
      return err;
    }
  }

  async deleteContactHistories(data: IDeleteLinksObject): Promise<void> {
    try {
      const contactHistoryOption: GetOptionInterface<ContactHistoryEntity> = {
        fields: ['id'],
        conditions: {
          user_id: data.user_id,
          object_uid: data.object_uid,
          object_type: data.object_type
        }
      };
      const histories = await this.contactHistoryRepo.findItemByUid(contactHistoryOption);
      if (histories && histories.length > 0) {
        const currentDate = getUtcMillisecond();
        await Promise.all(histories.map(async (item, index) => {
          const updatedDate = getTimestampDoubleByIndex(currentDate, index);
          const itemDelete: IDeleteObjectNoUid = {
            user_id: data.user_id,
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.HISTORY,
            updated_date: updatedDate
          };
          await this.deleteItemRepo.createDeleteItemNoUid(itemDelete);
          await this.contactHistoryRepo.delete({ id: item.id });
        }));
      }
    } catch (err) {
      return err;
    }
  }

  async deleteFileAttachment(data: IDeleteLinksObject): Promise<void> {
    try {
      const fileOption: GetOptionInterface<FileAttachmentEntity> = {
        fields: ['id', 'uid', 'ext'],
        conditions: {
          user_id: data.user_id,
          object_uid: data.object_uid,
          object_type: OBJ_TYPE.VJOURNAL
        }
      };
      const fileItem: IDeleteWashabi = await this.fileAttachmentRepo.getItemByOptions(fileOption);
      if (!fileItem) {
        return;
      }
      const updatedDate = TimestampDouble();
      const itemDelete: IDeleteObjectUid = {
        user_id: data.user_id,
        item_id: fileItem.id,
        item_type: DELETED_ITEM_TYPE.FILE,
        item_uid: data.object_uid,
        updated_date: updatedDate
      };
      await Promise.all([
        this.deleteItemRepo.createDeleteItem(itemDelete),
        this.fileAttachmentRepo.delete({ id: fileItem.id }),
        this.wasabiService.deleteOnWasabi(data.user_id, fileItem)
      ]);

    } catch (err) {
      return err;
    }
  }

  async deleteTrashedObject(data: IDeleteLinksObject): Promise<void> {
    try {
      const trashOption: GetOptionInterface<TrashEntity> = {
        fields: ['id'],
        conditions: {
          user_id: data.user_id,
          object_uid: data.object_uid,
          object_type: data.object_type
        }
      };
      const item = await this.trashRepo.getItemByOptions(trashOption);
      if (!item) {
        return;
      }
      const updatedDate = TimestampDouble();
      const itemDelete: IDeleteObjectNoUid = {
        user_id: data.user_id,
        item_id: item.id,
        item_type: DELETED_ITEM_TYPE.TRASH,
        updated_date: updatedDate
      };
      await Promise.all([
        this.deleteItemRepo.createDeleteItemNoUid(itemDelete),
        this.trashRepo.delete({ id: item.id })
      ]);
    } catch (err) {
      return err;
    }
  }

  async deleteLinksObject(data: IDeleteLinksObject): Promise<void> {
    try {
      const linkObjectOption: GetOptionInterface<LinkedObjectEntity> = {
        fields: ['id'],
        conditions: {
          user_id: data.user_id,
          object_uid: data.object_uid,
          object_type: data.object_type
        }
      };
      const linkObjects = await this.linksObjectRepo.findAllByUid(linkObjectOption);
      if (linkObjects && linkObjects.length > 0) {
        const currentDate = getUtcMillisecond();
        const timeLastModify = [];

        await Promise.all(linkObjects.map(async (item, index) => {
          const updatedDate = getTimestampDoubleByIndex(currentDate, index);
          timeLastModify.push(updatedDate);
          const itemDelete: IDeleteObjectNoUid = {
            user_id: data.user_id,
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.LINK,
            updated_date: updatedDate
          };
          await this.deleteItemRepo.createDeleteItemNoUid(itemDelete);
          await this.linksObjectRepo.delete({ id: item.id });
        }));

        // update api last modified
        if (timeLastModify.length > 0) {
          const updatedDate = Math.max(...timeLastModify);
          await this.apiLastModifiedService.createLastModify({
            api_name: API_LAST_MODIFIED_NAME.LINKED_OBJECT,
            user_id: data.user_id,
            email: data.email,
            updated_date: updatedDate
          }, true);
        }
      }
    } catch (err) {
      return err;
    }
  }

  async deleteLinksCollectionObject(data: IDeleteLinksObject): Promise<void> {
    try {
      const linkCollectionObjectOption: GetOptionInterface<LinkedCollectionObjectEntity> = {
        fields: ['id'],
        conditions: {
          user_id: data.user_id,
          object_uid: data.object_uid,
          object_type: data.object_type
        }
      };
      const linkCollectionObjects = await this.linksCollectionObjectRepo
      .getAllByOptions(linkCollectionObjectOption);

      if (linkCollectionObjects && linkCollectionObjects.length > 0) {
        const currentDate = getUtcMillisecond();
        const timeLastModify = [];

        await Promise.all(linkCollectionObjects.map(async (item, index) => {
          const updatedDate = getTimestampDoubleByIndex(currentDate, index);
          timeLastModify.push(updatedDate);
          const itemDelete: IDeleteObjectNoUid = {
            user_id: data.user_id,
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.COLLECTION_LINK,
            updated_date: updatedDate
          };
          await this.deleteItemRepo.createDeleteItemNoUid(itemDelete);
          await this.linksCollectionObjectRepo.delete({ id: item.id });
        }));

        // update api last modified
        if (timeLastModify.length > 0) {
          const updatedDate = Math.max(...timeLastModify);
          await this.apiLastModifiedService.createLastModify({
            api_name: API_LAST_MODIFIED_NAME.LINKED_COLLECTION_OBJECT,
            user_id: data.user_id,
            email: data.email,
            updated_date: updatedDate
          }, true);
        }
      }
    } catch (err) {
      return err;
    }
  }

  async deleteKanbanCard(data: IDeleteLinksObject): Promise<void> {
    try {
      const kanbanCardOption: GetOptionInterface<KanbanCardEntity> = {
        fields: ['id'],
        conditions: {
          user_id: data.user_id,
          object_uid_buf: data.object_uid,
          object_type: data.object_type
        }
      };
      const kanbanCardData = await this.kanbanCardRepo.getAllByOptions(kanbanCardOption);
      if (kanbanCardData && kanbanCardData.length > 0) {
        const currentDate = getUtcMillisecond();
        const timeLastModify = [];

        await Promise.all(kanbanCardData.map(async (item, index) => {
          const updatedDate = getTimestampDoubleByIndex(currentDate, index);
          timeLastModify.push(updatedDate);
          const itemDelete: IDeleteObjectNoUid = {
            user_id: data.user_id,
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.CANVAS,
            updated_date: updatedDate
          };
          await this.deleteItemRepo.createDeleteItemNoUid(itemDelete);
          await this.kanbanCardRepo.delete({ id: item.id });
        }));

        // update api last modified
        if (timeLastModify.length > 0) {
          const updatedDate = Math.max(...timeLastModify);
          await this.apiLastModifiedService.createLastModify({
            api_name: API_LAST_MODIFIED_NAME.KANBAN_CARD,
            user_id: data.user_id,
            email: data.email,
            updated_date: updatedDate
          }, true);
        }
      }
    } catch (err) {
      return err;
    }
  }

  async deleteRelatedObject(data: IDeleteLinksObject): Promise<void> {
    const { object_type } = data;
    if (object_type === OBJ_TYPE.VTODO) {
      // delete sort object order
      await this.deleteSortObjectOrder(data);
    }

    if (object_type === OBJ_TYPE.VJOURNAL || object_type === OBJ_TYPE.VCARD) {
      // delete recent objects
      await this.deleteRecentObject(data);
      if (object_type === OBJ_TYPE.VJOURNAL) {
        // delete file inline attachment
        await this.deleteFileAttachment(data);
      }
    }

    if (object_type === OBJ_TYPE.VEVENT || object_type === OBJ_TYPE.VCARD) {
      // delete contact history
      await this.deleteContactHistories(data);
    }

    /**
     * delete linked object
     * delete linked collection object
     * delete trash collection table
     */
    await Promise.all([
      this.deleteLinksObject(data),
      this.deleteKanbanCard(data),
      this.deleteLinksCollectionObject(data),
      this.deleteTrashedObject(data)
    ]);
  }
}