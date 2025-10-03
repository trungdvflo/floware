import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Decimal } from 'decimal.js';
import { In, LessThan, MoreThan } from 'typeorm';
import { API_LAST_MODIFIED_NAME } from '../../common/constants/api-last-modify.constant';
import { SORT_OBJECT, SORT_OBJECTS_STATE, SORT_OBJECT_TYPE } from '../../common/constants/common.constant';
import { WORKER_OBJECT } from '../../common/constants/worker.constant';
import { ISortObject, SortAbleObject } from '../../common/interface/object.interface';
import { CloudEntity } from '../../common/models/cloud.entity';
import { DeletedItemEntity } from '../../common/models/deleted-item.entity';
import { KanbanCardEntity } from '../../common/models/kanban-card.entity';
import { KanbanEntity } from '../../common/models/kanban.entity';
import { SortObjectEntity } from '../../common/models/sort-object.entity';
import { ThirdPartyAccountEntity } from '../../common/models/third-party-account.entity';
import { UrlEntity } from '../../common/models/url.entity';
import { UserEntity } from '../../common/models/user.entity';
import { CommonApiLastModifiedService } from '../../common/modules/last-modified/api-last-modify-common.service';
import { CalendarObjectsRepository } from '../../common/repository/calendar-objects.repository';
import { CloudRepository } from '../../common/repository/cloud.repository';
import { DeleteItemRepository } from '../../common/repository/delete-item.repository';
import { KanbanCardRepository } from '../../common/repository/kanban-card.repository';
import { KanbanRepository } from '../../common/repository/kanban.repository';
import { SortObjectRepository } from '../../common/repository/sort-object.repository';
import {
  ThirdPartyAccountRepository
} from '../../common/repository/third-party-account.repository';
import { UrlRepository } from '../../common/repository/url.repository';
import { UserRepository } from '../../common/repository/user.repository';
import {
  TimestampDouble,
  generateRandomDecimal,
  getUtcMillisecond, groupArrayOfObjects
} from '../../common/utils/common';
import {
  generateNewOrderNumber,
  generateRangeLength,
  generateRangeNumber,
  initSort
} from './sort.util';

