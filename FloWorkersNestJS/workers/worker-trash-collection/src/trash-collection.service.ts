import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, In } from 'typeorm';
import { API_LAST_MODIFIED_NAME } from '../../common/constants/api-last-modify.constant';
import { COLLECTION_TYPE, IS_TRASHED, OBJ_TYPE, SHARE_OBJ_TYPE, TRASH_TYPE } from '../../common/constants/common.constant';
import { DELETED_ITEM_TYPE } from '../../common/constants/sort-object.constant';
import { ITrashLinkCollectionValue, ITrashLinkObjectValue } from '../../common/interface/trash.interface';
import { ContactHistoryEntity } from '../../common/models/contact-history.entity';
import { EmailTrackingEntity } from '../../common/models/email-tracking.entity';
import { KanbanCardEntity } from '../../common/models/kanban-card.entity';
import {
  LinkedCollectionObjectEntity
} from '../../common/models/linked-collection-object.entity';
import { LinkedObjectEntity } from '../../common/models/linked-object.entity';
import { RecentObjectEntity } from '../../common/models/recent-object.entity';
import { ShareMemberEntity } from '../../common/models/share-member.entity';
import { SortObjectEntity } from '../../common/models/sort-object.entity';
import { TrashEntity } from '../../common/models/trash.entity';
import { CommonApiLastModifiedService } from '../../common/modules/last-modified/api-last-modify-common.service';
import { CardContactRepository } from '../../common/repository/card-contact.repository';
import { CollectionShareMemberRepository } from '../../common/repository/collection-share-member.repository';
import { CollectionRepository } from '../../common/repository/collection.repository';
import { ContactHistoryRepository } from '../../common/repository/contact-history.repository';
import { DeleteItemRepository } from '../../common/repository/delete-item.repository';
import { EmailTrackingRepository } from '../../common/repository/email-tracking.repository';
import { EventRepository } from '../../common/repository/event.repository';
import { KanbanCardRepository } from '../../common/repository/kanban-card.repository';
import { LinksCollectionObjectRepository } from '../../common/repository/links-collection-object.repository';
import { LinksObjectRepository } from '../../common/repository/links-object.repository';
import { NoteRepository } from '../../common/repository/note.repository';
import { RecentObjectRepository } from '../../common/repository/recent-object.repository';
import { RuleRepository } from '../../common/repository/rule.repository';
import { SortObjectRepository } from '../../common/repository/sort-object.repository';
import { TodoRepository } from '../../common/repository/todo.repository';
import { TrashRepository } from '../../common/repository/trash.repository';
import { UrlRepository } from '../../common/repository/url.repository';
import {
  TimestampDouble, getTimestampDoubleByIndex, getUtcMillisecond, memberWithoutDuplicates
} from '../../common/utils/common';
import { CommonService } from '../../worker-common/src/common.service';
import { TrashUtil } from './trash-collection.util';
@Injectable()
export class TrashCollectionService {
  constructor(
    // @InjectQueue(FILE_QUEUE)
    // private fileCommonQueue: Queue,
    private readonly commonService: CommonService,
    private readonly trashRepo: TrashRepository,
    private readonly kanbanCardRepo: KanbanCardRepository,
    private readonly cardContactRepo: CardContactRepository,
    private readonly eventRepo: EventRepository,
    private readonly noteRepo: NoteRepository,
    private readonly todoRepo: TodoRepository,
    private readonly linksObjectRepo: LinksObjectRepository,
    private readonly linksCollectionObjectRepo: LinksCollectionObjectRepository,
    private readonly contactHistoryRepo: ContactHistoryRepository,
    private readonly recentObjectRepo: RecentObjectRepository,
    private readonly emailTrackingRepo: EmailTrackingRepository,
    private readonly deleteItemRepo: DeleteItemRepository,
    private readonly urlRepo: UrlRepository,
    private readonly sortObjectRepo: SortObjectRepository,
    private readonly apiLastModifiedService: CommonApiLastModifiedService,
    private readonly collectionRepo: CollectionRepository,
    private readonly shareMemberRepo: CollectionShareMemberRepository,
    private readonly ruleRepo: RuleRepository,
    private readonly trashUtil: TrashUtil
  ) { }

