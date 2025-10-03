import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { CreateSubcriptionDTO } from "../../modules/subcription/dtos/subcription.post.dto";
import { PROCEDURE_GET_USER_SUBSCRIPTION } from "../constants/mysql.func";
import { CustomRepository } from "../decorators/typeorm-ex.decorator";
import { SubscriptionPurchaseEntity } from "../entities/subscription-purchase.entity";
import { SubscriptionEntity } from "../entities/subscription.entity";
import { GetOptionInterface } from "../interfaces/collection.interface";
import { getPlaceholderByN } from "../utils/common";
import { getUpdateTimeByIndex, getUtcMillisecond } from "../utils/date.util";

@Injectable()
@CustomRepository(SubscriptionPurchaseEntity)
export class SubscriptionPurchaseRepository extends Repository<SubscriptionPurchaseEntity> {
  async createnAndUpdateStatusSubcriptionPurchase(userId: number, dto: CreateSubcriptionDTO) {
    const currentTime = getUtcMillisecond();
    const sub = await this.find({
      where: { user_id: userId }
    });
    const timeLastModify = [];
    if (sub.length > 0) {
      await Promise.all(sub.map((item, index) => {
        const dateSubItem = getUpdateTimeByIndex(currentTime, index);
        timeLastModify.push(dateSubItem);
        item.is_current = 0;
        item.updated_date = dateSubItem;
        this.update({ id: item.id }, { ...item });
      }));
    }
    const dateItem = getUpdateTimeByIndex(currentTime, (timeLastModify.length + 1));
    const subcriptionCreate = this.create({
      user_id: userId,
      is_current: 1,
      ...dto,
      created_date: dateItem,
      updated_date: dateItem,
    });
    const subPurchase = await this.save(subcriptionCreate);
    return subPurchase;
  }
}
@Injectable()
@CustomRepository(SubscriptionEntity)
export class SubscriptionRepository extends Repository<SubscriptionEntity> {
  async getSubscriptionByOptions(options: GetOptionInterface<SubscriptionEntity>) {
    const subscriptionItem = this.findOne({
      select: options.fields,
      where: options.conditions
    });
    return subscriptionItem;
  }

  async getSubscriptionUser(userId: number) {
    const slaveConnection = this.manager
      .connection
      .createQueryRunner("slave");
    try {
      const { callType, spName, spParam } = PROCEDURE_GET_USER_SUBSCRIPTION;
      const data = await slaveConnection
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [userId]);
      const res = data[0][0];
      res.components = JSON.parse(res.components);
      return res;
    } finally {
      slaveConnection.release();
    }
  }
}