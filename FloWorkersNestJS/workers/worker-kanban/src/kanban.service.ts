import { Injectable } from '@nestjs/common';
import { In, QueryFailedError } from 'typeorm';
import { API_LAST_MODIFIED_NAME } from '../../common/constants/api-last-modify.constant';
import { COLLECTION_TYPE, IS_TRASHED, KANBAN_TYPE, RESET_ORDER_CONFIG } from '../../common/constants/common.constant';
import { DELETED_ITEM_TYPE, OBJ_TYPE, SYSTEM_KANBAN } from '../../common/constants/sort-object.constant';
import { TKanban, TSystemKanban } from '../../common/interface/kanban.interface';
import { IDeleteObjectNoUid } from '../../common/interface/links-object.interface';
import { GetOptionInterface } from '../../common/interface/typeorm.interface';
import { CollectionEntity } from '../../common/models/collection.entity';
import { KanbanCardEntity } from '../../common/models/kanban-card.entity';
import { KanbanEntity } from '../../common/models/kanban.entity';
import { CommonApiLastModifiedService } from '../../common/modules/last-modified/api-last-modify-common.service';
import { CollectionRepository } from '../../common/repository/collection.repository';
import { DeleteItemRepository } from '../../common/repository/delete-item.repository';
import { KanbanCardRepository } from '../../common/repository/kanban-card.repository';
import { KanbanRepository } from '../../common/repository/kanban.repository';
import { getTimestampDoubleByIndex, getUtcMillisecond } from '../../common/utils/common';
import { randUtil } from '../../common/utils/crypto.util';

@Injectable()
export class KanbanService {
  constructor(
    private readonly kanbanRepo: KanbanRepository,
    private readonly kanbanCardRepo: KanbanCardRepository,
    private readonly collectionRepo: CollectionRepository,
    private readonly deleteItemRepo: DeleteItemRepository,
    private readonly apiLastModifiedService: CommonApiLastModifiedService
  ) { }

  async deleteKanbanAndKanbanCard(data: TKanban): Promise<void> {
    const kanbanOption: GetOptionInterface<KanbanEntity> = {
      fields: ['id'],
      conditions: {
        user_id: data.user_id,
        id: In(data.kanban_ids),
        is_trashed: IS_TRASHED.DELETED
      }
    };
    const itemKanbans: KanbanEntity[] = await this.kanbanRepo.getAllByOptions(kanbanOption);
    if (itemKanbans && itemKanbans.length > 0) {
      // get list kanban card by kanban id
      const kanbanCardOption: GetOptionInterface<KanbanCardEntity> = {
        fields: ['id'],
        conditions: {
          kanban_id: In(itemKanbans.map(item => item.id)),
        }
      };
      const itemKanbanCards: KanbanCardEntity[] =
        await this.kanbanCardRepo.getAllByOptions(kanbanCardOption);

      // delete kanban and kanban card
      await Promise.all([
        this.deleteKanban(data.user_id, data.email, itemKanbans),
        this.deleteKanbanCard(data.user_id, data.email, itemKanbanCards)
      ]);
    }
  }

  async deleteKanban(userId: number, email: string, itemKanbans: KanbanEntity[]) {
    try {
      const currentDate = getUtcMillisecond();
      const timeLastModify = [];
      await Promise.all(itemKanbans.map(async (item, index) => {
        const dateItem = getTimestampDoubleByIndex(currentDate, index);
        timeLastModify.push(dateItem);
        const itemKanbanDelete: IDeleteObjectNoUid = {
          user_id: userId,
          item_id: item.id,
          item_type: DELETED_ITEM_TYPE.KANBAN,
          updated_date: dateItem
        };
        await this.deleteItemRepo.createDeleteItemNoUid(itemKanbanDelete);
        await this.kanbanRepo.delete({ id: item.id });
      }));
      if (timeLastModify.length > 0) {
        // last-modify for kanban
        await this.apiLastModifiedService.createLastModify({
          api_name: API_LAST_MODIFIED_NAME.KANBAN,
          user_id: userId,
          email,
          updated_date: Math.max(...timeLastModify)
        }, true);
      }
    } catch (err) {
      return err;
    }
  }

  async deleteKanbanCard(userId: number, email: string, itemKanbanCards: KanbanCardEntity[]) {
    try {
      const currentDate = getUtcMillisecond();
      const timeLastModify = [];
      await Promise.all(itemKanbanCards.map(async (item, index) => {
        const dateItem = getTimestampDoubleByIndex(currentDate, index);
        timeLastModify.push(dateItem);
        const itemKanbanCardDelete: IDeleteObjectNoUid = {
          user_id: userId,
          item_id: item.id,
          item_type: DELETED_ITEM_TYPE.CANVAS,
          updated_date: dateItem
        };
        await this.deleteItemRepo.createDeleteItemNoUid(itemKanbanCardDelete);
        await this.kanbanCardRepo.delete({ id: item.id });
      }));
      if (timeLastModify.length > 0) {
        // last-modify for kanban
        await this.apiLastModifiedService.createLastModify({
          api_name: API_LAST_MODIFIED_NAME.KANBAN_CARD,
          user_id: userId,
          email,
          updated_date: Math.max(...timeLastModify)
        }, true);
      }
    } catch (err) {
      return err;
    }
  }