  async handleAfterInsert(trash: TrashEntity) {
    const obj_type = trash.object_type;
    trash.object_uid = trash.object_uid ? Buffer.from(trash.object_uid) : trash.object_uid;

    if (obj_type === TRASH_TYPE.FOLDER) {
      await this.trashCollections(trash);
      return;
    }

    if (!trash.object_uid) {
      return;
    }

    switch (obj_type) {
      case TRASH_TYPE.EMAIL:
        if (!trash.old_object_uid) {
          break;
        }
        await this.trashEmail(trash, Buffer.from(trash.old_object_uid));
        break;
      case TRASH_TYPE.CSFILE:
        await this.trashLinks(trash);
        break;
      case TRASH_TYPE.URL:
        await this.trashUrl({
          id: trash.object_id,
          user_id: trash.user_id
        }, IS_TRASHED.TRASHED, trash.email);
        await this.trashLinks(trash);
        break;
      case TRASH_TYPE.VCARD:
        await this.cardContactRepo.update({
          uid: trash.object_uid.toString('utf8')
        }, {
          trashed: IS_TRASHED.TRASHED
        });
        await this.trashLinks(trash);
        break;
      case TRASH_TYPE.VEVENT:
        await this.trashUtil.trashObject(this.eventRepo,
          trash.object_uid,
          trash.user_id,
          trash.email,
          IS_TRASHED.TRASHED,
          API_LAST_MODIFIED_NAME.CONTACT_HISTORY);
        await this.trashLinks(trash);
        break;
      case TRASH_TYPE.VJOURNAL:
        await this.trashUtil.trashObject(this.noteRepo,
          trash.object_uid,
          trash.user_id,
          trash.email,
          IS_TRASHED.TRASHED,
          API_LAST_MODIFIED_NAME.CONTACT_HISTORY);
        await this.trashLinks(trash);
        break;
      case TRASH_TYPE.VTODO:
        await this.trashUtil.trashObject(this.todoRepo,
          trash.object_uid,
          trash.user_id,
          trash.email,
          IS_TRASHED.TRASHED,
          API_LAST_MODIFIED_NAME.CONTACT_HISTORY);
        await this.trashLinks(trash);
        break;
      default:
        break;
    }
  }

  async handleAfterDelete(trash: TrashEntity) {
    const obj_type = trash.object_type;
    trash.object_uid = trash.object_uid ? Buffer.from(trash.object_uid) : trash.object_uid;

    if (obj_type === TRASH_TYPE.FOLDER) {
      return;
    }

    if (!trash.object_uid) {
      return;
    }

    switch (obj_type) {
      case TRASH_TYPE.EMAIL:
        await this.deleteEmail(trash);
        break;
      case TRASH_TYPE.CSFILE:
      case TRASH_TYPE.URL:
        await this.deleteLink(trash);
        break;
      case TRASH_TYPE.VCARD:
        await Promise.all([
          this.deleteLink(trash),
          this.deleteRecentObject({
            object_uid: trash.object_uid,
            object_type: trash.object_type,
            user_id: trash.user_id
          }, trash)
        ]);
        break;
      case TRASH_TYPE.VEVENT:
        await Promise.all([
          this.deleteLink(trash),
          this.deleteContactHistory({
            source_object_uid: trash.object_uid,
            source_object_type: trash.object_type,
            user_id: trash.user_id
          }, trash),
          this.deleteContactHistory({
            destination_object_uid: trash.object_uid,
            destination_object_type: trash.object_type,
            user_id: trash.user_id
          }, trash),
        ]);
        break;
      case TRASH_TYPE.VJOURNAL:
        await Promise.all([
          this.deleteLink(trash),
          this.deleteRecentObject({
            object_uid: trash.object_uid,
            object_type: trash.object_type,
            user_id: trash.user_id
          }, trash),
        ]);
        break;
      case TRASH_TYPE.VTODO:
        await Promise.all([
          this.deleteLink(trash),
          this.deleteSortObject({
            object_uid: trash.object_uid,
            object_type: trash.object_type,
            user_id: trash.user_id
          }, trash),
        ]);
        break;
      default:
        break;
    }
  }

