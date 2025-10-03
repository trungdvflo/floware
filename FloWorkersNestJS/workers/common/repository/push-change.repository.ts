
import { Injectable } from "@nestjs/common";
import { LessThanOrEqual } from "typeorm";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { ILastModify } from "../interface/api-last-modify.interface";
import { PushChangeEntity } from "../models/push-change.entity";
import { sleep } from "../utils/common";
import { Graylog } from "../utils/graylog";
import { BaseRepository } from "./base.repository";
@Injectable()
@CustomRepository(PushChangeEntity)
export class PushChangeRepository extends BaseRepository<PushChangeEntity> {
  async createPushChange(data: ILastModify) {
    try {
      await this.manager
        .query(`INSERT ignore INTO
          push_change (user_id, created_date) VALUES (?,?)`,
          [data.user_id, data.updated_date - 0.01]);
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: 'Device token',
        jobName: 'createPushChange',
        message: error.code,
        fullMessage: error.message
      });
      return error;
    }
  }

  async getListPushChange(pushChangeTime, offset, limit) {
    try {
      const data = await this.findAndCount({
        select: ['user_id'],
        where: {
          created_date: LessThanOrEqual(pushChangeTime)
        },
        order: {
          created_date: 'ASC'
        },
        skip: offset,
        take: limit
      });
      return data;
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: 'Device token',
        jobName: 'getListPushChange',
        message: error.code,
        fullMessage: error.message
      });
      return error;
    }
  }

  async cleanPushChange(userIds: number[]) {
    const totalRecords = userIds.length;
    for (let i = 0; i < totalRecords; i++) {
      await this
        .createQueryBuilder()
        .delete()
        .where('user_id = :userIds', { userIds: userIds[i] })
        .execute();

      sleep(100);
    }
  }
}