  async createSystemKanbanOfCollection(data: TSystemKanban): Promise<void> {
    const { user_id, collection_id, is_migrate } = data;
    const collectionOption: GetOptionInterface<CollectionEntity> = {
      fields: ['id', 'type', 'user_id'],
      conditions: {
        id: collection_id,
        is_trashed: IS_TRASHED.NOT_TRASHED
      }
    };
    const itemCollection: CollectionEntity =
      await this.collectionRepo.getItemByOptions(collectionOption);

    if (!itemCollection) {
      throw Error('Collection not found');
    }

    let kanbanTypes = [];
    if (itemCollection.user_id === user_id) {
      kanbanTypes = [
        { name: OBJ_TYPE.RECENTLY, sort: 1 },
        { name: OBJ_TYPE.EMAIL, sort: 2 },
        { name: OBJ_TYPE.VEVENT, sort: 3 },
        { name: OBJ_TYPE.VTODO, sort: 4 },
        { name: OBJ_TYPE.VCARD, sort: 5 },
        { name: OBJ_TYPE.CALLS, sort: 5.5 },
        { name: OBJ_TYPE.VJOURNAL, sort: 6 },
        { name: OBJ_TYPE.URL, sort: 7 },
        { name: OBJ_TYPE.FILE, sort: 8 }
      ];
      if (itemCollection.type === COLLECTION_TYPE.SHARE_COLLECTION) {
        kanbanTypes.push({ name: OBJ_TYPE.MEMBER, sort: 0 });
        kanbanTypes.push({ name: OBJ_TYPE.NOTIFICATIONS, sort: 0.5 });
      }
    } else if (itemCollection.type === COLLECTION_TYPE.SHARE_COLLECTION) {
      // generate for member
      kanbanTypes = [
        { name: OBJ_TYPE.NOTIFICATIONS, sort: -0.5 },
        { name: OBJ_TYPE.RECENTLY, sort: 0 },
        { name: OBJ_TYPE.VEVENT, sort: 1 },
        { name: OBJ_TYPE.VTODO, sort: 2 },
        { name: OBJ_TYPE.CALLS, sort: 2.5 },
        { name: OBJ_TYPE.VJOURNAL, sort: 3 },
        { name: OBJ_TYPE.URL, sort: 4 },
      ];
    }

    let minNum = 0;
    if (is_migrate) {
      minNum = await this.kanbanRepo.getMinTable(user_id, collection_id);
    }
    let timeLastModify: number;
    const currentDate = getUtcMillisecond();

    kanbanTypes.sort((a, b) => a.sort - b.sort);
    const lstSystemKanbanEntity = [];
    for (const [index, kbType] of kanbanTypes.entries()) {
      const { color, sortType, name } = SYSTEM_KANBAN[kbType.name];

      const getMinByIndex: number = Number(this.generateMinusOrderNum(minNum, index));
      const dateItem = getTimestampDoubleByIndex(currentDate, index);

      if (index === kanbanTypes.length - 1) {
        timeLastModify = dateItem;
      }

      const itemSystemkanban = {
        user_id,
        kanban_type: KANBAN_TYPE.SYSTEM,
        collection_id: data.collection_id,
        color,
        sort_by_type: sortType,
        name,
        order_number: getMinByIndex,
        created_date: dateItem,
        updated_date: dateItem,
        order_update_time: dateItem,
      };
      lstSystemKanbanEntity.push(itemSystemkanban);
    }
    await this.createSystemKanban(lstSystemKanbanEntity);

    // Update api last modified
    await this.apiLastModifiedService.createLastModify({
      api_name: API_LAST_MODIFIED_NAME.KANBAN,
      user_id: data.user_id,
      email: data.email,
      updated_date: timeLastModify
    }, true);
  }

  async createSystemKanban(lstSystemKanbanEntity) {
    try {
      await this.kanbanRepo.insert(lstSystemKanbanEntity);
    } catch (error) {
      // tslint:disable-next-line: no-console
      console.log('Loi tu system kanban', error);
    }
  }

  async createKanban(userId: number, kanbanParam: Partial<KanbanEntity>) {
    try {
      const kanbanOption: GetOptionInterface<KanbanEntity> = {
        fields: ['id'],
        conditions: {
          user_id: userId,
          name: kanbanParam.name,
          collection_id: kanbanParam.collection_id,
          kanban_type: KANBAN_TYPE.SYSTEM
        }
      };
      const itemKanban: KanbanEntity =
        await this.kanbanRepo.getItemByOptions(kanbanOption);

      if (itemKanban && itemKanban.id > 0) {
        return;
      }

      const kanbanData = this.kanbanRepo.create({
        user_id: userId,
        kanban_type: KANBAN_TYPE.SYSTEM,
        ...kanbanParam,
        updated_date: kanbanParam.created_date,
        order_update_time: kanbanParam.created_date,
      });
      await this.kanbanRepo.save(kanbanData);
    } catch (err) {
      if (err instanceof QueryFailedError) {
        if (err['code'] === 'ER_DUP_ENTRY' && err.message
          .includes('uniq_on_user_id_and_updated_date')) {
          const dateTime = kanbanParam.created_date + 0.001;
          const kanban = this.kanbanRepo.create({
            user_id: userId,
            kanban_type: KANBAN_TYPE.SYSTEM,
            ...kanbanParam,
            updated_date: dateTime,
            order_update_time: dateTime
          });
          await this.kanbanRepo.save(kanban);
        }
      }
    }
  }

  generateMinusOrderNum(currentNumber: number, pos: number) {
    const currentIndexByPos = RESET_ORDER_CONFIG.DECREASE_ORDER_NUM * (pos + 1);
    // generate random last 4 numbers
    const random4Latest = Math.floor(randUtil() * 1000) / 10000;
    return (currentNumber - currentIndexByPos - random4Latest).toFixed(4);
  }

}