  async handleAfterRecover(trash: TrashEntity) {
    const obj_type = trash.object_type;
    trash.object_uid = trash.object_uid ? Buffer.from(trash.object_uid) : trash.object_uid;

    if (obj_type === TRASH_TYPE.FOLDER) {
      await this.recoverCollections(trash);
      return;
    }

    if (!trash.object_uid) {
      return;
    }

    switch (obj_type) {
      case TRASH_TYPE.EMAIL:
        if (!trash.new_object_uid) {
          break;
        }
        const new_object_uid = Buffer.from(trash.new_object_uid);
        await this.recoverEmail(trash, new_object_uid);
        break;
      case TRASH_TYPE.CSFILE:
        await this.recoverLink(trash);
        break;
      case TRASH_TYPE.URL:
        await this.trashUrl({
          id: trash.object_id,
          user_id: trash.user_id
        }, IS_TRASHED.NOT_TRASHED, trash.email);
        await this.recoverLink(trash);
        break;
      case TRASH_TYPE.VCARD:
        await this.cardContactRepo.update(
          { uid: trash.object_uid.toString('utf8') },
          { trashed: IS_TRASHED.NOT_TRASHED });
        await this.recoverLink(trash);
        break;
      case TRASH_TYPE.VEVENT:
        await this.trashUtil.trashObject(this.eventRepo,
          trash.object_uid,
          trash.user_id,
          trash.email,
          IS_TRASHED.NOT_TRASHED,
          API_LAST_MODIFIED_NAME.EVENT);
        await this.recoverLink(trash);
        break;
      case TRASH_TYPE.VJOURNAL:
        await this.trashUtil.trashObject(this.noteRepo,
          trash.object_uid,
          trash.user_id,
          trash.email,
          IS_TRASHED.NOT_TRASHED,
          API_LAST_MODIFIED_NAME.NOTE);
        await this.recoverLink(trash);
        break;
      case TRASH_TYPE.VTODO:
        await this.trashUtil.trashObject(this.todoRepo,
          trash.object_uid,
          trash.user_id,
          trash.email,
          IS_TRASHED.NOT_TRASHED,
          API_LAST_MODIFIED_NAME.TODO);
        await this.recoverLink(trash);
        break;
      default:
        break;
    }
  }

  private async updateCollectionsLink(
    where: FindOptionsWhere<LinkedCollectionObjectEntity>,
    value: ITrashLinkCollectionValue) {

    await this.trashUtil.prepareToUpdate(this.linksCollectionObjectRepo,
      where,
      API_LAST_MODIFIED_NAME.LINKED_COLLECTION_OBJECT,
      async (item, dateItem) => {
        const updated: Partial<LinkedCollectionObjectEntity> = {
          updated_date: dateItem,
          is_trashed: value.is_trashed
        };
        if (value.object_uid) {
          updated.object_uid = value.object_uid;
        }
        return await this.linksCollectionObjectRepo.update({ id: item.id }, updated);
      });
  }

  private async deleteCollectionsLink
    (where: FindOptionsWhere<LinkedCollectionObjectEntity>, trash: TrashEntity) {
    const allLink: LinkedCollectionObjectEntity[] = await this.linksCollectionObjectRepo
      .find({
        select: ['id', 'collection_id'],
        where
      });

    if (trash.object_type === OBJ_TYPE.URL) {
      const members = await this.shareMemberRepo.find({
        select: ['member_user_id'],
        where: { collection_id: In(allLink.map(l => l.collection_id)) }
      });
      const lastModifyMembers = [];
      const deletedItems = [];
      const dateItem = TimestampDouble();
      members.forEach(member => {
        lastModifyMembers.push({
          memberId: member.member_user_id,
          email: member.shared_email,
          updateTime: dateItem
        });
        deletedItems.push({
          item_type: DELETED_ITEM_TYPE.URL_MEMBER,
          item_id: trash.object_id,
          item_uid: trash.object_uid,
          user_id: member.member_user_id,
          created_date: dateItem,
          updated_date: dateItem,
        });
      });
      if (deletedItems.length > 0) {
        this.deleteItemRepo.insert(deletedItems);
      }
      const removeDuplicateMemberIds = memberWithoutDuplicates(lastModifyMembers);
      // push last modify for each member
      await Promise.all(removeDuplicateMemberIds.map(async (item) => {
        this.apiLastModifiedService.createLastModify({
          api_name: API_LAST_MODIFIED_NAME.URL_MEMBER,
          user_id: item.memberId,
          email: item.email,
          updated_date: item.updateTime
        }, true);
      }));
    }
    const ids: number[] = await this.trashUtil.prepareToDelete(allLink,
      where.user_id as number,
      trash.email as string,
      DELETED_ITEM_TYPE.COLLECTION_LINK,
      API_LAST_MODIFIED_NAME.LINKED_COLLECTION_OBJECT);

    if (ids?.length)
      for (const id of ids) {
        await this.linksCollectionObjectRepo?.delete({ id });
      }
  }
  private async updateObjectsLink(
    where: FindOptionsWhere<LinkedObjectEntity>,
    value: ITrashLinkObjectValue) {
    await this.trashUtil.prepareToUpdate(this.linksObjectRepo,
      where,
      API_LAST_MODIFIED_NAME.LINKED_OBJECT,
      async (item, dateItem) => {
        const updated = {
          updated_date: dateItem,
          is_trashed: value.is_trashed
        };
        if (value.source_object_uid) {
          updated['source_object_uid'] = value.source_object_uid;
        }
        if (value.destination_object_uid) {
          updated['destination_object_uid'] = value.destination_object_uid;
        }
        return await this.linksObjectRepo
          .update({ id: item.id },
            updated);
      });
  }

