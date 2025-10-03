import { InjectQueue } from '@nestjs/bull';
import { Injectable, Optional } from '@nestjs/common';
import { Queue } from 'bull';
import { In } from 'typeorm';
import rabbitmqConfig from '../../common/configs/rabbitmq.config';
import { API_LAST_MODIFIED_NAME } from '../../common/constants/api-last-modify.constant';
import { COLLECTION_TYPE } from '../../common/constants/common.constant';
import { MSG_ERR_INPUT_INVALID } from '../../common/constants/message.constant';
import { DELETED_ITEM_TYPE, OBJ_TYPE } from '../../common/constants/sort-object.constant';
import { NOTIFICATION_OUTDATED_CLEANER, WORKER_CHILD_COLLECTION } from '../../common/constants/worker.constant';
import { ShareMemberLastModify } from '../../common/interface/api-last-modify.interface';
import { IChildCollection, ICollection, ICollectionMember } from '../../common/interface/collection.interface';
import { IDeleteObjectNoUid } from '../../common/interface/links-object.interface';
import { ITrashObject } from '../../common/interface/trash.interface';
import { GetOptionInterface } from '../../common/interface/typeorm.interface';
import { CollectionActivityEntity } from '../../common/models/collection-activity.entity';
import { CollectionEntity } from '../../common/models/collection.entity';
import {
  LinkedCollectionObjectEntity
} from '../../common/models/linked-collection-object.entity';
import { ShareMemberEntity } from '../../common/models/share-member.entity';
import { TrashEntity } from '../../common/models/trash.entity';
import { UserEntity } from '../../common/models/user.entity';
import { CommonApiLastModifiedService } from '../../common/modules/last-modified/api-last-modify-common.service';
import { CollectionActivityRepository } from '../../common/repository/collection-activity.repository';
import { CollectionNotificationRepository } from '../../common/repository/collection-notification.repository';
import { CollectionShareMemberRepository } from '../../common/repository/collection-share-member.repository';
import { CollectionRepository } from '../../common/repository/collection.repository';
import { DeleteItemRepository } from '../../common/repository/delete-item.repository';
import { LinksCollectionObjectRepository } from '../../common/repository/links-collection-object.repository';
import { SettingRepository } from '../../common/repository/setting.repository';
import { TrashRepository } from '../../common/repository/trash.repository';
import { UserRepository } from '../../common/repository/user.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import {
  IS_TRASHED,
  TimestampDouble,
  getTimestampDoubleByIndex,
  getUtcMillisecond,
  memberIDWithoutDuplicates,
  sleep
} from '../../common/utils/common';
import { Graylog } from '../../common/utils/graylog';
import { nLIMIT, nOFFSET } from '../../worker-invalid-data-deletion/commons/constant';

@Injectable()
export class CollectionService {
  private readonly childDataRabbitMQQueue: RabbitMQQueueService;
  private readonly outdatedNotificationQueue: RabbitMQQueueService;
  constructor(
    @Optional()
    @InjectQueue(WORKER_CHILD_COLLECTION.QUEUE)
    private collectionDeleteChildDataQueue: Queue | null,
    private readonly collectionRepo: CollectionRepository,
    private readonly collectionActivityRepo: CollectionActivityRepository,
    private readonly deleteItemRepo: DeleteItemRepository,
    private readonly collectionShareMemberRepo: CollectionShareMemberRepository,
    private readonly linksCollectionObjectRepo: LinksCollectionObjectRepository,
    private readonly notificationRepo: CollectionNotificationRepository,
    private readonly trashRepository: TrashRepository,
    private readonly apiLastModifiedService: CommonApiLastModifiedService,
    private readonly userRepo: UserRepository,
    private readonly settingRepo: SettingRepository,
    private readonly rabbitMQService: RabbitMQQueueService,
  ) {
    this.childDataRabbitMQQueue = new RabbitMQQueueService(
      { name: WORKER_CHILD_COLLECTION.QUEUE });

    this.outdatedNotificationQueue = new RabbitMQQueueService(
      { name: NOTIFICATION_OUTDATED_CLEANER.QUEUE });
  }

