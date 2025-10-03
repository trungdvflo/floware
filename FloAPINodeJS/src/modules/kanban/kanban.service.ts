import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, In, QueryFailedError, Repository } from 'typeorm';
import {
  ApiLastModifiedName,
  DELETED_ITEM_TYPE,
  IS_TRASHED,
  SHARE_STATUS
} from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_ERR_DUPLICATE_ENTRY } from '../../common/constants/message.constant';
import { GetAllFilter4Collection } from '../../common/dtos/get-all-filter';
import { Collection } from '../../common/entities/collection.entity';
import { Kanban } from '../../common/entities/kanban.entity';
import { ShareMember } from '../../common/entities/share-member.entity';
import { IReq } from '../../common/interfaces';
import {
  filterDuplicateItemsWithKey,
  generateOutOfOrderRangeFailItem, generatePlusOrderNum, getMaxTableKanban
} from '../../common/utils/common';
import { STEP_MODIFY, getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { KanbanQueueService } from '../bullmq-queue/kanban-queue.service';
import { CollectionService } from '../collection/collection.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { SORT_OBJECT } from '../sort-object/sort-object.constant';
import { SortObjectService } from '../sort-object/sort-object.service';
import { KanbanWithRef } from './dto/create-kanban.response';
import {
  DeleteKanbanParam,
  KanbanParam,
  KanbanParamWithOrderNumber,
  KanbanType,
  UpdateKanbanParam
} from './dto/kanban-param';
import {
  DeleteKanbanParamError,
  KanbanParamError, UpdateKanbanParamError
} from './dto/kanban-request-param-error';
import { KanbanErrorCode, KanbanErrorDics } from './kanban-response-message';

export interface KanbanServiceOptions {
  fields: (keyof Kanban)[];
}

@Injectable()
export class KanbanService {
  constructor(
    @InjectRepository(Kanban)
    private readonly kanban: Repository<Kanban>,
    @InjectRepository(ShareMember)
    private readonly shareMemberRepo: Repository<ShareMember>,
    private readonly deletedItem: DeletedItemService,
    private readonly collection: CollectionService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly kanbanQueueService: KanbanQueueService,
    private readonly sortObjectService: SortObjectService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
  ) {
  }

  async findAndSelectByIds(userId: number, data: any[]) {
    return await this.kanban.find({
      select: ['id', 'collection_id'],
      where: {
        id: In(data.map((item) => {
          return item.kanban_id;
        })),
        user_id: userId,
        is_trashed: IS_TRASHED.NOT_TRASHED,
      },
    });
  }

  // this method retrieves entries by entry ID
  findByIds(userId: number, ids: number[]) {
    return this.kanban.find({
      where: {
        id: In(ids),
        user_id: userId,
      }
    });
  }

  // this method retrieves all entries
  async findAll(userId: number, filter?: GetAllFilter4Collection<Kanban>) {
    const { modified_gte, modified_lt, has_del, page_size, collection_id } = filter;
    filter.remove_deleted = true;
    const kanbans: Kanban[] = await this.databaseUtilitiesService.getAll({
      userId,
      filter,
      repository: this.kanban,
    }, collection_id);

    let deletedItems;
    if (has_del) {
      deletedItems = await this.deletedItem.findAll(userId, DELETED_ITEM_TYPE.KANBAN, {
        modified_gte,
        modified_lt,
        page_size,
      });
    }

    return {
      deletedItems,
      kanbans,
    };
  }

  // this method retrieves only one entry, by entry ID
  findOneById(userId: number, id: number, options?: KanbanServiceOptions) {
    return this.kanban.findOne({
      select: options && options.fields,
      where: {
        id,
        user_id: userId,
      },
    });
  }

  // this method saves an entry in the database
  async create(
    userId: number,
    kanbanParam: KanbanParam,
    collection: Collection,
    dateItem: number
  ): Promise<Kanban> {
    if (!collection) {
      throw new KanbanParamError({
        ...KanbanErrorDics.COLLECTION_NOT_FOUND,
        attributes: {
          collection_id: kanbanParam.collection_id,
          ref: kanbanParam.ref,
        },
      });
    }
    const kanbanEntity: any = this.kanban.create({
      user_id: userId,
      ...kanbanParam,
      kanban_type: KanbanType.NORMAL,
      created_date: dateItem,
      updated_date: dateItem,
      order_update_time: SORT_OBJECT.ORDER_UPDATE_TIME_INIT
    });
    return await this.kanban.save(kanbanEntity);
  }

  private async createBatchKanbanItem(
    kanbanParam: KanbanParamWithOrderNumber,
    userId: number,
    collections: Collection[],
    createdKanbans: KanbanWithRef[],
    errors: KanbanParamError[],
    dateItem: number
  ) {
    try {
      if (kanbanParam.order_number > SORT_OBJECT.MAX_ORDER_NUMBER) {
        delete kanbanParam.order_number;
        errors.push(generateOutOfOrderRangeFailItem(kanbanParam));
        return;
      }

      const col = collections.find(e => {
        return e.id === kanbanParam.collection_id && e.is_trashed === IS_TRASHED.NOT_TRASHED;
      });

      const created: any = await this.create(userId, kanbanParam, col, dateItem);
      createdKanbans.push(new KanbanWithRef({
        ...created,
        user_id: undefined,
        ref: kanbanParam.ref,
      }));
    } catch (err) {
      if (err instanceof KanbanParamError) {
        errors.push(err);
      } else if (err instanceof QueryFailedError) {
        if (err['code'] === 'ER_DUP_ENTRY' && err.message
          .includes('uniq_on_user_id_and_updated_date')) {
          const col = collections.find(e => e.id === kanbanParam.collection_id);
          const created: any = await this.create(userId, kanbanParam, col, dateItem + STEP_MODIFY);
          return createdKanbans.push(new KanbanWithRef({
            ...created,
            user_id: undefined,
            ref: kanbanParam.ref,
          }));
        }
        if (err['code'] === 'ER_DUP_ENTRY') {
          errors.push(
            buildFailItemResponse(
              KanbanErrorDics.DUPLICATED_ENTRY.code,
              KanbanErrorDics.DUPLICATED_ENTRY.message,
              kanbanParam
            )
          );
        } else {
          errors.push(
            buildFailItemResponse(
              KanbanErrorCode.KANBAN_ENTITY_ERROR,
              err.message,
              kanbanParam,
            ),
          );
        }
      } else if (err instanceof EntityNotFoundError) {
        errors.push(
          buildFailItemResponse(
            KanbanErrorCode.KANBAN_ENTITY_ERROR,
            err.message,
            kanbanParam,
          ),
        );
      } else {
        throw err;
      }
    }
  }

  async createBatchKanbans(
    kanbanParams: KanbanParam[],
    is_member: number,
    { user, headers }: IReq
  ): Promise<{
    created: KanbanWithRef[];
    errors: KanbanParamError[];
  }> {
    const errors: KanbanParamError[] = [];
    const createdKanbans: KanbanWithRef[] = [];

    let collectionsIds: number[] = kanbanParams.map(e => e.collection_id);
    collectionsIds = [...new Set(collectionsIds)];
    let collections = [];
    if (!is_member) {
      collections = await this.collection.findByIds(user.id, collectionsIds);
    } else if (collectionsIds.length > 0) {
      // START: check and create kanban for member
      collections = await this.shareMemberRepo
        .createQueryBuilder('csm')
        .innerJoin(Collection, 'c', `c.id = csm.collection_id`)
        .select('collection_id as id, member_user_id as user_id, shared_status, is_trashed')
        .where('csm.member_user_id = :userId', { userId: user.id })
        .andWhere('csm.collection_id IN (:...collectionsIds)', { collectionsIds })
        .andWhere('c.is_trashed = :isTrashed', { isTrashed: IS_TRASHED.NOT_TRASHED })
        .andWhere('csm.shared_status = :shared_status', { shared_status: SHARE_STATUS.JOINED })
        .getRawMany();
      // END: check and create kanban for member
    }

    let items = [];
    await Promise.all(collectionsIds.map(async (id) => {
      const kanbans: any[] = kanbanParams.
        filter(element => element.collection_id === id);
      if (!collections.find(i => i.id === id)) {
        items = [...items, ...kanbans];
        return;
      }
      const maxNumber = await getMaxTableKanban(this.kanban, 'order_number', user.id, id);
      for (const [index, value] of kanbans.entries()) {
        const getMinByIndex: number = Number(generatePlusOrderNum(maxNumber, index));
        value.order_number = getMinByIndex;
        items.push(value);
      }
    }));

    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    await Promise.all(items.map((kanbanParam, idx) => {
      const dateItem = getUpdateTimeByIndex(currentTime, idx);
      timeLastModify.push(dateItem);
      return this.createBatchKanbanItem(
        kanbanParam,
        user.id,
        collections,
        createdKanbans,
        errors,
        dateItem
      );
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      await this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.KANBAN,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return {
      created: createdKanbans.filter(Boolean),
      errors,
    };
  }

  async updateWithReturn(userId: number, kanbanParam: UpdateKanbanParam, dateItem: number)
    : Promise<Kanban> {
    if (kanbanParam.id && Object.keys(kanbanParam).length === 1)
      throw new UpdateKanbanParamError({
        ...KanbanErrorDics.NOTHING_TO_UPDATE,
        attributes: {
          id: kanbanParam.id,
        },
      });

    const kanban = await this.kanban.findOne({
      where: {
        user_id: userId,
        id: kanbanParam.id,
      },
    });

    if (!kanban) {
      throw new UpdateKanbanParamError({
        ...KanbanErrorDics.KANBAN_NOT_FOUND,
        attributes: {
          id: kanbanParam.id,
        },
      });
    }

    const collection = await this.collection.findOneWithCondition({
      fields: ['id'],
      conditions: {
        id: kanban.collection_id,
        is_trashed: IS_TRASHED.NOT_TRASHED
      }
    });
    if (!collection) {
      throw new UpdateKanbanParamError({
        ...KanbanErrorDics.KANBAN_NOT_FOUND,
        attributes: {
          id: kanbanParam.id,
        },
      });
    }

    if (kanban.kanban_type === KanbanType.SYSTEM) {
      delete (kanbanParam as any).name;
      delete (kanbanParam as any).color;
      delete (kanbanParam as any).kanban_type;
      // if (Object.keys(kanbanParam).length === 1 && kanbanParam.id) {
      //   throw new UpdateKanbanParamError({
      //     ...KanbanErrorDics.NOTHING_TO_UPDATE,
      //     attributes: {
      //       id: kanbanParam.id,
      //     },
      //   });
      // }
    }

    const kanbanEntity = this.kanban.create({
      ...kanbanParam,
      updated_date: dateItem
    });

    Object.assign(kanban, kanbanEntity);

    const updateResult = await this.kanban.update(kanban.id, kanbanEntity);

    if (updateResult.affected === 0)
      throw new UpdateKanbanParamError({
        ...KanbanErrorDics.KANBAN_NOT_FOUND,
        attributes: {
          id: kanbanParam.id,
        },
      });
    return kanban;
  }

  async updateBatchKanbansWithReturn(
    kanbanParams: UpdateKanbanParam[], { user, headers }: IReq
  ): Promise<{
    updated: Kanban[];
    errors: UpdateKanbanParamError[];
  }> {
    const errors: UpdateKanbanParamError[] = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    const updatedCols: Kanban[] = (
      await Promise.all(
        kanbanParams.map(async (kanbanParam, idx) => {
          try {
            const updatedDate = getUpdateTimeByIndex(currentTime, idx);
            timeLastModify.push(updatedDate);
            const updatedCol = await this.updateWithReturn(user.id, kanbanParam, updatedDate);
            return updatedCol;
          } catch (err) {
            if (err instanceof UpdateKanbanParamError) {
              errors.push(err);
              return;
            }
            if (err instanceof QueryFailedError) {
              errors.push(
                buildFailItemResponse(
                  KanbanErrorCode.KANBAN_ENTITY_ERROR,
                  err.message,
                  kanbanParam,
                ),
              );
              return;
            }
            if (err instanceof EntityNotFoundError) {
              errors.push(
                buildFailItemResponse(
                  KanbanErrorCode.KANBAN_ENTITY_ERROR,
                  err.message,
                  kanbanParam,
                ),
              );
              return;
            }
            throw err;
          }
        }),
      )
    ).filter(Boolean);

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      await this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.KANBAN,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return {
      updated: updatedCols,
      errors,
    };
  }

  async delete(userId: number, kanbanParam: DeleteKanbanParam) {
    const kanban = await this.kanban.findOne({
      select: ['id', 'is_trashed', 'kanban_type'],
      where: {
        user_id: userId,
        id: kanbanParam.id || -1,
      },
    });
    if (!kanban) {
      throw new DeleteKanbanParamError({
        ...KanbanErrorDics.KANBAN_NOT_FOUND,
        attributes: {
          id: kanbanParam.id,
        },
      });
    }
    if (kanban.kanban_type === KanbanType.SYSTEM) {
      throw new DeleteKanbanParamError({
        ...KanbanErrorDics.DELETE_SYSTEM_KANBAN,
        attributes: {
          id: kanbanParam.id,
        },
      });
    }
    if (kanban.is_trashed === IS_TRASHED.DELETED) {
      throw new DeleteKanbanParamError({
        ...KanbanErrorDics.KANBAN_NOT_FOUND,
        attributes: {
          id: kanbanParam.id,
        },
      });
    }
    await this.kanban.update(kanban.id, {
      is_trashed: IS_TRASHED.DELETED,
    });
  }
  async batchDelete(userId: number, kanbanParams: DeleteKanbanParam[]) {
    const errors: DeleteKanbanParamError[] = [];
    const { dataPassed, dataError } = filterDuplicateItemsWithKey(kanbanParams, ['id']);
    if (dataError.length > 0) {
      dataError.map(item => {
        const errItem = buildFailItemResponse(
          ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        errors.push(errItem);
      });
    }
    const deleted = (
      await Promise.all(
        dataPassed.map(async (k) => {
          try {
            await this.delete(userId, k);
            return k;
          } catch (err) {
            if (err instanceof DeleteKanbanParamError) {
              errors.push(err);
              return;
            } else if (err instanceof QueryFailedError || err instanceof EntityNotFoundError) {
              errors.push(
                new DeleteKanbanParamError({
                  code: KanbanErrorCode.KANBAN_ENTITY_ERROR,
                  message: err.message,
                  attributes: k,
                }),
              );
              return;
            }
            throw err;
          }
        }),
      )
    ).filter(Boolean);

    if (deleted.length > 0) {
      const kbIds = deleted.map(k => k.id);
      await this.kanbanQueueService.deleteKanban(userId, kbIds);
    }

    return {
      deleted,
      errors,
    };
  }

  async deleteByColIdsAndUserId(colIds: number[], user_id: number) {
    if (colIds.length === 0) return;
    const kanbans = await this.kanban.find({
      where: {
        collection_id: In(colIds),
        user_id
      }
    });
    if (kanbans.length === 0) return;
    const kbIds = kanbans.map(k => k.id);
    await this.kanban.update({
      id: In(kbIds)
    }, {
      is_trashed: IS_TRASHED.DELETED,
    });
    this.kanbanQueueService.deleteKanban(user_id, kbIds);
  }
}