  private async deleteObjectLink(
    where: FindOptionsWhere<LinkedObjectEntity>, trash: TrashEntity) {
    const allLink: LinkedObjectEntity[] = await this.linksObjectRepo
      .find({
        select: ['id'],
        where
      });
    const ids: number[] = await this.trashUtil
      .prepareToDelete(allLink,
        where.user_id as number,
        trash.email,
        DELETED_ITEM_TYPE.LINK,
        API_LAST_MODIFIED_NAME.LINKED_OBJECT);
    if (ids?.length)
      for (const id of ids) {
        await this.linksObjectRepo.delete({ id });
      }
  }

  private async updateKanbanCard(
    where: FindOptionsWhere<KanbanCardEntity>,
    value: { object_uid_buf?, is_trashed }
  ) {
    await this.trashUtil.prepareToUpdate(this.kanbanCardRepo,
      where,
      API_LAST_MODIFIED_NAME.KANBAN_CARD,
      async (item, dateItem) => {
        return await this.kanbanCardRepo
          .update({ id: item.id }, {
            updated_date: dateItem,
            object_uid_buf: value.object_uid_buf,
            is_trashed: value.is_trashed
          });
      });
  }

  private async deleteKanbanCard(
    where: FindOptionsWhere<KanbanCardEntity>, trash: TrashEntity) {
    const allKanban: KanbanCardEntity[] = await this.kanbanCardRepo
      .find({
        select: ['id'],
        where
      });
    const ids: number[] = await this.trashUtil.prepareToDelete(allKanban,
      where.user_id as number,
      trash.email,
      DELETED_ITEM_TYPE.CANVAS,
      API_LAST_MODIFIED_NAME.KANBAN_CARD);

    if (ids?.length)
      for (const id of ids) {
        await this.kanbanCardRepo?.delete({ id });
      }

  }

  private async updateEmailTracking(
    where: FindOptionsWhere<EmailTrackingEntity>,
    value: ITrashLinkCollectionValue
  ) {
    await this.trashUtil.prepareToUpdate(this.emailTrackingRepo,
      where,
      API_LAST_MODIFIED_NAME.EMAIL_TRACKING,
      async (item, dateItem) => {
        return await this.emailTrackingRepo
          .update({ id: item.id }, {
            updated_date: dateItem,
            object_uid: value.object_uid
          });
      });
  }

  private async deleteEmailTracking(
    where: FindOptionsWhere<EmailTrackingEntity>, trash: TrashEntity) {
    const allEmail: EmailTrackingEntity[] = await this.emailTrackingRepo
      .find({
        select: ['id'],
        where
      });
    const ids: number[] = await this.trashUtil.prepareToDelete(allEmail,
      where.user_id as number,
      trash.email,
      DELETED_ITEM_TYPE.TRACK,
      API_LAST_MODIFIED_NAME.EMAIL_TRACKING);

    if (ids?.length)
      for (const id of ids) {
        await this.emailTrackingRepo?.delete({ id });
      }
  }

  private async updateContactHistory(
    where: FindOptionsWhere<ContactHistoryEntity>,
    value: ITrashLinkObjectValue
  ) {

    await this.trashUtil.prepareToUpdate(this.contactHistoryRepo,
      where,
      API_LAST_MODIFIED_NAME.CONTACT_HISTORY, async (item, dateItem) => {
        const updated = {
          updated_date: dateItem,
          is_trashed: value.is_trashed
        };
        if (value.source_object_uid) {
          updated['source_object_uid'] = value.source_object_uid;
        }
        if (value.destination_object_uid) {
          updated['destination_object_uid'] = value.destination_object_uid;
        }
        return await this.contactHistoryRepo.update({ id: item.id }, updated);
      });
  }

