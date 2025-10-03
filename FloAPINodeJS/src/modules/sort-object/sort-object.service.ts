import { BadRequestException, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { In } from 'typeorm/find-options/operator/In';
import { Repository } from 'typeorm/repository/Repository';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiLastModifiedName,
  DELETED_ITEM_RECOVER_TYPE, DELETED_ITEM_TYPE, IS_TRASHED, MAIN_KEY_CACHE, SORT_OBJECTS_STATE
} from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_WHEN_DELETE,
  MSG_FIND_NOT_FOUND,
  MSG_ITEM_IS_IN_DELETED_ITEM_COLLECTION,
  SortObjectResponseMessage
} from '../../common/constants/message.constant';
import {
  RESET_ORDER_QUEUE,
  RESET_ORDER_TTL,
  SORT_OBJECT_FUNC,
  SORT_OBJECT_QUEUE,
  SORT_OBJECT_TTL
} from '../../common/constants/sort-object.constant';
import { Cloud } from '../../common/entities/cloud.entity';
import { KanbanCard } from '../../common/entities/kanban-card.entity';
import { Kanban } from '../../common/entities/kanban.entity';
import { SortObject } from '../../common/entities/sort-object.entity';
import { IObjectOrder, ITodoObjectOrder } from '../../common/interfaces/object-order.interface';
import { IReq, IUser } from '../../common/interfaces/user';
import { LoggerService } from '../../common/logger/logger.service';
import { KanbanCardRepository } from '../../common/repositories/kanban-card.repository';
import { SortObjectRepository } from '../../common/repositories/sort-object.repository';
import { UrlRepository } from '../../common/repositories/url.repository';
import { CacheUtil } from '../../common/utils/cache.util';
import {
  filterIdExisted, removeDuplicateItems
} from '../../common/utils/common';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import {
  buildFailItemResponse,
  buildSingleResponseErr
} from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { SortObjectQueueService } from '../bullmq-queue/sort-object-queue.service';
import { DeleteCloudDTO } from '../cloud/dtos/delete-cloud.dto';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { GetSortObjectTodoDto } from '../todo/dtos/get-sort-object.dto.js';
import { BadRequestSortObjectError } from './sort-object.error';

interface IResetOrderStatus {
  status: string;
  completed_item: number;
  total_item: number;
}