  async handleDeleteCollectionMember(data: ICollectionMember) {
    try {
      const { owner_id, email, collection_member_ids } = data;
      const shareMemberOption: GetOptionInterface<ShareMemberEntity> = {
        fields: ['id', 'member_user_id', 'collection_id'],
        conditions: {
          user_id: owner_id,
          collection_id: In(collection_member_ids)
        }
      };
      const shareMemberItems =
        await this.collectionShareMemberRepo.getAllByOptions(shareMemberOption);

      if (shareMemberItems && shareMemberItems.length > 0) {
        const currentDate = getUtcMillisecond();
        const timeOwnerLastModify = [];
        const memberUsers: ShareMemberLastModify[] = [];
        const shareMemberIds = shareMemberItems.map((item) => { return item.id; });

        // delete record share member
        await this.collectionShareMemberRepo.deleteShareMembersByIds(shareMemberIds);
        // save deleted item of share member and share collection for member
        await Promise.all(shareMemberItems.map(async (item, index) => {
          const dateItem = getTimestampDoubleByIndex(currentDate, index);
          timeOwnerLastModify.push(dateItem);
          // deleted-item collection-share-member for ownner
          const colShareMemberDel: IDeleteObjectNoUid = {
            user_id: owner_id,
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.SHARE_MEMBER,
            updated_date: dateItem
          };
          await this.deleteItemRepo.createDeleteItemNoUid(colShareMemberDel);
          // deleted-item share-member for member
          const itemShareMemberDel: IDeleteObjectNoUid = {
            user_id: item.member_user_id,
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.SHARE_MEMBER,
            updated_date: dateItem
          };
          await this.deleteItemRepo.createDeleteItemNoUid(itemShareMemberDel);
          // deleted-item share collection for member
          const itemShareCollectionDel: IDeleteObjectNoUid = {
            user_id: item.member_user_id,
            item_id: item.collection_id,
            item_type: DELETED_ITEM_TYPE.FOLDER_MEMBER,
            updated_date: dateItem
          };
          await this.deleteItemRepo.createDeleteItemNoUid(itemShareCollectionDel);
          // add member id to push last modify
          memberUsers.push({
            memberId: item.member_user_id,
            email: item.shared_email,
            updatedDate: dateItem
          });
        }));

        // remove duplicate user member
        const removeDuplicateMemberId = memberIDWithoutDuplicates(memberUsers);
        if (timeOwnerLastModify.length > 0) {
          // last-modify share-member for owner
          await this.apiLastModifiedService.createLastModify({
            api_name: API_LAST_MODIFIED_NAME.OWNER_SHARE_MEMBER,
            user_id: owner_id,
            email,
            updated_date: Math.max(...timeOwnerLastModify)
          }, true);
          // last-modify collection_member for member
          if (removeDuplicateMemberId && removeDuplicateMemberId.length > 0) {
            await Promise.all(removeDuplicateMemberId.map(async (item: ShareMemberLastModify) => {
              await this.apiLastModifiedService.createLastModify({
                api_name: API_LAST_MODIFIED_NAME.COLLECTION_MEMBER,
                user_id: item.memberId,
                email: item.email,
                updated_date: item.updatedDate
              }, true);
            }));
          }
        }
      }
    } catch (error) {
      return error;
    }
  }

