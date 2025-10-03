import { Injectable } from "@nestjs/common";
import {
  LIST_COLLECTION_NOTIFICATION_OUTDATED,
  SP_DELETE_NOTIFICATION
} from "../constants/mysql.constant";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { CollectionNotificationEntity } from "../models/collection-notification.entity";
import { getPlaceholderByN } from "../utils/common";
import { BaseRepository } from "./base.repository";
@Injectable()
@CustomRepository(CollectionNotificationEntity)
export class CollectionNotificationRepository extends BaseRepository<CollectionNotificationEntity> {
  async deleteUserNoti(collectionNotificationId: number) {
    await this.manager.query(
      `DELETE FROM user_notification
      WHERE collection_notification_id = ?`,
      [collectionNotificationId]
    );
  }

  /**
   * PROCEDURE `n2023_listOfNotificationOutdated`(
   *   pnOffset int,
   *   pnLimit int
   * )
   */
  async collectOutdatedCollectionNotification(offset: number, limit: number,
    collectionId: number = null) {
    const { spName, spParam } = LIST_COLLECTION_NOTIFICATION_OUTDATED;
    const notification = await this.manager
      .query(`CALL ${spName}(${getPlaceholderByN(spParam)})`, [
        collectionId, offset, limit
      ]);
    const result = !notification.length ? [] : notification[0];
    return result;
  }

  async workerDeleteNotification(id: number, userId: number,
    deletedDate: number = Date.now() * 1e-3) {
    try {
      const { spName, spParam } = SP_DELETE_NOTIFICATION;
      const res = await this.manager
        .query(`SELECT ${spName}(${getPlaceholderByN(spParam)}) as nReturn`, [
          id,
          userId,
          deletedDate
        ]);
      return res[0]?.nReturn || 0;
    } catch (error) {
      return { error };
    }
  }
}