@Injectable()
export class SortObjectService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly logger: LoggerService,
    @InjectRepository(SortObjectRepository)
    private readonly sortObjectRepository: SortObjectRepository,
    @InjectRepository(UrlRepository)
    private readonly urlRepository: UrlRepository,
    @InjectRepository(Cloud)
    private readonly cloudRepository: Repository<Cloud>,
    @InjectRepository(Kanban)
    private readonly kanbanRepository: Repository<Kanban>,
    @InjectRepository(KanbanCard)
    private readonly kanbanCardRepository: KanbanCardRepository,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly deletedItemService: DeletedItemService,
    private readonly sortObjectQueueService: SortObjectQueueService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
  ) {
  }

  public isDuplicate(objs: any[], object_type): boolean {
    const uniqueValues = new Set(objs.map((v) => v.order_number));
    if (uniqueValues.size < objs.length) {
      return true;
    }
    return false;
  }

  async checkStatus(request_uid: string, user_id: number) {
    try {
      const cacheCurrentKey = CacheUtil.getCachePatterns(SORT_OBJECT_FUNC, request_uid, user_id);
      const currentState = await this.cache.get(cacheCurrentKey);

      if (currentState) {
        return {
          status: currentState,
        };
      }
      throw new Error();
    } catch (e) {
      throw new BadRequestSortObjectError({
        code: ErrorCode.INVALID_REQUEST_UID,
        message: SortObjectResponseMessage.INVALID_REQUEST_UID,
      });
    }
  }

  async deleteSortItems(data: DeleteCloudDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];

    const currentTime = getUtcMillisecond();
    const maxDb = await this
      .deletedItemService.findMaxUpdatedDate(user.id, DELETED_ITEM_TYPE.VTODO);
    const maxUpdatedTime = Math.max(currentTime, Number(maxDb) * 1000);
    const timeLastModify = [];
    await Promise.all(data.map(async (item, index) => {
      try {
        const itemRecent = await this.sortObjectRepository.findOne({
          where: { id: item.id, user_id: user.id }
        });
        const updatedDate = getUpdateTimeByIndex(maxUpdatedTime, index);
        if (!itemRecent) {
          const errItem = buildFailItemResponse(ErrorCode.SORT_ORDER_ITEM_NOT_FOUND,
            MSG_FIND_NOT_FOUND, item);
          itemFail.push(errItem);
        } else {
          const isInsertDeletedItem = await this.deletedItemService.create(user.id, {
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.VTODO,
            is_recovery: 0,
            created_date: updatedDate,
            updated_date: updatedDate
          });
          if (!isInsertDeletedItem) { // push item into itemFail if false
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
            itemFail.push(errItem);
          } else { // remove item in cloud table
            await this.sortObjectRepository.delete({ id: itemRecent.id, user_id: user.id });
            itemPass.push({ id: itemRecent.id });
            timeLastModify.push(updatedDate);
          }
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        this.logger.logError(error);
        itemFail.push(errItem);
      }
    }));

    if (itemPass.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.TODO,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return { itemPass, itemFail };
  }

  async getTodoOrders(filter: GetSortObjectTodoDto, { user, headers }: IReq) {
    try {
      const { modified_gte, modified_lt, ids, has_del, page_size } = filter;
      const collections: SortObject[] = await this.databaseUtilitiesService.findTodoObjectOrders(
        filter, user.id, this.sortObjectRepository);

      if (collections.length > 0) {
        collections.map(item => {
          item['uid'] = item['object_uid'];
          delete item['object_uid'];
        });
      }
      let deletedItems;
      if (has_del && has_del === 1) {
        deletedItems = await this.deletedItemService.findAll(user.id, DELETED_ITEM_TYPE.VTODO, {
          modified_gte,
          modified_lt,
          page_size,
          ids
        }, DELETED_ITEM_RECOVER_TYPE.NOT_RECOVERD);
      }
      return {
        data: collections,
        data_del: deletedItems
      };
    } catch (error) {
      throw error;
    }
  }

  async getResetOrderStatus(user_id: number, obj_type: string, request_uid: string) {
    const key = CacheUtil.getCacheOrderKey(user_id, obj_type, request_uid);
    const rs: IResetOrderStatus = await this.cache.get(key);
    if (!rs) {
      throw new BadRequestException(
        buildSingleResponseErr(ErrorCode.INVALID_REQUEST_UID,
          SortObjectResponseMessage.INVALID_REQUEST_UID));
    }
    return {
      status: rs.status,
      // completed_percent: (rs.completed_item === 0 || !rs.completed_item)
      //   ? 0 : Math.round((rs.completed_item / rs.total_item) * 100),
    };
  }

  public async isResetOrderRunning(user_id: number, obj_type: string): Promise<boolean> {
    const rs = await this.cache.store.keys(`*${MAIN_KEY_CACHE}:order:${user_id}:${obj_type}*`);
    if (rs.length === 0) {
      return false;
    }
    for (const item of rs) {
      const key: IResetOrderStatus = await this.cache.get(item);
      if (key &&
        (key.status === SORT_OBJECTS_STATE.IN_PROCESS.toString()
          || key.status === SORT_OBJECTS_STATE.INIT.toString())) {
        return true;
      }
    }
  }

  async resetOrder(user_id: number, obj_type: string,
    data_input: any[] = []) {
    const isRunning = await this.isResetOrderRunning(user_id, obj_type);
    if (isRunning) {
      throw new BadRequestException(
        buildSingleResponseErr(ErrorCode.BAD_REQUEST,
          SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS));
    }
    const reqUid = uuidv4();
    await this.cache.set(CacheUtil.getCacheOrderKey(user_id, obj_type, reqUid),
      { status: SORT_OBJECTS_STATE.INIT, completed_item: 0, total_item: 0 } as IResetOrderStatus
      , { ttl: RESET_ORDER_TTL });

    await this.sortObjectQueueService.addResetOrderJob(RESET_ORDER_QUEUE, {
      user_id,
      obj_type,
      request_uid: reqUid,
      data_input
    });
    return {
      data: {
        request_uid: reqUid,
      },
    };
  }

  async sendQueueToWorker(request_uid: string, user: IUser, itemPass: any[], object_type: string) {
    const cacheCurrentKey = CacheUtil
      .getCachePatterns(SORT_OBJECT_FUNC, request_uid, user.userId);

    await this.cache
      .set(cacheCurrentKey, SORT_OBJECTS_STATE.INIT, { ttl: SORT_OBJECT_TTL });
    // ---------------- ### -------------------
    const queueMsg: object = {
      request_uid,
      email: user.email,
      objects: itemPass,
      object_type
    };

    this.sortObjectQueueService.addSortObjectJob(
      SORT_OBJECT_QUEUE,
      queueMsg);
  }

  async setCloudObjectOrder(cloudObjectOrder: IObjectOrder,
    user: IUser, request_uid: string) {
    try {
      const { userId, email } = user;
      const itemPass = [];
      const itemFail = [];
      const { data, object_type } = cloudObjectOrder;
      const isRunning = await this.isResetOrderRunning(userId, object_type);
      const results = [];
      if (isRunning) {
        return {
          data: results,
          errors: data.map((i) => {
            return buildFailItemResponse(ErrorCode.BAD_REQUEST,
              SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS, i);
          }),
        };
      }

      const { dataPassed, dataError } = removeDuplicateItems(data);
      if (dataError.length > 0) {
        dataError.map(item => {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }

      if (dataPassed.length > 0) {
        await Promise.all(dataPassed.map(async (item) => {
          const checkCloudExisted = await this.cloudRepository.findOne({
            select: ['id'],
            where: {
              user_id: userId,
              id: item.id
            }
          });
          if (!checkCloudExisted) {
            const errItem = buildFailItemResponse(ErrorCode.CLOUD_NOT_FOUND,
              MSG_FIND_NOT_FOUND, item);
            return itemFail.push(errItem);
          }

          const checkDeleteItemExisted = await this.deletedItemService
            .findOneByItemId(userId, item.id, object_type);
          if (checkDeleteItemExisted) {
            const errItem = buildFailItemResponse(
              ErrorCode.SORT_OBJECT_IS_IN_DELETED_ITEM_COLLECTION,
              MSG_ITEM_IS_IN_DELETED_ITEM_COLLECTION, item);
            return itemFail.push(errItem);
          }
          itemPass.push(item);
        }));
        if (itemPass.length > 0) {
          // Create uid for sort
          await this.sendQueueToWorker(request_uid, user, itemPass, object_type);
        }
      }
      return { itemPass, itemFail };
    } catch (error) {
      throw error;
    }
  }

  async setKanbanObjectOrder(kanbanObjectOrder: IObjectOrder,
    user: IUser, request_uid: string) {
    try {
      const { userId } = user;
      let itemPass = [];
      let itemFail = [];
      const { data, object_type } = kanbanObjectOrder;
      const isRunning = await this.isResetOrderRunning(userId, object_type);
      const results = [];
      if (isRunning) {
        return {
          data: results,
          errors: data.map((i) => {
            return buildFailItemResponse(ErrorCode.BAD_REQUEST,
              SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS, i);
          }),
        };
      }

      const { dataPassed, dataError } = removeDuplicateItems(data);
      if (dataError.length > 0) {
        dataError.map(item => {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }

      if (dataPassed.length > 0) {
        // check kanban is existed
        const kanbanItems = await this.kanbanRepository.find({
          select: ['id', 'collection_id'],
          where: {
            id: In(dataPassed.map((item) => {
              return item.id;
            })),
            user_id: userId,
            is_trashed: IS_TRASHED.NOT_TRASHED,
          },
        });

        if (kanbanItems.length === 0) {
          dataPassed.map(item => {
            const errItem = buildFailItemResponse(ErrorCode.SORT_OBJECT_NOT_FOUND,
              MSG_FIND_NOT_FOUND, item);
            itemFail.push(errItem);
          });
        } else {
          // fliter id existed
          const { itemExisted, itemNoExisted } = filterIdExisted(kanbanItems, dataPassed, 'collection_id');

          if (itemNoExisted.length > 0) itemFail = [...itemFail, ...itemNoExisted];
          if (itemExisted.length > 0) itemPass = [...itemPass, ...itemExisted];
          // Create uid for sort
          await this.sendQueueToWorker(request_uid, user, itemPass, object_type);
        }
      }
      return { itemPass, itemFail };
    } catch (error) {
      throw error;
    }
  }

  async setKanbanCardObjectOrder(kanbanObjectOrder: IObjectOrder,
    user: IUser, request_uid: string) {
    try {
      const { userId, email } = user;
      let itemPass = [];
      let itemFail = [];
      const { data, object_type } = kanbanObjectOrder;
      const isRunning = await this.isResetOrderRunning(userId, object_type);
      const results = [];
      if (isRunning) {
        return {
          data: results,
          errors: data.map((i) => {
            return buildFailItemResponse(ErrorCode.BAD_REQUEST,
              SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS, i);
          }),
        };
      }

      const { dataPassed, dataError } = removeDuplicateItems(data);
      if (dataError.length > 0) {
        dataError.map(item => {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }

      if (dataPassed.length > 0) {
        // check kanban card is existed
        const kanbanCardItems = await this.kanbanCardRepository.find({
          select: ['id', 'kanban_id'],
          where: {
            id: In(dataPassed.map((item) => {
              return item.id;
            })),
            user_id: userId,
            is_trashed: IS_TRASHED.NOT_TRASHED,
          },
        });

        if (kanbanCardItems.length === 0) {
          dataPassed.map(item => {
            const errItem = buildFailItemResponse(ErrorCode.SORT_OBJECT_NOT_FOUND,
              MSG_FIND_NOT_FOUND, item);
            itemFail.push(errItem);
          });
        } else {
          // fliter id existed
          const { itemExisted, itemNoExisted } = filterIdExisted(kanbanCardItems, dataPassed, 'kanban_id');
          if (itemNoExisted.length > 0) itemFail = [...itemFail, ...itemNoExisted];
          if (itemExisted.length > 0) itemPass = [...itemPass, ...itemExisted];
          // Create uid for sort
          await this.sendQueueToWorker(request_uid, user, itemPass, object_type);
        }
      }
      return { itemPass, itemFail };
    } catch (error) {
      throw error;
    }
  }

  async setTodoObjectOrder(todoObjectOrder: ITodoObjectOrder,
    user: IUser, request_uid: string) {
    try {
      const { userId } = user;
      let itemPass = [];
      const itemFail = [];
      const { data, object_type } = todoObjectOrder;
      const isRunning = await this.isResetOrderRunning(userId, object_type);
      const results = [];
      if (isRunning) {
        return {
          data: results,
          errors: data.map((i) => {
            return buildFailItemResponse(ErrorCode.BAD_REQUEST,
              SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS, i);
          }),
        };
      }

      const { dataPassed, dataError } = removeDuplicateItems(data, false);
      if (dataError.length > 0) {
        dataError.map(item => {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }

      if (dataPassed.length > 0) {
        itemPass = [...itemPass, ...dataPassed];
        await this.sendQueueToWorker(request_uid, user, dataPassed, object_type);
      }
      return { itemPass, itemFail };
    } catch (error) {
      throw error;
    }
  }

  async setUrlObjectOrder(urlObjectOrder: IObjectOrder,
    user: IUser, request_uid: string) {
    try {
      const { userId } = user;
      const itemPass = [];
      const itemFail = [];
      const { data, object_type } = urlObjectOrder;
      const isRunning = await this.isResetOrderRunning(userId, object_type);
      const results = [];
      if (isRunning) {
        return {
          data: results,
          errors: data.map((i) => {
            return buildFailItemResponse(ErrorCode.BAD_REQUEST,
              SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS, i);
          }),
        };
      }

      const { dataPassed, dataError } = removeDuplicateItems(data);
      if (dataError.length > 0) {
        dataError.map(item => {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }

      if (dataPassed.length > 0) {
        await Promise.all(dataPassed.map(async (item) => {
          const checkurlExisted = await this.urlRepository.findOne({
            select: ['id'],
            where: {
              user_id: userId,
              id: item.id,
              is_trashed: IS_TRASHED.NOT_TRASHED,
            }
          });
          if (!checkurlExisted) {
            const errItem = buildFailItemResponse(ErrorCode.URL_NOT_FOUND,
              MSG_FIND_NOT_FOUND, item);
            return itemFail.push(errItem);
          }

          const checkDeleteItemExisted = await this.deletedItemService
            .findOneByItemId(userId, item.id, object_type);
          if (checkDeleteItemExisted) {
            const errItem = buildFailItemResponse(
              ErrorCode.SORT_OBJECT_IS_IN_DELETED_ITEM_COLLECTION,
              MSG_ITEM_IS_IN_DELETED_ITEM_COLLECTION, item);
            return itemFail.push(errItem);
          }
          itemPass.push(item);
        }));
        if (itemPass.length > 0) {
          // Create uid for sort
          await this.sendQueueToWorker(request_uid, user, itemPass, object_type);
        }
      }
      return { itemPass, itemFail };
    } catch (error) {
      throw error;
    }
  }
}