  private async deleteContactHistory(
    where: FindOptionsWhere<ContactHistoryEntity>, trash: TrashEntity) {
    const allContact: ContactHistoryEntity[] = await this.contactHistoryRepo
      .find({
        select: ['id'],
        where
      });
    const ids: number[] = await this.trashUtil.prepareToDelete(allContact,
      where.user_id as number,
      trash.email,
      DELETED_ITEM_TYPE.HISTORY,
      API_LAST_MODIFIED_NAME.CONTACT_HISTORY);
    if (ids?.length)
      for (const id of ids) {
        await this.contactHistoryRepo?.delete({ id });
      }
  }

  private async trashCollection(trash: TrashEntity,
    isTrashed, updatedDate: number) {

    // const collection = await this.collectionRepo
    //   .findOne({ where: { id: trash.object_id } });

    const col = await this.collectionRepo
      .createQueryBuilder("co")
      .innerJoin("user", "u", "u.id = co.user_id")
      .select([
        'co.id id',
        'co.user_id user_id',
        'co.parent_id parent_id',
        'u.email email',
        'co.type type',
      ])
      .where("co.id = :id", { id: trash.object_id })
      .getRawOne();

    const upRes = await this.collectionRepo.update(
      { id: col.id }, {
      is_trashed: isTrashed,
      updated_date: updatedDate
    });
    if (upRes && upRes.affected > 0) {
      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.COLLECTION,
        user_id: col.user_id,
        email: col.email,
        updated_date: updatedDate
      }, true);
    }
    if (col.type === COLLECTION_TYPE.SHARE_COLLECTION) {
      const shareMembers = await this.shareMemberRepo.find({
        select: ['member_user_id'],
        where: {
          collection_id: col.id,
        }
      });
      if (shareMembers.length > 0) {
        const members = [];
        shareMembers.forEach(shareMember => {
          members.push(shareMember.member_user_id);
        });
        const filterMembers = [...new Set(members)];
        filterMembers.forEach(member => {
          this.apiLastModifiedService.createLastModify({
            api_name: API_LAST_MODIFIED_NAME.COLLECTION_MEMBER,
            user_id: member,
            email: col.email,
            updated_date: updatedDate
          }, true);
        });
      }
    }
    return col;
  }

  private async trashUrl(
    cond: { id: number, user_id?: number }, isTrashed, email: string) {
    const updatedDate = TimestampDouble();
    const res = await this.urlRepo.update(
      cond, {
      is_trashed: isTrashed,
      updated_date: updatedDate
    });
    if (res && res.affected > 0) {
      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.URL,
        user_id: cond.user_id,
        email,
        updated_date: updatedDate
      }, true);
    }
  }

  private async deleteRecentObject(where: FindOptionsWhere<RecentObjectEntity>,
    trash: TrashEntity) {
    const allObject: RecentObjectEntity[] = await this.recentObjectRepo
      .find({
        select: ['id'],
        where
      });

    const ids: number[] = await this.trashUtil.prepareToDelete(allObject,
      where.user_id as number,
      trash.email,
      DELETED_ITEM_TYPE.RECENT_OBJ,
      API_LAST_MODIFIED_NAME.RECENT_OBJECT);
    if (ids?.length)
      for (const id of ids) {
        await this.recentObjectRepo?.delete({ id });
      }
  }

  private async deleteSortObject(where: FindOptionsWhere<SortObjectEntity>, trash: TrashEntity) {
    const allObjects: SortObjectEntity[] = await this.sortObjectRepo
      .find({
        select: ['id'],
        where
      });
    const ids: number[] = await this.trashUtil.prepareToDelete(allObjects,
      where.user_id as number,
      trash.email,
      DELETED_ITEM_TYPE.VTODO,
      API_LAST_MODIFIED_NAME.TODO);
    if (ids?.length)
      for (const id of ids) {
        await this.sortObjectRepo?.delete({ id });
      }
  }

  /**
   * trash collection
   * @param trash
   * @param res
   */
  private async trashCollections(trash: TrashEntity) {
    // const collection = await this.collectionRepo
    //   .findOne({ where: { id: trash.object_id } });

    await this.trashCollection(trash, IS_TRASHED.TRASHED, trash.updated_date);

    // collection link
    await this.updateCollectionsLink({
      collection_id: trash.object_id,
      user_id: trash.user_id
    }, {
      is_trashed: IS_TRASHED.TRASHED
    });
    // trash share-collections
    if (trash.col_type === COLLECTION_TYPE.SHARE_COLLECTION) {
      // put last modified for all share-collection-member
      await this.updateLastModify4Member(trash, trash.updated_date);
    }
    // trash all childs
    const childCols = await this.collectionRepo
      .findByParentId(trash.user_id, trash.object_id);
    if (!childCols?.length) return;
    const updatedDateChild = TimestampDouble();
    for (const child of childCols) {
      if (child.is_trashed !== IS_TRASHED.NOT_TRASHED)
        continue;
      const trashChild = this.trashRepo.create({
        object_id: child.id,
        object_type: TRASH_TYPE.FOLDER,
        user_id: trash.user_id,
        trash_time: trash.trash_time,
        created_date: trash.updated_date,
        updated_date: trash.updated_date
      });
      await this.trashRepo.save(trashChild);
      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.TRASH,
        user_id: trash.user_id,
        email: trash.email,
        updated_date: updatedDateChild
      }, true);
      await this.trashCollections(trashChild);
    }
  }

  private async updateLastModify4Member(trash: TrashEntity, updatedDate: number) {
    const members: ShareMemberEntity[] = await this.shareMemberRepo
      .find({
        select: ['member_user_id'],
        where: {
          collection_id: trash.object_id,
          user_id: trash.user_id
        }
      });
    await Promise.all(members.map(async (member) => {
      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.COLLECTION_MEMBER,
        user_id: member.member_user_id,
        email: trash.email,
        updated_date: updatedDate
      }, true);
    }));
  }
  private async recoverCollections(trash: TrashEntity) {
    const updatedDate = TimestampDouble();
    // const collection = await this.collectionRepo
    //   .findOne({ where: { id: trash.object_id } });
    const collection = await this.trashCollection(trash, IS_TRASHED.NOT_TRASHED, updatedDate);

    // collection link
    await this.updateCollectionsLink({
      collection_id: trash.object_id,
      // object_uid: Not(In(this.objs2ListUid(trashedFolderObjs))),
      user_id: trash.user_id
    }, {
      is_trashed: IS_TRASHED.NOT_TRASHED
    });
    // recover parent
    if (!collection || collection.parent_id <= 0) return;
    const parent = await this.collectionRepo
      .findOne({ where: { id: collection.parent_id } });
    if (parent && parent.is_trashed === IS_TRASHED.TRASHED) {
      const where: FindOptionsWhere<TrashEntity> = {
        object_id: parent.id,
        object_type: TRASH_TYPE.FOLDER,
        user_id: trash.user_id,
      };
      const trashes = await this.trashRepo.find({ where });
      const currentDate: number = getUtcMillisecond();
      const timeLastModify: number[] = [currentDate * 1e-3];
      await Promise.all(trashes.map(
        async (item: TrashEntity, index: number) => {
          const dateItem: number = getTimestampDoubleByIndex(currentDate, index);
          timeLastModify.push(dateItem);
          await this.deleteItemRepo.createDeleteItemNoUid({
            user_id: parent.user_id,
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.TRASH,
            updated_date: dateItem
          });
          await this.recoverCollections(item);
          await this.trashRepo.remove(item);
        }));
      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.TRASH,
        user_id: trash.user_id,
        email: trash.email,
        updated_date: Math.max(...timeLastModify)
      }, true);
    }
  }
  /**
   * trash email
   * @param trash
   * @param old_object_uid
   * @param res
   */
  private async trashEmail(trash: TrashEntity, old_object_uid) {
    // kanban card
    await this.updateContactHistory({
      source_object_uid: old_object_uid,
      source_object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      source_object_uid: trash.object_uid,
      is_trashed: IS_TRASHED.TRASHED
    });
    await this.updateContactHistory({
      destination_object_uid: old_object_uid,
      destination_object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      destination_object_uid: trash.object_uid,
      is_trashed: IS_TRASHED.TRASHED
    });

    // link object source
    await this.updateObjectsLink({
      source_object_uid: old_object_uid,
      source_object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      source_object_uid: trash.object_uid,
      is_trashed: IS_TRASHED.TRASHED
    });
    // link object destination
    await this.updateObjectsLink({
      destination_object_uid: old_object_uid,
      destination_object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      destination_object_uid: trash.object_uid,
      is_trashed: IS_TRASHED.TRASHED
    });
    await this.updateKanbanCard({
      object_uid_buf: old_object_uid,
      object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      object_uid_buf: trash.object_uid,
      is_trashed: IS_TRASHED.TRASHED
    });
    // collection link
    await this.updateCollectionsLink({
      object_uid: old_object_uid,
      object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      object_uid: trash.object_uid,
      is_trashed: IS_TRASHED.TRASHED
    });
    await this.updateEmailTracking({
      object_uid: old_object_uid,
      object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      object_uid: trash.object_uid
    });
  }

  private async recoverEmail(trash: TrashEntity, new_object_uid: Buffer) {
    // kanban card
    await this.updateContactHistory({
      source_object_uid: trash.object_uid,
      source_object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      source_object_uid: new_object_uid,
      is_trashed: IS_TRASHED.NOT_TRASHED
    });
    await this.updateContactHistory({
      destination_object_uid: trash.object_uid,
      destination_object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      destination_object_uid: new_object_uid,
      is_trashed: IS_TRASHED.NOT_TRASHED
    });
    // link object
    await this.updateObjectsLink({
      source_object_uid: trash.object_uid,
      source_object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      source_object_uid: new_object_uid,
      is_trashed: IS_TRASHED.NOT_TRASHED
    });
    await this.updateObjectsLink({
      destination_object_uid: trash.object_uid,
      destination_object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      destination_object_uid: new_object_uid,
      is_trashed: IS_TRASHED.NOT_TRASHED
    });
    await this.updateKanbanCard({
      object_uid_buf: trash.object_uid,
      object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      object_uid_buf: new_object_uid,
      is_trashed: IS_TRASHED.NOT_TRASHED
    });
    // collection link
    await this.updateCollectionsLink({
      object_uid: trash.object_uid,
      object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      object_uid: new_object_uid,
      is_trashed: IS_TRASHED.NOT_TRASHED
    });
    await this.updateEmailTracking({
      object_uid: trash.object_uid,
      object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      object_uid: new_object_uid
    });
  }

  private async deleteEmail(trash: TrashEntity) {
    await this.deleteCollectionsLink({
      object_uid: trash.object_uid,
      object_type: trash.object_type,
      user_id: trash.user_id,
    }, trash);
    await this.deleteKanbanCard({
      object_uid_buf: trash.object_uid,
      object_type: trash.object_type,
      user_id: trash.user_id,
    }, trash);
    await this.deleteEmailTracking({
      object_uid: trash.object_uid,
      object_type: trash.object_type,
      user_id: trash.user_id,
    }, trash);
    await this.deleteObjectLink({
      source_object_uid: trash.object_uid,
      source_object_type: trash.object_type,
      user_id: trash.user_id,
    }, trash);
    await this.deleteObjectLink({
      destination_object_uid: trash.object_uid,
      destination_object_type: trash.object_type,
      user_id: trash.user_id,
    }, trash);
    await this.deleteContactHistory({
      source_object_uid: trash.object_uid,
      source_object_type: trash.object_type,
      user_id: trash.user_id,
    }, trash);
    await this.deleteContactHistory({
      destination_object_uid: trash.object_uid,
      destination_object_type: trash.object_type,
      user_id: trash.user_id,
    }, trash);
  }

  /**
   * trash kanban-card, link collection object, link object
   * @param trash
   * @param res
   */
  private async trashLinks(trash: TrashEntity) {
    const kanbanCardCond: FindOptionsWhere<KanbanCardEntity> = {
      object_uid_buf: trash.object_uid,
      object_type: trash.object_type,
      is_trashed: IS_TRASHED.NOT_TRASHED,
      user_id: trash.user_id
    };
    const colLinkCond: FindOptionsWhere<LinkedCollectionObjectEntity> = {
      object_uid: trash.object_uid,
      object_type: trash.object_type,
      user_id: trash.user_id
    };
    if (this.trashUtil.isSabreDav(trash) && trash.object_href) {
      kanbanCardCond['object_href'] = trash.object_href;
      colLinkCond.object_href = trash.object_href;
    }
    await this.updateObjectsLink({
      source_object_uid: trash.object_uid,
      source_object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      is_trashed: IS_TRASHED.TRASHED
    });
    await this.updateObjectsLink({
      destination_object_uid: trash.object_uid,
      destination_object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      is_trashed: IS_TRASHED.TRASHED
    });
    await this.updateKanbanCard(kanbanCardCond, {
      is_trashed: IS_TRASHED.TRASHED
    });
    await this.updateCollectionsLink(colLinkCond, {
      is_trashed: IS_TRASHED.TRASHED
    });
  }

  /**
   * recover kanban-card, link collection object, link object
   * @param trash
   * @param res
   */
  private async recoverLink(trash: TrashEntity) {
    const kanbanCond = {
      object_uid_buf: trash.object_uid,
      object_type: trash.object_type,
      user_id: trash.user_id
    };
    const colCond = {
      object_uid: trash.object_uid,
      object_type: trash.object_type,
      user_id: trash.user_id
    };
    if (this.trashUtil.isSabreDav(trash) && trash.object_href) {
      kanbanCond['object_href'] = trash.object_href;
      colCond['object_href'] = trash.object_href;
    }
    await this.updateObjectsLink({
      source_object_uid: trash.object_uid,
      // destination_object_uid: Not(In(this.objs2ListUid(trashedObjs))),
      source_object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      is_trashed: IS_TRASHED.NOT_TRASHED
    });
    await this.updateObjectsLink({
      // source_object_uid: Not(In(this.objs2ListUid(trashedObjs))),
      destination_object_uid: trash.object_uid,
      destination_object_type: trash.object_type,
      user_id: trash.user_id
    }, {
      is_trashed: IS_TRASHED.NOT_TRASHED
    });
    await this.updateKanbanCard(kanbanCond, {
      is_trashed: IS_TRASHED.NOT_TRASHED
    });
    await this.updateCollectionsLink(colCond, {
      is_trashed: IS_TRASHED.NOT_TRASHED
    });
  }

  /**
   * delete kanban-card, link collection object, link object
   * @param trash
   * @param res
   */
  private async deleteLink(trash: TrashEntity) {
    const colLinkCond: FindOptionsWhere<LinkedCollectionObjectEntity> = {
      object_uid: trash.object_uid,
      object_type: trash.object_type,
      user_id: trash.user_id
    };
    const kanbanCardCond: FindOptionsWhere<KanbanCardEntity> = {
      object_uid_buf: trash.object_uid,
      object_type: trash.object_type,
      user_id: trash.user_id,
    };
    const objLinkCond: FindOptionsWhere<LinkedObjectEntity> = {
      source_object_uid: trash.object_uid,
      source_object_type: trash.object_type,
      user_id: trash.user_id
    };
    const objLinkDesCond = {
      destination_object_uid: trash.object_uid,
      destination_object_type: trash.object_type,
      user_id: trash.user_id,
    };
    if (this.trashUtil.isSabreDav(trash) && trash.object_href) {
      objLinkCond.source_object_href = trash.object_href;
      objLinkDesCond['destination_object_href'] = trash.object_href;
    }
    await this.deleteObjectLink(objLinkCond, trash);
    await this.deleteObjectLink(objLinkDesCond, trash);
    await this.deleteCollectionsLink(colLinkCond, trash);
    await this.deleteKanbanCard(kanbanCardCond, trash);
    await this.deleteCollectionActivity(trash);
  }

  async deleteCollectionActivity(trash: TrashEntity) {
    await this.commonService.deleteFileCommonsofObject({
      object_uid: trash.object_uid,
      object_type: trash.object_type as SHARE_OBJ_TYPE
    });
    await this.trashRepo.deleteActivityByUid(trash.object_uid, trash.updated_date);
  }

  async deleteByObjectId(userId: number, objectId: number, objectType: DELETED_ITEM_TYPE) {
    const trash = await this.trashRepo.findOne({
      select: ['id'],
      where: {
        user_id: userId,
        object_id: objectId,
        object_type: objectType
      }
    });
    if (trash) {
      await this.deleteItemRepo.createDeleteItemNoUid({
        user_id: userId,
        item_id: trash.id,
        item_type: DELETED_ITEM_TYPE.TRASH,
        updated_date: TimestampDouble()
      });
      await this.trashRepo.remove(trash);
    }
    return {
      deleted: trash
    };
  }

  objs2ListUid(trashes: TrashEntity[]): Buffer[] {
    return trashes.map(t => t.object_uid);
  }

  objs2ListId(trashes: TrashEntity[]): number[] {
    return trashes.map(t => t.object_id);
  }
}