  async handleDeleteCollection(data: ICollection) {
    const { collection_ids, user_id } = data;
    const timeLastModify = [];
    const userRespond: UserEntity = await this.userRepo.getItemByOptions({
      fields: ['email', 'rsa'],
      conditions: { id: user_id }
    });
    const collectionOption: GetOptionInterface<CollectionEntity> = {
      fields: ['id', 'calendar_uri', 'type'],
      conditions: {
        user_id,
        id: In(collection_ids)
      }
    };
    const collectionItems = await this.collectionRepo.getAllByOptions(collectionOption);
    const currentDate = getUtcMillisecond();
    await Promise.all(collectionItems.map(async (item: CollectionEntity, index: number) => {
      const dateItem = getTimestampDoubleByIndex(currentDate, index);
      timeLastModify.push(dateItem);

      // save collection into deleted item table
      const itemCollectionDel: IDeleteObjectNoUid = {
        user_id,
        item_id: item.id,
        item_type: DELETED_ITEM_TYPE.FOLDER,
        updated_date: dateItem
      };
      const rs = await this.deleteItemRepo.createDeleteItemNoUid(itemCollectionDel);
      if (!rs) throw Error(MSG_ERR_INPUT_INVALID);

      /**
       * delete kanban
       * delete kanban card
       * delete collection web data
       */
      const childData: IChildCollection = {
        userInfo: {
          userId: user_id,
          email: userRespond.email,
          rsa: userRespond.rsa,
        },
        collectionId: item.id,
        collectionType: item.type,
        calendarUri: item.calendar_uri
      };

      if (rabbitmqConfig().enable) {
        await this.childDataRabbitMQQueue.addJob(
          WORKER_CHILD_COLLECTION.DELETE_CHILD_JOB.NAME, childData);
      } else {
        await this.collectionDeleteChildDataQueue.add(
          WORKER_CHILD_COLLECTION.DELETE_CHILD_JOB.NAME, childData);
      }
      await Promise.all([
        // delete link, calendar, collection of trash and collection
        this.deleteLinksCollectionObject(data.user_id, data.email, item.id, item.type),
        this.deleteObjectIdInTrash(data.user_id, {
          object_id: item.id,
          object_type: DELETED_ITEM_TYPE.FOLDER
        }),
        this.deleteCollection(data.user_id, userRespond.email, item.id),
        // DELETE notification
        this.deleteNotification(item.id, item.type),
      ]);
    }));

    // update api last modified
    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.COLLECTION,
        user_id,
        email: userRespond.email,
        updated_date: updatedDate
      }, true);
    }
  }

  async deleteCollection(userId: number, email: string, collectionId: number) {
    // set is_trashed = 2 for all collections
    await this.collectionRepo.update({ user_id: userId, id: collectionId }, {
      is_trashed: IS_TRASHED.DELETED
    });
    // update all activity follow collection id
    const setting = await this.settingRepo
      .getItemByOptions({
        fields: ['omni_cal_id'],
        conditions: { user_id: userId }
      });

    const activities: CollectionActivityEntity[] =
      await this.collectionActivityRepo.getAllByOptions({
        fields: ['id', 'object_uid', 'object_type'],
        conditions: {
          user_id: userId,
          collection_id: collectionId
        }
      });
    await Promise.all(
      activities.map(async (act) => {
        await this.collectionActivityRepo.update({
          user_id: userId,
          collection_id: collectionId,
          id: act.id
        }, {
          collection_id: 0,
          object_href: act.object_type.toString() === OBJ_TYPE.URL ? ''
            : `/calendarserver.php/calendars/${email}/${setting.omni_cal_id}/${act.object_uid}.ics`
        });
      }));
    await this.apiLastModifiedService.createLastModify({
      api_name: API_LAST_MODIFIED_NAME.COLLECTION_ACTIVITY,
      user_id: userId,
      email,
      updated_date: TimestampDouble()
    }, true);
  }

  async deleteObjectIdInTrash(userId: number, data: ITrashObject) {
    const trashOption: GetOptionInterface<TrashEntity> = {
      fields: ['id'],
      conditions: {
        user_id: userId,
        object_id: data.object_id,
        object_type: data.object_type
      }
    };
    const trashObject = await this.trashRepository.getItemByOptions(trashOption);
    if (!trashObject) {
      return;
    }
    const updatedDate = TimestampDouble();
    const itemDelete: IDeleteObjectNoUid = {
      user_id: userId,
      item_id: trashObject.id,
      item_type: DELETED_ITEM_TYPE.TRASH,
      updated_date: updatedDate
    };
    await Promise.all([
      this.deleteItemRepo.createDeleteItemNoUid(itemDelete),
      this.trashRepository.remove(trashObject)
    ]);
  }

  async deleteLinksCollectionObject(userId: number, email: string,
    collectionId: number, collectionType: number) {
    try {
      const linkCollectionObjectOption: GetOptionInterface<LinkedCollectionObjectEntity> = {
        fields: ['id'],
        conditions: {
          user_id: userId,
          collection_id: collectionId
        }
      };

      ///
      const linkCollectionObjects = await this.linksCollectionObjectRepo
        .getAllByOptions(linkCollectionObjectOption);

      if (linkCollectionObjects && linkCollectionObjects.length > 0) {
        const currentDate = getUtcMillisecond();
        const timeLastModify = [];

        await Promise.all(linkCollectionObjects.map(async (item, index) => {
          const updatedDate = getTimestampDoubleByIndex(currentDate, index);
          timeLastModify.push(updatedDate);
          if (collectionType === COLLECTION_TYPE.SHARE_COLLECTION) {
            // generate deleted item for collection share
            await this.deleteItemRepo.generateDeletedItemForSharedCollection({
              itemType: DELETED_ITEM_TYPE.COLLECTION_LINK
              , collectionId
              , itemId: item.id
              , deleteDate: updatedDate
            });
          } else {
            const itemDelete: IDeleteObjectNoUid = {
              user_id: userId,
              item_id: item.id,
              item_type: DELETED_ITEM_TYPE.COLLECTION_LINK,
              updated_date: updatedDate
            };
            await this.deleteItemRepo.createDeleteItemNoUid(itemDelete);
          }
          // set is trashed = 2
          await this.linksCollectionObjectRepo
            .update({ id: item.id }, { is_trashed: IS_TRASHED.DELETED });
        }));

        // update api last modified
        if (timeLastModify.length > 0) {
          const updatedDate = Math.max(...timeLastModify);
          await this.apiLastModifiedService.createLastModify({
            api_name: API_LAST_MODIFIED_NAME.LINKED_COLLECTION_OBJECT,
            user_id: userId,
            email,
            updated_date: updatedDate
          }, true);
        }
      }
    } catch (err) {
      return err;
    }
  }

  async deleteNotification(collectionId: number, collectionType: number, page = 0) {
    if (collectionType !== COLLECTION_TYPE.SHARE_COLLECTION) {
      return;
    }
    try {
      const limit = nLIMIT * 10;
      const listNotification = await this.notificationRepo
        .collectOutdatedCollectionNotification(nOFFSET + (page * limit), limit, collectionId);
      if (!listNotification?.length) { return 0; }
      await this.outdatedNotificationQueue
        .addJob(NOTIFICATION_OUTDATED_CLEANER.JOB.NAME,
          listNotification);
      if (listNotification.length === limit) {
        sleep(200);
        page = page + 1;
        return await this.deleteNotification(collectionId, collectionType, page);
      }
      return listNotification.length;
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: NOTIFICATION_OUTDATED_CLEANER.QUEUE,
        jobName: NOTIFICATION_OUTDATED_CLEANER.JOB.NAME,
        message: error.code,
        fullMessage: error.message
      });
      return 0;
    }
  }
}