@Injectable()
export class SortObjectService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly apiLastModifiedService: CommonApiLastModifiedService,
    private readonly thirdPartyAccountRepo: ThirdPartyAccountRepository,
    private readonly userRepo: UserRepository,
    private readonly deleteItemRepo: DeleteItemRepository,
    private readonly sortObjectRepo: SortObjectRepository,
    private readonly calendarObjectRepo: CalendarObjectsRepository,
    private readonly kanbanRepo: KanbanRepository,
    private readonly kanbanCardRepo: KanbanCardRepository,
    private readonly urlRepo: UrlRepository,
    private readonly cloudRepo: CloudRepository
  ) {
  }

  async handleSortOrder({
    email, object_type, request_uid, objects
  }: ISortObject)
    : Promise<boolean> {
    try {
      const userInfo: UserEntity = await this.userRepo
        .findOne({
          select: ["id", "email"],
          where: { email }
        });
      if (!userInfo) {
        return false;
      }
      const cacheCurrentKey: string = this.CacheCurrentKey(userInfo.id, request_uid);
      const cacheState: string | undefined = await this.cache.get(cacheCurrentKey);
      if (!cacheState || cacheState !== SORT_OBJECTS_STATE.INIT) {
        return false;
      }

      await this.cache.set(
        cacheCurrentKey,
        SORT_OBJECTS_STATE.IN_PROCESS,
        { ttl: SORT_OBJECT.REDIS_TTL }
      );

      switch (object_type) {
        case SORT_OBJECT_TYPE.CANVAS:
          const groupKanbans = groupArrayOfObjects(objects, "kanban_id");
          for (const kanbanId in groupKanbans) {
            if (kanbanId && groupKanbans[kanbanId]) {
              await this.sortQueueProcess(object_type, email,
                userInfo, groupKanbans[kanbanId], +kanbanId);
            }
          }
          break;
        case SORT_OBJECT_TYPE.KANBAN:
          const groupCols = groupArrayOfObjects(objects, "collection_id");
          for (const collectionId in groupCols) {
            if (collectionId && groupCols[collectionId]) {
              await this.sortQueueProcess(object_type, email, userInfo,
                groupCols[collectionId], +collectionId);
            }
          }
          break;
        case SORT_OBJECT_TYPE.VTODO:
          const dataTodo = await this.handleLogicTodo(objects, userInfo);
          if (dataTodo.length) {
            await this.sortQueueProcess(object_type, email, userInfo, dataTodo);
          }
          break;
        case SORT_OBJECT_TYPE.CSFILE:
        case SORT_OBJECT_TYPE.URL:
          await this.sortQueueProcess(object_type, email, userInfo, objects);
          break;
        default:
          break;
      }
      await this.cache.set(
        cacheCurrentKey,
        SORT_OBJECTS_STATE.DONE,
        { ttl: SORT_OBJECT.REDIS_TTL }
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  private CacheCurrentKey(userId: number, request_uid: string) {
    return `${WORKER_OBJECT.CACHE_SORT_KEY}:${userId}:${SORT_OBJECT.FUNC}:${request_uid}`;
  }

  private async handleLogicTodo(todoObjectOrder, userInfo) {
    const { floItem, flo3rd } = this.separateItems(todoObjectOrder);
    const [dataFlo, data3Rd] = await Promise.all([
      (floItem.length) ? (this.handleDataOfFlo(floItem, userInfo)) : [],
      (flo3rd.length) ? (this.handleDataOf3Rd(flo3rd, userInfo)) : []
    ]);
    const filterData = [...dataFlo, ...data3Rd];
    return filterData;
  }

  private separateItems(dataSeparate) {
    const flo3rd = [];
    const floItem = dataSeparate.filter(item => {
      if (item.account_id === 0) return item;
      flo3rd.push(item);
    });
    return { floItem, flo3rd };
  }

  private filterItem(dataRespond, dataOrigin, keys: object) {
    const itemNoExisted = [];
    const itemDuplicated = dataOrigin.filter(item => {
      const dataCheck = dataRespond.some((itemRespond) => {
        if (itemRespond[keys['keyCompare']] === item[keys['keyData']]) {
          return itemRespond;
        }
      });
      if (!dataCheck) {
        itemNoExisted.push(item);
      }
      return dataCheck;
    });
    return { itemDuplicated, itemNoExisted };
  }

  private async handleDataOf3Rd(data, userInfo) {
    let itemExisted = [];
    const list3rdAcc: ThirdPartyAccountEntity[] = await this.thirdPartyAccountRepo
      .find({
        select: ['id'],
        where: {
          id: In(data.map((i) => i.account_id)),
          user_id: userInfo.id
        },
      });

    if (list3rdAcc.length) {
      const { itemDuplicated } = this.filterItem(list3rdAcc, data,
        { keyData: 'id', keyCompare: 'account_id' });
      if (itemDuplicated.length) {
        itemExisted = [...itemExisted, ...itemDuplicated];
      }
    }
    return itemExisted;
  }

  private async handleDataOfFlo(data, userInfo) {
    let itemExisted = [];
    // check uid of flo
    const principaluri = `principals/${userInfo.email}`;
    const uidItems = await this.calendarObjectRepo
      .getListTodoUid(principaluri, data.map((item) => item.uid));

    if (uidItems.length) {
      const { itemDuplicated } = this.filterItem(uidItems, data,
        { keyData: 'uid', keyCompare: 'uid' });

      if (itemDuplicated.length) {
        const deleteItems: DeletedItemEntity[] =
          await this.deleteItemRepo.find({
            where: {
              user_id: userInfo.id,
              item_uid: In(itemDuplicated.map((i) => i.uid)),
              item_type: SORT_OBJECT_TYPE.VTODO.toString()
            }
          });

        const { itemNoExisted } =
          this.filterItem(deleteItems, itemDuplicated, { keyData: 'item_id', keyCompare: 'uid' });
        if (itemNoExisted.length) {
          itemExisted = [...itemExisted, ...itemNoExisted];
        }
      }
    }
    return itemExisted;
  }

  private async sortQueueProcess(object_type: SORT_OBJECT_TYPE, email: string,
    userInfo: UserEntity, objects: SortAbleObject[], groupId?: number) {
    const localData = await this.GenerateLocalList(
      object_type,
      email,
      userInfo,
      groupId
    );
    const requestData = await this.ValidateData(
      objects,
      localData,
      object_type,
      userInfo
    );

    const list = this.MergeHandle(localData, requestData, object_type);
    await this.ModifyData(list, object_type, userInfo);
  }

  private async ModifyData(objects, object_type, userInfo) {
    if (!objects || objects.length <= 0) {
      return;
    }
    const filterObjects = await this.FilterDeletedItems(
      objects,
      object_type,
      userInfo
    );
    const modifyData = this.QueryDataHandle(
      filterObjects,
      object_type,
      userInfo
    );
    await this.InsertSortObject(
      modifyData.insertData,
      object_type,
      userInfo
    );

    await this.UpdateSortObject(
      modifyData.updateData,
      object_type,
      userInfo
    );
  }

  private QueryDataHandle(objects: SortAbleObject[],
    object_type: SORT_OBJECT_TYPE, userInfo: UserEntity) {
    const result = {
      insertData: [],
      updateData: [],
    };
    const initTimeDouble = getUtcMillisecond();
    objects.forEach((obj, index) => {
      if (obj.type === "new" || obj.type === "change") {
        const orderNumber = obj.order_number.toString();

        const currentTimeDouble = (initTimeDouble + index) / 1000;
        switch (obj.type) {
          case "new":
            result.insertData.push({
              user_id: userInfo.id,
              object_uid: obj.object_uid,
              object_type,
              order_number: orderNumber,
              account_id: obj.account_id,
              object_href: obj.object_href,
              order_update_time:
                obj.order_update_time || currentTimeDouble,
              created_date: currentTimeDouble,
              updated_date: currentTimeDouble,
            });
            break;
          case "change":
            if (!obj.objOrder) {
              result.insertData.push({
                user_id: userInfo.id,
                object_uid: obj.object_uid,
                object_type,
                order_number: orderNumber,
                account_id: obj.account_id,
                object_href: obj.object_href,
                order_update_time: obj.order_update_time || currentTimeDouble,
                created_date: currentTimeDouble,
                updated_date: currentTimeDouble,
              });
            } else {
              result.updateData.push({
                args: {
                  object_uid: obj.object_uid,
                  object_type,
                  order_number: orderNumber,
                  account_id: obj.account_id,
                  object_href: obj.object_href,
                  order_update_time:
                    obj.order_update_time || currentTimeDouble,
                  updated_date: currentTimeDouble,
                },
                condition: {
                  id: obj.objOrder.id,
                  user_id: userInfo.id,
                  order_update_time: LessThan(obj.order_update_time)
                },
              });
            }
            break;
          default:
            break;
        }
      }
    });
    return result;
  }

  private async InsertSortObject(objects: SortObjectEntity[],
    object_type: SORT_OBJECT_TYPE, userInfo: UserEntity) {
    if (objects.length && object_type === SORT_OBJECT_TYPE.VTODO) {
      for (const obj of objects) {
        await this.sortObjectRepo.save(obj);
      }
      await this.apiLastModifiedService.createLastModify({
        api_name: API_LAST_MODIFIED_NAME.TODO,
        user_id: userInfo.id,
        email: userInfo.email,
        updated_date: Math.max(...objects.map((item) => item.updated_date))
      }, true);

    }
  }

  private async UpdateSortObject(objects, object_type, userInfo) {
    if (objects.length === 0) { return; }
    let lastModifyAPI;
    const updated_date: number = Math.max(...objects.map((item) => item.args.updated_date));

    switch (object_type) {
      case SORT_OBJECT_TYPE.VTODO: {
        for (const obj of objects) {
          await this.updateSortWithRepo(this.sortObjectRepo, obj.condition, obj.args);
        }
        lastModifyAPI = API_LAST_MODIFIED_NAME.TODO;
        break;
      }

      case SORT_OBJECT_TYPE.URL: {
        for (const obj of objects) {
          await this.updateSortWithRepo(this.urlRepo, obj.condition, obj.args);
        }
        lastModifyAPI = API_LAST_MODIFIED_NAME.URL;
        break;
      }

      case SORT_OBJECT_TYPE.CSFILE: {
        for (const obj of objects) {
          await this.updateSortWithRepo(this.cloudRepo, obj.condition, obj.args);
        }
        lastModifyAPI = API_LAST_MODIFIED_NAME.CLOUD;
        break;
      }

      case SORT_OBJECT_TYPE.KANBAN: {
        for (const obj of objects) {
          await this.updateSortWithRepo(this.kanbanRepo, obj.condition, obj.args);
        }
        lastModifyAPI = API_LAST_MODIFIED_NAME.KANBAN;
        break;
      }

      case SORT_OBJECT_TYPE.CANVAS: {
        for (const obj of objects) {
          await this.updateSortWithRepo(this.kanbanCardRepo, obj.condition, obj.args);
        }
        lastModifyAPI = API_LAST_MODIFIED_NAME.KANBAN_CARD;
        break;
      }
      default:
        break;
    }

    await this.apiLastModifiedService.createLastModify({
      api_name: lastModifyAPI,
      user_id: userInfo.id,
      email: userInfo.email,
      updated_date
    }, true);
  }

  private async ValidateData(objects, localData, object_type, userInfo) {
    if (object_type !== SORT_OBJECT_TYPE.VTODO) {
      return this.MergeValidateData(objects, localData);
    }
    const floTodos = objects.filter((i) => i.account_id === 0);
    const thirdPartyTodos = objects.filter((i) => i.account_id > 0);

    const groupItemIds = floTodos.map((item) => item.object_uid);
    const principaluri = `principals/${userInfo.email}`;
    let rsItems = [];
    const items = floTodos.length === 0
      ? []
      : await this.calendarObjectRepo.
        getListTodoUid(Buffer.from(principaluri, "utf8"), groupItemIds);

    if (thirdPartyTodos.length) {
      rsItems = [
        ...rsItems,
        ...thirdPartyTodos.map((i) => {
          return { object_uid: i.uid };
        }),
      ];
    }
    if (items.length) {
      rsItems = [
        ...rsItems,
        ...items.map((item) => {
          return { object_uid: item.uid };
        }),
      ];
    }
    return this.MergeValidateData(objects, rsItems);
  }

  private MergeValidateData(requestData, items) {
    if (!items || items.length === 0) {
      return [];
    }

    const result = [];
    items.forEach((item) => {
      const requestItem = requestData.find(
        (data) => data.object_uid.toString() === item.object_uid.toString()
      );
      if (requestItem) {
        result.push(requestItem);
      }
    });
    return result;
  }

  private async FilterDeletedItems(
    objects: SortAbleObject[],
    object_type: SORT_OBJECT_TYPE,
    userInfo: UserEntity) {
    const deletedItems = await this.findDeletedItemByType(objects, object_type, userInfo.id);
    if (deletedItems.length === 0) {
      return objects;
    }
    return objects.filter((obj: SortAbleObject) => {
      const isTodo: boolean = object_type === SORT_OBJECT_TYPE.VTODO;
      return -1 === deletedItems.findIndex(
        (deletedItem) => (isTodo && deletedItem.item_uid === obj.object_uid)
          || (!isTodo && deletedItem.item_id === +obj.object_uid)
      );
    });
  }

  async findDeletedItemByType(objects: SortAbleObject[],
    object_type: SORT_OBJECT_TYPE, userId: number) {
    if (object_type === SORT_OBJECT_TYPE.VTODO) {
      const uids = objects
        .filter(obj => obj.objOrder)
        .map(obj => obj.uid);
      return await this.deleteItemRepo
        .find({
          select: ["item_uid"],
          where: {
            user_id: userId,
            item_uid: In(uids),
            item_type: object_type.toString()
          }
        });
    }
    const ids = objects.filter(obj => obj.objOrder)
      .map(obj => obj.id);
    return await this.deleteItemRepo.find({
      select: ["item_id"],
      where: {
        user_id: userId,
        item_id: In(ids),
        item_type: object_type.toString()
      }
    });
  }

  private async GenerateLocalList(
    object_type: SORT_OBJECT_TYPE,
    email: string,
    userInfo: UserEntity,
    groupId: number) {
    if (!email) {
      return false;
    }

    const objects = await this.findObjectsToSort(object_type, userInfo, groupId);

    return this.GenerateLocalData(objects, object_type);
  }

  private async findObjectsToSort(object_type: SORT_OBJECT_TYPE,
    userInfo: UserEntity, groupId: number): Promise<SortAbleObject[]> {
    switch (object_type) {
      case SORT_OBJECT_TYPE.VTODO:
        const sorts: SortObjectEntity[] = await this.sortObjectRepo.find({
          where: {
            user_id: userInfo.id
          }
        });
        return sorts;
      case SORT_OBJECT_TYPE.URL:
        const urls: UrlEntity[] = await this.urlRepo.find({
          select: ['id', 'order_number', 'order_update_time', 'updated_date'],
          where: {
            user_id: userInfo.id,
            is_trashed: 0
          },
        });
        return urls;
      case SORT_OBJECT_TYPE.CSFILE:
        const clouds: CloudEntity[] = await this.cloudRepo.find({
          select: ['id', 'order_number', 'order_update_time', 'updated_date'],
          where: {
            user_id: userInfo.id
          },
        });
        return clouds;
      case SORT_OBJECT_TYPE.KANBAN:
        const kanbans: KanbanEntity[] = await this.kanbanRepo.find({
          select: ['id', 'collection_id', 'order_number', 'order_update_time', 'updated_date'],
          where: {
            user_id: userInfo.id,
            collection_id: groupId,
            is_trashed: 0
          },
        });
        return kanbans;
      case SORT_OBJECT_TYPE.CANVAS:
        const kanbanCards: KanbanCardEntity[] = await this.kanbanCardRepo.find({
          select: ['id', 'kanban_id', 'order_number', 'order_update_time', 'updated_date'],
          where: {
            user_id: userInfo.id,
            kanban_id: groupId,
            is_trashed: 0
          },
        });
        return kanbanCards;
      default:
        return [];
    }
  }

  async GenerateLocalData(objects, object_type) {
    if (!objects) {
      return [];
    }
    const result = [];
    if (object_type === SORT_OBJECT_TYPE.VTODO) {
      objects.forEach(object => {
        result.push({
          id: object.id,
          object_uid: object.object_uid,
          order_number: new Decimal(object.order_number),
          object_type,
          order_update_time: object.order_update_time || 0,
          updated_date: object.updated_date,
        });
      });
    } else {
      objects.forEach(object => {
        result.push({
          id: object.id,
          object_uid: object.id,
          order_number: new Decimal(object.order_number),
          object_type,
          updated_date: object.updated_date,
          order_update_time: object.order_update_time || 0,
        });
      });
    }
    return result;
  }

  private MergeHandle(localData, requestData, object_type: SORT_OBJECT_TYPE) {
    if (!localData && localData.length <= 0) {
      const result = [];
      requestData.forEach(item => {
        let updatedDate = item.order_update_time;
        if (item.order_update_time > TimestampDouble()) {
          updatedDate = TimestampDouble();
        }
        result.push({
          ...item,
          updated_date: updatedDate,
          order_number: new Decimal(item.order_number),
          type: 'new'
        });
      });
      return result;
    }

    if (!requestData || requestData.length <= 0) {
      return [];
    }
    const duplicateItems = this.DuplicateItems(localData, requestData, object_type);
    if (!duplicateItems) {
      return this.MergeSimpleHandle(localData, requestData);
    }
    return this.MergeConflictHandle(localData, requestData, duplicateItems);
  }

  DuplicateItems(localData, requestData, object_type) {
    const duplicateItems = [];
    requestData.forEach(item => {
      const itemOrderDecimal = new Decimal(item.order_number.toString());
      localData.forEach(localItem => {
        const localItemOrderDecimal = new Decimal(localItem.order_number.toString());
        if (itemOrderDecimal.eq(localItemOrderDecimal)
          && item.object_uid !== localItem.object_uid) {
          switch (object_type) {
            case SORT_OBJECT_TYPE.KANBAN:
              if (item.collection_id !== localItem.collection_id) {
                break;
              }
            case SORT_OBJECT_TYPE.CANVAS:
              if (item.kanban_id !== localItem.kanban_id) {
                break;
              }
            default:
              let updatedDate = item.order_update_time;
              if (item.order_update_time > TimestampDouble()) {
                updatedDate = TimestampDouble();
              }
              duplicateItems.push({
                ...item,
                updated_date: updatedDate
              });
          }
        }
      });
    });
    return duplicateItems;
  }

  MergeSimpleHandle = (localData, requestData, mergeConflict = false) => {
    try {
      const result = Object.assign([], localData);
      requestData.forEach(requestItem => {
        const existItem = localData.find(item => item.object_uid === requestItem.object_uid);
        const requestItemOrder = new Decimal(requestItem.order_number.toString());
        if (!existItem) {
          result.push({
            ...requestItem,
            order_number: requestItemOrder,
            type: 'new'
          });
        } else {
          const existItemOrder = new Decimal(existItem.order_number.toString());
          const diff = new Decimal(requestItem.order_update_time.toString())
            .minus(existItem.order_update_time.toString());
          if (!requestItemOrder.eq(existItemOrder) && diff.gt(0)) {
            if (mergeConflict) {
              const tempIndex = result.findIndex(item => item.object_uid === existItem.object_uid);
              result.splice(tempIndex, 1);
            }
            result.push({
              ...requestItem,
              order_number: requestItemOrder,
              objOrder: existItem,
              type: 'change'
            });
          } else if (diff.gt(0)) {
            result.push({
              ...requestItem,
              order_number: requestItemOrder,
              objOrder: existItem,
              type: 'change'
            });
          } else {
            const existItemIndex = result
              .findIndex(item => item.object_uid === requestItem.object_uid);
            if (existItemIndex) {
              result[existItemIndex].type = 'nochange';
            }
          }
        }
      });
      return this.SortList(result);
    } catch (error) {
      throw error;
    }
  }

  private MergeConflictHandle(localData, requestData, conflictItems) {
    let mergeList = this.MergeSimpleHandle(localData, requestData, true);
    conflictItems.forEach(conflictItem => {
      const temp = mergeList.find(item => item.object_uid === conflictItem.object_uid);
      const localItem = localData.find(item => item.object_uid === temp.object_uid);
      if (temp && temp.type === 'change' && localItem && localItem.object_uid) {
        const order_update_time = conflictItem.order_update_time || TimestampDouble();
        mergeList = this.ResolveConflictItem(mergeList, {
          ...conflictItem,
          order_update_time: Number(order_update_time) + SORT_OBJECT.ORDER_UPDATE_TIME_ADD,
          objOrder: localItem
        }, 'change');
      } else if (temp.type !== 'nochange') {
        mergeList = this.ResolveConflictItem(mergeList, conflictItem, 'new');
      }
    });

    return this.SortList(mergeList);
  }

  private ResolveConflictItem(localData, conflictItemInfo, type = 'new', count = 0) {
    try {
      const items = Object.assign([], localData);
      if (count >= 10) {
        return items;
      }
      if (!conflictItemInfo || !conflictItemInfo.object_uid) {
        return this.SortList(items);
      }

      const duplicateIndex = items.findIndex(
        item => item.object_uid === conflictItemInfo.object_uid
      );
      const conflictItem = { ...conflictItemInfo };
      const conflictOrderNumber = new Decimal(conflictItem.order_number);

      if (conflictOrderNumber.lt(SORT_OBJECT.MIN_ORDER_NUMBER)) {
        const conflictItemHandle = this.MinConflictHandle(localData, conflictItemInfo);
        conflictItem.order_number = conflictItemHandle.order_number;
        conflictItem.type = conflictItemHandle.type;
        items[duplicateIndex] = conflictItem;
      } else if (conflictOrderNumber.gt(SORT_OBJECT.MAX_ORDER_NUMBER)) {
        const conflictItemHandle = this.MaxConflictHandle(localData, conflictItemInfo);
        conflictItem.order_number = conflictItemHandle.order_number;
        conflictItem.type = conflictItemHandle.type;
        items[duplicateIndex] = conflictItem;
      } else {
        const initConflict = this.RangeHandle(items, conflictItemInfo, count);
        if (!initConflict) {
          items.splice(duplicateIndex, 1);
          return this.SortList(items);
        }
        if (initConflict.dragDecisive === 'moveTop') {
          conflictItem.order_number = conflictOrderNumber
            .minus(SORT_OBJECT.ORDER_NUMBER_MOVE_TOP)
            .floor();
          conflictItem.type = type;
          items[duplicateIndex] = conflictItem;
        } if (initConflict.dragDecisive === 'moveBottom') {
          conflictItem.order_number = conflictOrderNumber
            .plus(SORT_OBJECT.ORDER_NUMBER_MOVE_BOTTOM)
            .ceil();
          conflictItem.type = type;
          items[duplicateIndex] = conflictItem;
        } if (
          (
            initConflict.rangeLength <= SORT_OBJECT.MAX_ORDER_NUMBER_LENGTH
            && initConflict.rangeLength >= 0)
          && initConflict.baseA
          && initConflict.baseB
        ) {
          const order = generateNewOrderNumber(
            initConflict.baseA,
            initConflict.baseB,
            initConflict.range
          );
          conflictItem.order_number = order.order;
          conflictItem.type = type;
          items[duplicateIndex] = conflictItem;
        }

      }

      const newConflictItem = this.SetConflictItemOrderNumber(items, conflictItem);
      if (newConflictItem) {
        const countResolveConflict = count + 1;
        return this.ResolveConflictItem(this.SortList(items), {
          ...newConflictItem
        }, 'change', countResolveConflict);
      }
      return this.SortList(items);
    } catch (error) {
      throw error;
    }
  }

  private SortList(data) {
    return data.sort((a, b) => {
      const aOrderNumber = new Decimal(a.order_number);
      const bOrderNumber = new Decimal(b.order_number);
      if (aOrderNumber.eq(bOrderNumber)) {
        return (b.updated_date - a.updated_date);
      }
      return (aOrderNumber.minus(bOrderNumber));
    });
  }

  private MinConflictHandle(localData, conflictItemInfo) {
    const items = Object.assign([], localData);
    const conflictItem = Object.assign({}, conflictItemInfo);
    const conflictOrderNumber = new Decimal(conflictItem.order_number);

    if (conflictOrderNumber.lt(SORT_OBJECT.MIN_ORDER_NUMBER)) {
      conflictItem.order_number = new Decimal(SORT_OBJECT.MIN_ORDER_NUMBER);
      return conflictItem;
    }
    //
    let duplicateOrderIndex = -1;
    items.forEach((item, index) => {
      if (item.order_number.eq(conflictItem.order_number) && duplicateOrderIndex === -1) {
        duplicateOrderIndex = index;
      }
    });

    if (duplicateOrderIndex === -1) {
      conflictItem.order_number = conflictItemInfo.order_number;
      return conflictItem;
    }

    const duplicateOrder = localData[duplicateOrderIndex].order_number.toString();
    const bIndex = duplicateOrderIndex + 2;
    let bNumberOrder = conflictOrderNumber.plus(SORT_OBJECT.ORDER_NUMBER_MOVE_BOTTOM);
    if (localData && localData[bIndex] && localData[bIndex].order_number) {
      bNumberOrder = localData[bIndex].order_number;
    }

    const initData = initSort(duplicateOrder, bNumberOrder);
    if (!initData) {
      return conflictItem;
    }
    const baseBDecimail = new Decimal(initData.baseB.toString());
    const baseADecimail = new Decimal(initData.baseA.toString());

    const range: Decimal = baseBDecimail.minus(baseADecimail);
    const order = generateNewOrderNumber(initData.baseA, initData.baseB, range);
    conflictItem.order_number = order.order;
    conflictItem.type = 'change';
    return conflictItem;
  }

  private MaxConflictHandle(localData, conflictItemInfo) {
    const items = Object.assign([], localData);
    const conflictItem = Object.assign({}, conflictItemInfo);
    const conflictOrderNumber = new Decimal(conflictItem.order_number);
    if (conflictOrderNumber.gt(SORT_OBJECT.MAX_ORDER_NUMBER)) {
      conflictItem.order_number = new Decimal(SORT_OBJECT.MAX_ORDER_NUMBER);
      return conflictItem;
    }
    //
    let duplicateOrderIndex = -1;
    items.forEach((item, index) => {
      if (item.order_number.eq(conflictItem.order_number) && duplicateOrderIndex === -1) {
        duplicateOrderIndex = index;
      }
    });

    if (duplicateOrderIndex === -1) {
      conflictItem.order_number = conflictItemInfo.order_number;
      return conflictItem;
    }
    const duplicateOrder = localData[duplicateOrderIndex].order_number.toString();
    const bIndex = duplicateOrderIndex - 1;
    let bNumberOrder = conflictOrderNumber.minus(SORT_OBJECT.ORDER_NUMBER_MOVE_TOP);
    if (localData && localData[bIndex] && localData[bIndex].order_number) {
      bNumberOrder = localData[bIndex].order_number;
    }

    const initData = initSort(bNumberOrder, duplicateOrder);
    if (!initData) {
      return conflictItem;
    }
    const baseBDecimail = new Decimal(initData.baseB.toString());
    const baseADecimail = new Decimal(initData.baseA.toString());

    const range = baseBDecimail.minus(baseADecimail);
    const order = generateNewOrderNumber(initData.baseA, initData.baseB, range);
    conflictItem.order_number = order.order;
    conflictItem.type = 'change';

    return conflictItem;
  }

  private SetConflictItemOrderNumber(data, conflictItem) {
    const conflictOrderNumber = new Decimal(conflictItem.order_number);
    if (conflictOrderNumber.lt(SORT_OBJECT.MIN_ORDER_NUMBER)) {
      return conflictItem;
    } if (conflictOrderNumber.gt(SORT_OBJECT.MAX_ORDER_NUMBER)) {
      return conflictItem;
    }

    let duplicatedOrderNumber = {};
    data.forEach(compareItem => {
      if (compareItem.order_number.eq(conflictOrderNumber)
        && (compareItem.object_uid !== conflictItem.object_uid)) {
        duplicatedOrderNumber = {
          ...conflictItem,
          order_number: compareItem.order_number
        };
      }
    });
    return duplicatedOrderNumber;
  }

  private RangeHandle(localData, conflictItemInfo, node) {
    const items = Object.assign([], localData);
    let duplicateOrderIndex = -1;
    items.forEach((item, index) => {
      if (item.object_uid === conflictItemInfo.object_uid && duplicateOrderIndex === -1) {
        duplicateOrderIndex = index;
      }
    });
    const conflictOrderNumber = new Decimal(conflictItemInfo.order_number);
    const duplicateOrder = localData[duplicateOrderIndex].order_number.toString();

    let aNumberIndex = duplicateOrderIndex - 1;
    let bNumberIndex = duplicateOrderIndex + 1;

    if (node > 0) {
      aNumberIndex = duplicateOrderIndex - node;
      bNumberIndex = duplicateOrderIndex + node + 1;
    }

    let aNumberOrder = false;
    let bNumberOrder = false;

    if (localData && localData[aNumberIndex] && localData[aNumberIndex].order_number) {
      aNumberOrder = localData[aNumberIndex].order_number;
    }

    if (localData && localData[bNumberIndex] && localData[bNumberIndex].order_number) {
      bNumberOrder = localData[bNumberIndex].order_number;
    }

    if (!aNumberOrder && !bNumberOrder) {
      if (aNumberIndex < 0) {
        if (conflictOrderNumber.lt(SORT_OBJECT.MIN_ORDER_NUMBER)) {
          // Check lower item
          const lowerItemInitLower = initSort(duplicateOrder, bNumberOrder);
          if (!lowerItemInitLower) {
            return false;
          }
          const lowerItemInitBaseBDecimailLower = new Decimal(
            lowerItemInitLower.baseB.toString()
          );
          const lowerItemInitBaseADecimailLower = new Decimal(
            lowerItemInitLower.baseA.toString()
          );
          const lowerItemRangeLower = lowerItemInitBaseBDecimailLower
            .minus(lowerItemInitBaseADecimailLower);
          const scaleLower = generateRangeNumber(lowerItemRangeLower);
          const rangeLengthLower = generateRangeLength(scaleLower);
          return {
            ...lowerItemInitLower,
            range: lowerItemRangeLower.toFixed(SORT_OBJECT.MAX_ORDER_NUMBER_TO_FIXED),
            rangeLengthLower,
            dragDecisive: 'moveDown'
          };
        }
        return { dragDecisive: 'moveBottom' };
      }

      if (bNumberIndex === items.length) {
        if (conflictOrderNumber.gt(SORT_OBJECT.MAX_ORDER_NUMBER)) {
          const upperItemInitUpper = initSort(aNumberOrder, duplicateOrder);
          if (!upperItemInitUpper) {
            return false;
          }
          const upperItemInitBaseBDecimailUpper = new Decimal(
            upperItemInitUpper.baseB.toString()
          );
          const upperItemInitBaseADecimailUpper = new Decimal(
            upperItemInitUpper.baseA.toString()
          );
          const upperItemRangeUpper = upperItemInitBaseBDecimailUpper.minus(
            upperItemInitBaseADecimailUpper)
            ;
          const scaleUpper = generateRangeNumber(upperItemRangeUpper);
          const rangeLengthUpper = generateRangeLength(scaleUpper);
          return {
            ...upperItemInitUpper,
            range: upperItemRangeUpper.toFixed(SORT_OBJECT.MAX_ORDER_NUMBER_TO_FIXED),
            rangeLengthUpper,
            dragDecisive: 'moveUp'
          };
        }
        return {
          baseA: null,
          baseB: null,
          rangeLength: null,
          range: null,
          dragDecisive: 'moveTop',
        };
      }
    }
    if (aNumberOrder && !bNumberOrder) {
      const upperItemInitMoveUp = initSort(aNumberOrder, duplicateOrder);
      if (!upperItemInitMoveUp) {
        return false;
      }

      const upperItemInitBaseBDecimailMoveUp = new Decimal(upperItemInitMoveUp.baseB.toString());
      const upperItemInitBaseADecimailMoveUp = new Decimal(upperItemInitMoveUp.baseA.toString());
      const upperItemRangeMoveUp = upperItemInitBaseBDecimailMoveUp.minus(
        upperItemInitBaseADecimailMoveUp
      );

      const scaleMoveUp = generateRangeNumber(upperItemRangeMoveUp);
      const rangeLengthMoveUp = generateRangeLength(scaleMoveUp);
      return {
        ...upperItemInitMoveUp,
        range: upperItemRangeMoveUp.toFixed(SORT_OBJECT.MAX_ORDER_NUMBER_TO_FIXED),
        rangeLengthMoveUp,
        dragDecisive: 'moveUp'
      };
    }
    if (!aNumberOrder && bNumberOrder) {
      const lowerItemInitMoveDown = initSort(duplicateOrder, bNumberOrder);
      if (!lowerItemInitMoveDown) {
        return false;
      }
      const lowerItemInitBaseBDecimailMoveDown = new Decimal(
        lowerItemInitMoveDown.baseB.toString()
      );
      const lowerItemInitBaseADecimailMoveDown = new Decimal(
        lowerItemInitMoveDown.baseA.toString()
      );
      const lowerItemRangeMoveDown = lowerItemInitBaseBDecimailMoveDown.minus(
        lowerItemInitBaseADecimailMoveDown
      );

      const scaleMoveDown = generateRangeNumber(lowerItemRangeMoveDown);
      const rangeLengthMoveDown = generateRangeLength(scaleMoveDown);
      return {
        ...lowerItemInitMoveDown,
        range: lowerItemRangeMoveDown.toFixed(SORT_OBJECT.MAX_ORDER_NUMBER_TO_FIXED),
        rangeLengthMoveDown,
        dragDecisive: 'moveDown'
      };
    }
    // Check upper item
    const upperItemInit = initSort(aNumberOrder, duplicateOrder);
    if (!upperItemInit) {
      return false;
    }

    const upperItemInitBaseBDecimail = new Decimal(upperItemInit.baseB.toString());
    const upperItemInitBaseADecimail = new Decimal(upperItemInit.baseA.toString());
    const upperItemRange = upperItemInitBaseBDecimail.minus(upperItemInitBaseADecimail);
    // Check lower item
    const lowerItemInit = initSort(duplicateOrder, bNumberOrder);
    if (!lowerItemInit) {
      return false;
    }

    const lowerItemInitBaseBDecimail = new Decimal(lowerItemInit.baseB.toString());
    const lowerItemInitBaseADecimail = new Decimal(lowerItemInit.baseA.toString());
    const lowerItemRange = lowerItemInitBaseBDecimail.minus(lowerItemInitBaseADecimail);
    //
    if (upperItemRange.gt(lowerItemRange)) {
      const scaleMoveUp = generateRangeNumber(upperItemRange);
      const rangeLengthMoveUp = generateRangeLength(scaleMoveUp);
      return {
        ...upperItemInit,
        range: upperItemRange.toFixed(SORT_OBJECT.MAX_ORDER_NUMBER_TO_FIXED),
        rangeLengthMoveUp,
        dragDecisive: 'moveUp'
      };
    }

    const scale = generateRangeNumber(lowerItemRange);
    const rangeLength = generateRangeLength(scale);
    return {
      ...lowerItemInit,
      range: lowerItemRange.toFixed(SORT_OBJECT.MAX_ORDER_NUMBER_TO_FIXED),
      rangeLength,
      dragDecisive: 'moveDown'
    };
  }

  private async updateSortWithRepo(repo, condition, updated, maxTry: number = 0) {
    if (maxTry === 10) {
      return;
    }
    try {
      return await repo.update(condition, {
        order_number: updated.order_number,
        order_update_time: updated.order_update_time,
        updated_date: updated.updated_date,
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return await this.updateSortWithRepo(repo, condition, {
          ...updated,
          order_number: +updated.order_number + +parseFloat('' + generateRandomDecimal()).toFixed(3)
        }, maxTry += 1);
      }
    }
  }

  async conflictResolver(repo, objData, where, maxTry = 0) {
    if (maxTry === 10) {
      return;
    }
    try {
      // do update
      if (objData.type === 'change') {
        await repo.update(where, objData);
      } else {
        await repo.save(objData);
      }
    } catch (e) {
      if (e.name === 'ER_DUP_ENTRY') {
        // find nearest greater

        const gt = await repo.findOne({
          where: {
            ...where,
            order_number: MoreThan(objData.order_number)
          },
        });
        // find nearest smaller
        const lt = await repo.findOne({
          where: {
            ...where,
            order_number: LessThan(objData.order_number)
          },
          order_by: 'order_number desc'
        });
        const newOrderNumber = ((+gt.order_number || 0) + (+lt.order_number || 0)) / 2;
        this.conflictResolver(repo, {
          ...objData, order_number: newOrderNumber
        }, where, maxTry += 1);
      }
    }
  }
}