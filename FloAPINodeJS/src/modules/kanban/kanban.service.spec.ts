import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { datatype, helpers } from 'faker';
import { EntityNotFoundError, QueryFailedError, Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../test';
import { DELETED_ITEM_TYPE, IS_TRASHED } from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_ORDER_NUMBER_OUT_OF_RANGE } from '../../common/constants/message.constant';
import { GetAllFilter4Collection } from '../../common/dtos/get-all-filter';
import { DeletedItem } from '../../common/entities/deleted-item.entity';
import { Kanban } from '../../common/entities/kanban.entity';
import { ShareMember } from '../../common/entities/share-member.entity';
import * as CommonUtil from '../../common/utils/common';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { KanbanQueueService } from '../bullmq-queue/kanban-queue.service';
import { CollectionService } from '../collection/collection.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { SORT_OBJECT } from '../sort-object/sort-object.constant';
import { SortObjectService } from '../sort-object/sort-object.service';
import {
  DeleteKanbanParam,
  KanbanParam, KanbanType, UpdateKanbanParam
} from './dto/kanban-param';
import { DeleteKanbanParamError, KanbanParamError, UpdateKanbanParamError } from './dto/kanban-request-param-error';
import { KanbanErrorCode, KanbanErrorDics } from './kanban-response-message';
import { KanbanService } from './kanban.service';

const createSampleKanbanParam = (): KanbanParam => {
  return Object.assign(new KanbanParam(), {
    name: datatype.string(),
    color: helpers.randomize(),
    collection_id: datatype.number({ min: 0 }),
    archive_status: helpers.randomize([0, 1]),
    show_done_todo: helpers.randomize([0, 1]),
    add_new_obj_type: helpers.randomize([0, 1, 2, 3]),
    sort_by_type: helpers.randomize([0, 1]),
  });
};

const createSampleUpdateKanbanParam = (): UpdateKanbanParam => {
  return Object.assign(new UpdateKanbanParam(), {
    id: datatype.number({ min: 1 }),
    name: datatype.string(),
    color: helpers.randomize(),
    archive_status: helpers.randomize([0, 1]),
    show_done_todo: helpers.randomize([0, 1]),
    add_new_obj_type: helpers.randomize([0, 1, 2, 3]),
    sort_by_type: helpers.randomize([0, 1]),
  });
};

const createSampleKanbanEntity = (option?: {
  param?: Partial<KanbanParam> | Partial<UpdateKanbanParam>,
  type?: KanbanType
}): Partial<Kanban> => {
  let id;
  let collection_id;
  if (option?.param && option?.param instanceof UpdateKanbanParam) {
    id = option?.param.id;
  }
  if (option?.param && option?.param instanceof KanbanParam) {
    collection_id = option?.param.collection_id;
  }
  return {
    id: id || datatype.number({ min: 1 }),
    name: option?.param?.name || datatype.string(),
    color: option?.param?.color || helpers.randomize(),
    collection_id: collection_id || datatype.number({ min: 0 }),
    created_date: datatype.float({ min: 0, precision: 3 }),
    updated_date: datatype.float({ min: 0, precision: 3 }),
    order_number: datatype.float(),
    order_update_time: datatype.float({ min: 0, precision: 3 }),
    archive_status: option?.param?.archive_status || helpers.randomize([0, 1]),
    show_done_todo: option?.param?.show_done_todo || helpers.randomize([0, 1]),
    add_new_obj_type: option?.param?.add_new_obj_type || helpers.randomize([0, 1, 2, 3]),
    sort_by_type: option?.param?.sort_by_type || helpers.randomize([0, 1]),
    archived_time: datatype.float({ min: 0, precision: 3 }),
    kanban_type: option?.type || 0,
  };
};

const createSampleDeleteKanbanParam = (): DeleteKanbanParam => {
  return {
    id: datatype.number({ min: 1 })
  };
};

const createSampleUserId = () => datatype.number({ min: 1 });
const createSampleMaxOrderNumber = () => datatype.float();
const sortObjectServiceMockFactory: (
) => MockType<SortObjectService> = jest.fn(() => ({
  isResetOrderRunning: jest.fn()
}));

export class TestUtilsService {
  static createSpyObj(baseName: string[], methodNames: string[]): SpyObject {
    let obj: any = {};
    for (const methodName of methodNames) {
      obj[methodName] = jest.fn();
    }
    let res = {}
    for (const b of baseName) {
      res[b] = () => obj
    }
    return res;
  };
}
export class SpyObject {
  [key: string]: () => { [key: string]: jest.Mock };
}
jest.mock('@nestjs/axios', () => ({
  HttpModule: jest.fn(),
  HttpService: jest.fn(),
}));
const spyHttpClient: SpyObject = TestUtilsService.createSpyObj(['delete', 'put'], ['toPromise']);

// @ts-ignore
const repositoryMockFactory: () => MockType<Repository<Kanban>> = jest.fn(() => ({
  find: jest.fn(entity => entity),
  save: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  remove: jest.fn(entity => entity),
  findAll: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  findOne: jest.fn(entity => entity),
}));

const createQueryBuilder = {
  innerJoin: jest.fn(entity => createQueryBuilder),
  select: jest.fn(() => createQueryBuilder),
  addSelect: jest.fn(() => createQueryBuilder),
  where: jest.fn(() => createQueryBuilder),
  andWhere: jest.fn(() => createQueryBuilder),
  getRawMany: jest.fn(() => []),
};
const repositoryShareMemberMockFactory: () => MockType<Repository<ShareMember>> = jest.fn(() => ({
  createQueryBuilder: jest.fn(entity => createQueryBuilder),
  innerJoin: jest.fn(entity => this),
  select: jest.fn(entity => this),
  where: jest.fn(entity => this),
  andWhere: jest.fn(entity => this),
  getMany: jest.fn(entity => entity),
}));

const deletedItemServiceMockFactory: () => MockType<DeletedItemService> = jest.fn(() => ({
  findAll: jest.fn((e) => e),
  batchCreate: jest.fn((e) => e),
}));

const kanbanQueueServiceMockFactory: () => MockType<KanbanQueueService> = jest.fn(() => ({
  deleteKanban: jest.fn((e) => e),
}));

const apiLastModifiedQueueServiceMockFactory:
  () => MockType<ApiLastModifiedQueueService> = jest.fn(() => ({
    addJob: jest.fn((e) => e),
  }));

describe('KanbanService', () => {
  let app: INestApplication;
  let kanbanRepository: MockType<Repository<Kanban>>;
  let kanbanService: KanbanService;
  let databaseService: DatabaseUtilitiesService;
  let deletedItemService: MockType<DeletedItemService>;
  let collectionService: CollectionService;
  let kanbanQueueService: MockType<KanbanQueueService>;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;
  let sortObjectService: SortObjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KanbanService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(Kanban),
          useFactory: repositoryMockFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(ShareMember),
          useFactory: repositoryShareMemberMockFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: DeletedItemService,
          useFactory: deletedItemServiceMockFactory
        },
        {
          provide: SortObjectService,
          useFactory: sortObjectServiceMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: DatabaseUtilitiesService,
          useValue: {
            getAll: jest.fn((e) => e),
          },
        },
        {
          provide: CollectionService,
          useValue: {
            findOneById: jest.fn((e) => e),
            findByIds: jest.fn((e) => e),
            findOneWithCondition: jest.fn((e) => e)
          }
        },
        {
          provide: KanbanQueueService,
          useFactory: kanbanQueueServiceMockFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedQueueServiceMockFactory
        },
        {
          provide: HttpService,
          useValue: spyHttpClient
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    kanbanRepository = module.get(getRepositoryToken(Kanban));
    kanbanService = module.get<KanbanService>(KanbanService);
    databaseService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    deletedItemService = module.get(DeletedItemService);
    collectionService = module.get<CollectionService>(CollectionService);
    kanbanQueueService = module.get(KanbanQueueService);
    sortObjectService = module.get(SortObjectService);
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
  });

  it('should be defined', () => {
    expect(kanbanService).toBeDefined();
  });

  it('should be findByIds', () => {
    kanbanService.findByIds(1, [1, 2]);
    expect(kanbanRepository.find).toBeCalledTimes(1);
  });

  it('should return empty array', async () => {
    databaseService.getAll = jest.fn().mockResolvedValue([]);
    deletedItemService.findAll = jest.fn().mockResolvedValue([]);
    const userId = createSampleUserId();

    const result = await kanbanService.findAll(userId, {
      modified_gte: 1,
      has_del: 1,
      page_size: 1
    });
    expect(databaseService.getAll).toBeCalledTimes(1);
    expect(result.kanbans).not.toBeNull();
    expect(result.deletedItems).not.toBeNull();
    expect(result.kanbans).toHaveLength(0);
    expect(result.deletedItems).toHaveLength(0);
  });

  it('should return kanban array', async () => {
    const entities: Partial<Kanban>[] = [
      createSampleKanbanEntity(),
      createSampleKanbanEntity(),
    ];
    const userId = createSampleUserId();
    databaseService.getAll = jest.fn().mockResolvedValue(entities);

    const result = await kanbanService.findAll(userId, {
      page_size: 2
    });
    expect(result.kanbans).not.toBeNull();
    expect(result.deletedItems).toBeUndefined();
    expect(result.kanbans).toHaveLength(2);
    result.kanbans.forEach((k, idx) => {
      expect(k.id).toEqual(entities[idx].id);
      expect(k.name).toEqual(entities[idx].name);
      expect(k.color).toEqual(entities[idx].color);
      expect(k.collection_id).toEqual(entities[idx].collection_id);
      expect(k.created_date).toEqual(entities[idx].created_date);
      expect(k.updated_date).toEqual(entities[idx].updated_date);
      expect(k.order_number).toEqual(entities[idx].order_number);
      expect(k.order_update_time).toEqual(entities[idx].order_update_time);
      expect(k.archive_status).toEqual(entities[idx].archive_status);
      expect(k.show_done_todo).toEqual(entities[idx].show_done_todo);
      expect(k.add_new_obj_type).toEqual(entities[idx].add_new_obj_type);
      expect(k.sort_by_type).toEqual(entities[idx].sort_by_type);
      expect(k.archived_time).toEqual(entities[idx].archived_time);
      expect(k.kanban_type).toEqual(entities[idx].kanban_type);
    });
  });

  it('should return kanban array with data_del', async () => {
    const entities: Partial<Kanban>[] = [
      createSampleKanbanEntity(), createSampleKanbanEntity()
    ];
    const filter: GetAllFilter4Collection<Kanban> = {
      page_size: 2,
      has_del: 1,
      modified_gte: 1621327600.089,
      modified_lt: 1621337600.089,
      ids: [1, 2],
      fields: ['name', 'color'],
    };
    const deletedItemEntities: Partial<DeletedItem>[] = [{
      item_id: 1,
      is_recovery: 0,
    }, {
      item_id: 2,
      is_recovery: 0,
    }];
    const userId = createSampleUserId();

    databaseService.getAll = jest.fn().mockResolvedValue(entities);
    deletedItemService.findAll = jest.fn().mockResolvedValue(deletedItemEntities);

    const { kanbans, deletedItems } = await kanbanService.findAll(userId, filter);
    expect(databaseService.getAll).toBeCalledTimes(1);
    expect(databaseService.getAll).toHaveBeenCalledWith({
      userId,
      filter: {
        ...filter,
        remove_deleted: true
      },
      repository: kanbanRepository
    }, filter.collection_id);
    expect(deletedItemService.findAll).toBeCalledTimes(1);
    expect(deletedItemService.findAll).toHaveBeenCalledWith(userId, DELETED_ITEM_TYPE.KANBAN, {
      modified_gte: filter.modified_gte,
      modified_lt: filter.modified_lt,
      page_size: filter.page_size
    });
    expect(deletedItems).toHaveLength(2);
    expect(kanbans).toHaveLength(2);
    kanbans.forEach((k, idx) => {
      expect(k.id).toEqual(entities[idx].id);
      expect(k.name).toEqual(entities[idx].name);
      expect(k.color).toEqual(entities[idx].color);
      expect(k.collection_id).toEqual(entities[idx].collection_id);
      expect(k.created_date).toEqual(entities[idx].created_date);
      expect(k.updated_date).toEqual(entities[idx].updated_date);
      expect(k.order_number).toEqual(entities[idx].order_number);
      expect(k.order_update_time).toEqual(entities[idx].order_update_time);
      expect(k.archive_status).toEqual(entities[idx].archive_status);
      expect(k.show_done_todo).toEqual(entities[idx].show_done_todo);
      expect(k.add_new_obj_type).toEqual(entities[idx].add_new_obj_type);
      expect(k.sort_by_type).toEqual(entities[idx].sort_by_type);
      expect(k.archived_time).toEqual(entities[idx].archived_time);
      expect(k.kanban_type).toEqual(entities[idx].kanban_type);
    });
    deletedItems.forEach((item, idx) => {
      expect(item.item_id).toEqual(deletedItemEntities[idx].item_id);
      expect(item.is_recovery).toEqual(deletedItemEntities[idx].is_recovery);
    });
  });

  it('should create kanban', async () => {
    const param = createSampleKanbanParam();
    const entity = createSampleKanbanEntity({ param });
    const userId = createSampleUserId();

    collectionService.findOneById = jest.fn().mockResolvedValue({
      id: datatype.number({ min: 1 })
    });
    kanbanRepository.save.mockReturnValue(entity);
    jest.spyOn(CommonUtil, 'getMinTable').mockResolvedValueOnce(0);

    const result = await kanbanService.create(userId, param, [{
      id: param.collection_id,
      is_trashed: IS_TRASHED.NOT_TRASHED
    }] as any, 0);

    expect(kanbanRepository.save).toBeCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result.id).toEqual(entity.id);
    expect(result.name).toEqual(entity.name);
    expect(result.color).toEqual(entity.color);
    expect(result.collection_id).toEqual(entity.collection_id);
    expect(result.archive_status).toEqual(entity.archive_status);
    expect(result.show_done_todo).toEqual(entity.show_done_todo);
    expect(result.add_new_obj_type).toEqual(entity.add_new_obj_type);
    expect(result.order_number).toEqual(entity.order_number);
    expect(result.order_update_time).toEqual(entity.order_update_time);
    expect(result.sort_by_type).toEqual(entity.sort_by_type);
    expect(result.archived_time).toEqual(entity.archived_time);
    expect(result.kanban_type).toEqual(entity.kanban_type);
    expect(result.created_date).toEqual(entity.created_date);
    expect(result.updated_date).toEqual(entity.updated_date);
  });

  it('should create kanban having collection not found error', async () => {
    const param = createSampleKanbanParam();
    const entity = createSampleKanbanEntity({ param });
    const maxOrderNumber = createSampleMaxOrderNumber();
    const error = new KanbanParamError({
      ...KanbanErrorDics.COLLECTION_NOT_FOUND,
      attributes: {
        collection_id: param.collection_id,
        ref: param.ref
      }
    });
    const userId = createSampleUserId();

    kanbanRepository.save.mockReturnValue(entity);

    try {
      await kanbanService.create(userId, param, null, 0);
    } catch (err) {
      expect(err).toBeInstanceOf(KanbanParamError);
      expect(err).toStrictEqual(error);
    }
    expect(kanbanRepository.save).toBeCalledTimes(0);
  });

  it('should batch create kanban', async () => {
    const params = [createSampleKanbanParam(), createSampleKanbanParam()];
    const entities = [createSampleKanbanEntity({ param: params[0] }),
    createSampleKanbanEntity({ param: params[1] })];
    const userId = createSampleUserId();
    sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
    kanbanService.create = jest.fn().mockResolvedValueOnce(entities[0])
      .mockResolvedValueOnce(entities[1]);
    collectionService.findByIds = jest.fn().mockResolvedValueOnce([
      { id: params[0].collection_id }, { id: params[1].collection_id }
    ])
    jest.spyOn(CommonUtil, 'getMaxTableKanban')
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);
    const { created, errors } = await kanbanService.createBatchKanbans(params, 0, fakeReq);
    expect(kanbanService.create).toBeCalledTimes(2);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    // expect(apiLastModifiedQueueService.addJob).toHaveBeenCalledWith({
    //   apiName: ApiLastModifiedName.KANBAN,
    //   userId,
    //   updatedDate: getCreatedDate()
    // });
    expect(created).toHaveLength(2);
    expect(errors).toHaveLength(0);
    created.forEach((item, idx) => {
      expect(item.id).toEqual(entities[idx].id);
      expect(item.name).toEqual(entities[idx].name);
      expect(item.color).toEqual(entities[idx].color);
      expect(item.collection_id).toEqual(entities[idx].collection_id);
      expect(item.archive_status).toEqual(entities[idx].archive_status);
      expect(item.show_done_todo).toEqual(entities[idx].show_done_todo);
      expect(item.add_new_obj_type).toEqual(entities[idx].add_new_obj_type);
      expect(item.order_number).toEqual(entities[idx].order_number);
      expect(item.order_update_time).toEqual(entities[idx].order_update_time);
      expect(item.sort_by_type).toEqual(entities[idx].sort_by_type);
      expect(item.archived_time).toEqual(entities[idx].archived_time);
      expect(item.kanban_type).toEqual(entities[idx].kanban_type);
      expect(item.created_date).toEqual(entities[idx].created_date);
      expect(item.updated_date).toEqual(entities[idx].updated_date);
    });
  });

  it('should batch create kanban and having out of order error', async () => {
    const params = [createSampleKanbanParam(), createSampleKanbanParam()];
    const userId = createSampleUserId();
    sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
    collectionService.findByIds = jest.fn().mockResolvedValueOnce([
      { id: params[0].collection_id }, { id: params[1].collection_id }
    ])
    jest.spyOn(CommonUtil, 'getMaxTableKanban')
      .mockResolvedValueOnce(SORT_OBJECT.MAX_ORDER_NUMBER + 1)
      .mockResolvedValueOnce(SORT_OBJECT.MAX_ORDER_NUMBER + 2);
    kanbanRepository.findOne = jest.fn().mockResolvedValueOnce({}).mockResolvedValueOnce({});
    const { errors } = await kanbanService.createBatchKanbans(params, 0, fakeReq);
    expect(errors).toHaveLength(2);
    expect(errors[0].code).toEqual(ErrorCode.ORDER_NUMBER_OUT_OF_RANGE);
    expect(errors[0].message).toEqual(MSG_ORDER_NUMBER_OUT_OF_RANGE);
    expect(errors[1].code).toEqual(ErrorCode.ORDER_NUMBER_OUT_OF_RANGE);
    expect(errors[1].message).toEqual(MSG_ORDER_NUMBER_OUT_OF_RANGE);
  });

  it('should batch create kanban member', async () => {
    const params = [createSampleKanbanParam(), createSampleKanbanParam()];
    const userId = createSampleUserId();
    const { errors } = await kanbanService.createBatchKanbans(params, 1, fakeReq);
    expect(errors).toHaveLength(2);
  });

  it('should batch create kanban having error', async () => {
    const params = [createSampleKanbanParam(), createSampleKanbanParam(),
    createSampleKanbanParam(), createSampleKanbanParam()];
    const entities = [createSampleKanbanEntity({ param: params[0] }),
    createSampleKanbanEntity({ param: params[1] })];
    const paramErrors = [new KanbanParamError({
      ...KanbanErrorDics.COLLECTION_NOT_FOUND,
      attributes: {
        collection_id: params[2].collection_id,
        ref: params[2].ref
      }
    }), new KanbanParamError({
      ...KanbanErrorDics.COLLECTION_NOT_FOUND,
      attributes: {
        collection_id: params[3].collection_id,
        ref: params[3].ref
      }
    })];
    const userId = createSampleUserId();
    collectionService.findByIds = jest.fn().mockResolvedValueOnce([
      { id: params[0].collection_id }, { id: params[1].collection_id }
    ])
    jest.spyOn(CommonUtil, 'getMaxTableKanban')
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4);
    kanbanService.create = jest.fn().mockResolvedValueOnce(entities[0])
      .mockResolvedValueOnce(entities[1])
      .mockImplementationOnce(() => {
        throw paramErrors[0];
      })
      .mockImplementationOnce(() => {
        throw paramErrors[1];
      });

    const { created, errors } = await kanbanService.createBatchKanbans(params, 0, fakeReq);

    expect(kanbanService.create).toBeCalledTimes(4);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    // expect(apiLastModifiedQueueService.addJob).toHaveBeenCalledWith({
    //   apiName: ApiLastModifiedName.KANBAN,
    //   userId,
    //   updatedDate: getCreatedDate()
    // });
    expect(created).toHaveLength(2);
    expect(errors).toHaveLength(2);
    created.forEach((item, idx) => {
      expect(item.id).toEqual(entities[idx].id);
      expect(item.name).toEqual(entities[idx].name);
      expect(item.color).toEqual(entities[idx].color);
      expect(item.collection_id).toEqual(entities[idx].collection_id);
      expect(item.archive_status).toEqual(entities[idx].archive_status);
      expect(item.show_done_todo).toEqual(entities[idx].show_done_todo);
      expect(item.add_new_obj_type).toEqual(entities[idx].add_new_obj_type);
      expect(item.order_number).toEqual(entities[idx].order_number);
      expect(item.order_update_time).toEqual(entities[idx].order_update_time);
      expect(item.sort_by_type).toEqual(entities[idx].sort_by_type);
      expect(item.archived_time).toEqual(entities[idx].archived_time);
      expect(item.kanban_type).toEqual(entities[idx].kanban_type);
      expect(item.created_date).toEqual(entities[idx].created_date);
      expect(item.updated_date).toEqual(entities[idx].updated_date);
    });
    errors.forEach((item, idx) => {
      expect(item).toBeInstanceOf(KanbanParamError);
      expect(item).toStrictEqual(paramErrors[idx]);
    });
  });

  it('should batch create kanban having query failed - duplicated entry error', async () => {
    const params = [createSampleKanbanParam(), createSampleKanbanParam(),
    createSampleKanbanParam(), createSampleKanbanParam()];
    const entities = [createSampleKanbanEntity({ param: params[0] }),
    createSampleKanbanEntity({ param: params[1] })];
    const paramErrors = [new KanbanParamError({
      ...KanbanErrorDics.DUPLICATED_ENTRY,
      attributes: params[2]
    }), new KanbanParamError({
      code: KanbanErrorCode.KANBAN_ENTITY_ERROR,
      message: 'entity not found',
      attributes: params[3]
    })];
    const userId = createSampleUserId();
    collectionService.findByIds = jest.fn().mockResolvedValueOnce([
      { id: params[0].collection_id }, { id: params[1].collection_id }
    ])
    jest.spyOn(CommonUtil, 'getMaxTableKanban')
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4);
    const queryFailedError = new QueryFailedError('', [], new Error());
    queryFailedError.message = 'ER_DUP_ENTRY';
    const entityNotFoundError = new EntityNotFoundError(Kanban, null);
    entityNotFoundError.message = paramErrors[1].message;
    kanbanService.create = jest.fn().mockResolvedValueOnce(entities[0])
      .mockResolvedValueOnce(entities[1])
      .mockImplementationOnce(() => {
        throw queryFailedError;
      })
      .mockImplementationOnce(() => {
        throw entityNotFoundError;
      });

    const { created, errors } = await kanbanService.createBatchKanbans(params, 0, fakeReq);

    expect(kanbanService.create).toBeCalledTimes(4);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    // expect(apiLastModifiedQueueService.addJob).toHaveBeenCalledWith({
    //   apiName: ApiLastModifiedName.KANBAN,
    //   userId,
    //   updatedDate: getCreatedDate()
    // });
    expect(created).toHaveLength(2);
    expect(errors).toHaveLength(2);
    created.forEach((item, idx) => {
      const find = entities.find(e => e.id === item.id);
      expect(item.id).toEqual(find.id);
      expect(item.name).toEqual(find.name);
      expect(item.color).toEqual(find.color);
      expect(item.collection_id).toEqual(find.collection_id);
      expect(item.archive_status).toEqual(find.archive_status);
      expect(item.show_done_todo).toEqual(find.show_done_todo);
      expect(item.add_new_obj_type).toEqual(find.add_new_obj_type);
      expect(item.order_update_time).toEqual(find.order_update_time);
      expect(item.sort_by_type).toEqual(find.sort_by_type);
      expect(item.archived_time).toEqual(find.archived_time);
      expect(item.kanban_type).toEqual(find.kanban_type);
      expect(item.created_date).toEqual(find.created_date);
      expect(item.updated_date).toEqual(find.updated_date);
    });
  });

  it('should batch create kanban having query failed error', async () => {
    const params = [createSampleKanbanParam(), createSampleKanbanParam(),
    createSampleKanbanParam(), createSampleKanbanParam()];
    const entities = [createSampleKanbanEntity({ param: params[0] }),
    createSampleKanbanEntity({ param: params[1] })];
    const paramErrors = [new KanbanParamError({
      code: KanbanErrorCode.KANBAN_ENTITY_ERROR,
      message: 'query failed',
      attributes: params[2]
    }), new KanbanParamError({
      code: KanbanErrorCode.KANBAN_ENTITY_ERROR,
      message: 'entity not found',
      attributes: params[3]
    })];
    const userId = createSampleUserId();
    collectionService.findByIds = jest.fn().mockResolvedValueOnce([
      { id: params[0].collection_id }, { id: params[1].collection_id }
    ])
    jest.spyOn(CommonUtil, 'getMaxTableKanban')
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4);
    const queryFailedError = new QueryFailedError('', [], new Error());
    queryFailedError.message = paramErrors[0].message;
    const entityNotFoundError = new EntityNotFoundError(Kanban, null);
    entityNotFoundError.message = paramErrors[1].message;
    kanbanService.create = jest.fn().mockResolvedValueOnce(entities[0])
      .mockResolvedValueOnce(entities[1])
      .mockImplementationOnce(() => {
        throw queryFailedError;
      })
      .mockImplementationOnce(() => {
        throw entityNotFoundError;
      });

    const { created, errors } = await kanbanService.createBatchKanbans(params, 0, fakeReq);

    expect(kanbanService.create).toBeCalledTimes(4);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    // expect(apiLastModifiedQueueService.addJob).toHaveBeenCalledWith({
    //   apiName: ApiLastModifiedName.KANBAN,
    //   userId,
    //   updatedDate: getCreatedDate()
    // });
    expect(created).toHaveLength(2);
    expect(errors).toHaveLength(2);
    created.forEach((item, idx) => {
      const find = entities.find(e => e.id === item.id);
      expect(item.id).toEqual(find.id);
      expect(item.name).toEqual(find.name);
      expect(item.color).toEqual(find.color);
      expect(item.collection_id).toEqual(find.collection_id);
      expect(item.archive_status).toEqual(find.archive_status);
      expect(item.show_done_todo).toEqual(find.show_done_todo);
      expect(item.add_new_obj_type).toEqual(find.add_new_obj_type);
      expect(item.order_number).toEqual(find.order_number);
      expect(item.order_update_time).toEqual(find.order_update_time);
      expect(item.sort_by_type).toEqual(find.sort_by_type);
      expect(item.archived_time).toEqual(find.archived_time);
      expect(item.kanban_type).toEqual(find.kanban_type);
      expect(item.created_date).toEqual(find.created_date);
      expect(item.updated_date).toEqual(find.updated_date);
    });
  });

  it('should batch create kanban having unknown error', async () => {
    const params = [createSampleKanbanParam(), createSampleKanbanParam()];
    const entities = [createSampleKanbanEntity({ param: params[0] }),
    createSampleKanbanEntity({ param: params[1] })];
    const error = new Error('any message');
    const userId = createSampleUserId();
    collectionService.findByIds = jest.fn().mockResolvedValueOnce([
      { id: params[0].collection_id }, { id: params[1].collection_id }
    ])
    jest.spyOn(CommonUtil, 'getMaxTableKanban')
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    kanbanService.create = jest.fn().mockResolvedValueOnce(entities[0])
      .mockImplementationOnce(() => {
        throw error;
      });

    try {
      await kanbanService.createBatchKanbans(params, 0, fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err).toStrictEqual(error);
    }
    expect(kanbanService.create).toBeCalledTimes(2);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
  });

  it('should update kanban', async () => {
    const param = createSampleUpdateKanbanParam();
    const entity = createSampleKanbanEntity({ param });
    const userId = createSampleUserId();

    kanbanRepository.update.mockReturnValue({
      affected: 1
    });
    kanbanRepository.findOne.mockReturnValue(entity);
    kanbanRepository.create.mockReturnValue(param);

    const result = await kanbanService.updateWithReturn(userId, param, 0);

    expect(kanbanRepository.findOne).toBeCalledTimes(1);
    expect(kanbanRepository.findOne).toBeCalledWith({
      where: {
        user_id: userId,
        id: param.id
      }
    });
    expect(kanbanRepository.create).toBeCalledTimes(1);
    expect(kanbanRepository.update).toBeCalledTimes(1);
    expect(kanbanRepository.update.mock.calls)
      .toEqual([
        [entity.id, param],
      ]);
    expect(result).not.toBeNull();
    expect(result.id).toEqual(entity.id);
    expect(result.name).toEqual(param.name);
    expect(result.color).toEqual(param.color);
    expect(result.collection_id).toEqual(entity.collection_id);
    expect(result.archive_status).toEqual(param.archive_status);
    expect(result.show_done_todo).toEqual(param.show_done_todo);
    expect(result.add_new_obj_type).toEqual(param.add_new_obj_type);
    expect(result.sort_by_type).toEqual(param.sort_by_type);
    expect(result.order_number).toEqual(entity.order_number);
    expect(result.order_update_time).toEqual(entity.order_update_time);
    expect(result.archived_time).toEqual(entity.archived_time);
    expect(result.kanban_type).toEqual(entity.kanban_type);
    expect(result.created_date).toEqual(entity.created_date);
    expect(result.updated_date).toEqual(entity.updated_date);
  });

  it('should update kanban having kanban not found error', async () => {
    const param = createSampleUpdateKanbanParam();
    const userId = createSampleUserId();
    const error = new UpdateKanbanParamError({
      ...KanbanErrorDics.KANBAN_NOT_FOUND,
      attributes: {
        id: param.id
      }
    });
    kanbanRepository.findOne.mockReturnValue(undefined);

    try {
      await kanbanService.updateWithReturn(userId, param, 0);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateKanbanParamError);
      expect(err).toStrictEqual(error);
    }

    expect(kanbanRepository.findOne).toBeCalledTimes(1);
    expect(kanbanRepository.findOne).toBeCalledWith({
      where: {
        user_id: userId,
        id: param.id
      }
    });
    expect(kanbanRepository.create).toBeCalledTimes(0);
    expect(kanbanRepository.update).toBeCalledTimes(0);
  });

  it('should update kanban having system kanban error', async () => {
    const userId = createSampleUserId();
    const param = { name: 'fake', id: userId };
    let entity = createSampleKanbanEntity({ param, type: 1 });
    kanbanRepository.findOne = jest.fn().mockResolvedValueOnce(entity);
    const error = new UpdateKanbanParamError({
      ...KanbanErrorDics.NOTHING_TO_UPDATE,
      attributes: {
        id: param.id
      }
    });
    try {
      await kanbanService.updateWithReturn(userId, param, 0);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateKanbanParamError);
      expect(err).toStrictEqual(error);
    }
  });

  it('should update kanban having error empty data', async () => {
    const userId = createSampleUserId();
    const param = { id: userId };
    const entity = createSampleKanbanEntity({ param, type: 1 });
    const error = new UpdateKanbanParamError({
      ...KanbanErrorDics.NOTHING_TO_UPDATE,
      attributes: {
        id: param.id
      }
    });
    kanbanRepository.findOne = jest.fn().mockResolvedValueOnce(entity);

    try {
      await kanbanService.updateWithReturn(userId, param, 0);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateKanbanParamError);
      expect(err).toStrictEqual(error);
    }
  });

  it('should update kanban having kanban not found error 2', async () => {
    const param = createSampleUpdateKanbanParam();
    const entity = createSampleKanbanEntity({ param });
    const userId = createSampleUserId();
    const error = new UpdateKanbanParamError({
      ...KanbanErrorDics.KANBAN_NOT_FOUND,
      attributes: {
        id: param.id
      }
    });
    kanbanRepository.update.mockReturnValue({
      affected: 0
    });
    kanbanRepository.findOne.mockReturnValue(entity);
    kanbanRepository.create.mockReturnValue(param);

    try {
      await kanbanService.updateWithReturn(userId, param, 0);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateKanbanParamError);
      expect(err).toStrictEqual(error);
    }

    expect(kanbanRepository.findOne).toBeCalledTimes(1);
    expect(kanbanRepository.findOne).toBeCalledWith({
      where: {
        user_id: userId,
        id: param.id
      }
    });
    expect(kanbanRepository.create).toBeCalledTimes(1);
    expect(kanbanRepository.update).toBeCalledTimes(1);
  });

  it('should batch update kanban', async () => {
    const params = [createSampleUpdateKanbanParam(), createSampleUpdateKanbanParam()];
    const entities = [createSampleKanbanEntity({ param: params[0] }),
    createSampleKanbanEntity({ param: params[1] })];
    const userId = createSampleUserId();

    kanbanService.updateWithReturn = jest.fn().mockResolvedValueOnce(entities[0])
      .mockResolvedValueOnce(entities[1]);

    const { updated, errors } = await kanbanService.updateBatchKanbansWithReturn(params, fakeReq);

    expect(kanbanService.updateWithReturn).toBeCalledTimes(2);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    expect(updated).toHaveLength(2);
    expect(errors).toHaveLength(0);
    updated.forEach((item, idx) => {
      expect(item.id).toEqual(entities[idx].id);
      expect(item.name).toEqual(entities[idx].name);
      expect(item.color).toEqual(entities[idx].color);
      expect(item.collection_id).toEqual(entities[idx].collection_id);
      expect(item.archive_status).toEqual(entities[idx].archive_status);
      expect(item.show_done_todo).toEqual(entities[idx].show_done_todo);
      expect(item.add_new_obj_type).toEqual(entities[idx].add_new_obj_type);
      expect(item.order_number).toEqual(entities[idx].order_number);
      expect(item.order_update_time).toEqual(entities[idx].order_update_time);
      expect(item.sort_by_type).toEqual(entities[idx].sort_by_type);
      expect(item.archived_time).toEqual(entities[idx].archived_time);
      expect(item.kanban_type).toEqual(entities[idx].kanban_type);
      expect(item.created_date).toEqual(entities[idx].created_date);
      expect(item.updated_date).toEqual(entities[idx].updated_date);
    });
  });

  it('should batch update kanban having error', async () => {
    const params = [createSampleUpdateKanbanParam(), createSampleUpdateKanbanParam(),
    createSampleUpdateKanbanParam(), createSampleUpdateKanbanParam()];
    const entities = [createSampleKanbanEntity({ param: params[0] }),
    createSampleKanbanEntity({ param: params[1] })];
    const userId = createSampleUserId();
    const paramErrors = [new UpdateKanbanParamError({
      ...KanbanErrorDics.KANBAN_NOT_FOUND,
      attributes: {
        id: params[2].id
      }
    }), new UpdateKanbanParamError({
      ...KanbanErrorDics.UPDATE_SYSTEM_KANBAN,
      attributes: {
        id: params[3].id
      }
    })];

    kanbanService.updateWithReturn = jest.fn().mockResolvedValueOnce(entities[0])
      .mockResolvedValueOnce(entities[1])
      .mockImplementationOnce(() => {
        throw paramErrors[0];
      })
      .mockImplementationOnce(() => {
        throw paramErrors[1];
      });

    const { updated, errors } = await kanbanService.updateBatchKanbansWithReturn(params, fakeReq);

    expect(kanbanService.updateWithReturn).toBeCalledTimes(4);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    expect(updated).toHaveLength(2);
    expect(errors).toHaveLength(2);
    updated.forEach((item, idx) => {
      expect(item.id).toEqual(entities[idx].id);
      expect(item.name).toEqual(entities[idx].name);
      expect(item.color).toEqual(entities[idx].color);
      expect(item.collection_id).toEqual(entities[idx].collection_id);
      expect(item.archive_status).toEqual(entities[idx].archive_status);
      expect(item.show_done_todo).toEqual(entities[idx].show_done_todo);
      expect(item.add_new_obj_type).toEqual(entities[idx].add_new_obj_type);
      expect(item.order_number).toEqual(entities[idx].order_number);
      expect(item.order_update_time).toEqual(entities[idx].order_update_time);
      expect(item.sort_by_type).toEqual(entities[idx].sort_by_type);
      expect(item.archived_time).toEqual(entities[idx].archived_time);
      expect(item.kanban_type).toEqual(entities[idx].kanban_type);
      expect(item.created_date).toEqual(entities[idx].created_date);
      expect(item.updated_date).toEqual(entities[idx].updated_date);
    });
    errors.forEach((item, idx) => {
      expect(item).toBeInstanceOf(UpdateKanbanParamError);
      expect(item).toStrictEqual(paramErrors[idx]);
    });
  });

  it('should batch update kanban having query failed error', async () => {
    const params = [createSampleUpdateKanbanParam(), createSampleUpdateKanbanParam(),
    createSampleUpdateKanbanParam(), createSampleUpdateKanbanParam()];
    const entities = [createSampleKanbanEntity({ param: params[0] }),
    createSampleKanbanEntity({ param: params[1] })];
    const userId = createSampleUserId();
    const paramErrors = [new UpdateKanbanParamError({
      code: KanbanErrorCode.KANBAN_ENTITY_ERROR,
      message: 'query failed',
      attributes: params[2]
    }), new UpdateKanbanParamError({
      code: KanbanErrorCode.KANBAN_ENTITY_ERROR,
      message: 'entity not found',
      attributes: params[3]
    })];
    const queryFailedError = new QueryFailedError('', [], new Error());
    queryFailedError.message = paramErrors[0].message;
    const entityNotFoundError = new EntityNotFoundError(Kanban, null);
    entityNotFoundError.message = paramErrors[1].message;

    kanbanService.updateWithReturn = jest.fn().mockResolvedValueOnce(entities[0])
      .mockResolvedValueOnce(entities[1])
      .mockImplementationOnce(() => {
        throw queryFailedError;
      })
      .mockImplementationOnce(() => {
        throw entityNotFoundError;
      });

    const { updated, errors } = await kanbanService.updateBatchKanbansWithReturn(params, fakeReq);

    expect(kanbanService.updateWithReturn).toBeCalledTimes(4);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    expect(updated).toHaveLength(2);
    expect(errors).toHaveLength(2);
    updated.forEach((item, idx) => {
      expect(item.id).toEqual(entities[idx].id);
      expect(item.name).toEqual(entities[idx].name);
      expect(item.color).toEqual(entities[idx].color);
      expect(item.collection_id).toEqual(entities[idx].collection_id);
      expect(item.archive_status).toEqual(entities[idx].archive_status);
      expect(item.show_done_todo).toEqual(entities[idx].show_done_todo);
      expect(item.add_new_obj_type).toEqual(entities[idx].add_new_obj_type);
      expect(item.order_number).toEqual(entities[idx].order_number);
      expect(item.order_update_time).toEqual(entities[idx].order_update_time);
      expect(item.sort_by_type).toEqual(entities[idx].sort_by_type);
      expect(item.archived_time).toEqual(entities[idx].archived_time);
      expect(item.kanban_type).toEqual(entities[idx].kanban_type);
      expect(item.created_date).toEqual(entities[idx].created_date);
      expect(item.updated_date).toEqual(entities[idx].updated_date);
    });
  });

  it('should batch update kanban having unknown error', async () => {
    const params = [createSampleUpdateKanbanParam(), createSampleUpdateKanbanParam()];
    const entities = [createSampleKanbanEntity({ param: params[0] }),
    createSampleKanbanEntity({ param: params[1] })];
    const userId = createSampleUserId();
    const error = new Error('any message');

    kanbanService.updateWithReturn = jest.fn().mockResolvedValueOnce(entities[0])
      .mockImplementationOnce(() => {
        throw error;
      });

    try {
      await kanbanService.updateBatchKanbansWithReturn(params, fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err).toStrictEqual(error);
    }

    expect(kanbanService.updateWithReturn).toBeCalledTimes(2);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
  });

  it('should delete kanban', async () => {
    kanbanQueueService.deleteKanban = jest.fn().mockResolvedValue('');
    const param = createSampleDeleteKanbanParam();
    const entity: Partial<Kanban> =
    {
      id: param.id,
      is_trashed: IS_TRASHED.TRASHED
    };
    const userId = createSampleUserId();
    kanbanRepository.findOne.mockReturnValue(entity);
    kanbanRepository.update.mockReturnValue(entity);

    await kanbanService.delete(userId, param);

    expect(kanbanRepository.findOne).toBeCalledTimes(1);
    expect(kanbanRepository.findOne).toBeCalledWith({
      select: ['id', 'is_trashed', 'kanban_type'],
      where: {
        user_id: userId,
        id: param.id
      }
    });
    expect(kanbanRepository.update).toBeCalledTimes(1);
    expect(kanbanRepository.update.mock.calls)
      .toEqual([
        [entity.id, {
          is_trashed: IS_TRASHED.DELETED
        }],
      ]);
  });

  it('should delete kanban having kanban not found error', async () => {
    const param = createSampleDeleteKanbanParam();
    const userId = createSampleUserId();
    const error = new DeleteKanbanParamError({
      ...KanbanErrorDics.KANBAN_NOT_FOUND,
      attributes: {
        id: param.id
      }
    });
    kanbanRepository.findOne.mockReturnValue(undefined);

    try {
      await kanbanService.delete(userId, param);
    } catch (err) {
      expect(err).toBeInstanceOf(DeleteKanbanParamError);
      expect(err).toStrictEqual(error);
    }

    expect(kanbanRepository.findOne).toBeCalledTimes(1);
    expect(kanbanRepository.findOne).toBeCalledWith({
      select: ['id', 'is_trashed', 'kanban_type'],
      where: {
        user_id: userId,
        id: param.id
      }
    });
    expect(kanbanRepository.update).toBeCalledTimes(0);
    expect(kanbanQueueService.deleteKanban).toBeCalledTimes(0);
  });

  it('should delete kanban having system kanban error', async () => {
    const param = createSampleDeleteKanbanParam();
    const entity: Partial<Kanban> =
    {
      id: param.id,
      is_trashed: IS_TRASHED.TRASHED,
      kanban_type: KanbanType.SYSTEM
    };
    const userId = createSampleUserId();
    const error = new DeleteKanbanParamError({
      ...KanbanErrorDics.DELETE_SYSTEM_KANBAN,
      attributes: {
        id: param.id
      }
    });
    kanbanRepository.findOne.mockReturnValue(entity);

    try {
      await kanbanService.delete(userId, param);
    } catch (err) {
      expect(err).toBeInstanceOf(DeleteKanbanParamError);
      expect(err).toStrictEqual(error);
    }

    expect(kanbanRepository.findOne).toBeCalledTimes(1);
    expect(kanbanRepository.findOne).toBeCalledWith({
      select: ['id', 'is_trashed', 'kanban_type'],
      where: {
        user_id: userId,
        id: param.id
      }
    });
    expect(kanbanRepository.update).toBeCalledTimes(0);
    expect(kanbanQueueService.deleteKanban).toBeCalledTimes(0);
  });

  it('should delete kanban having kanban deleted error', async () => {
    const param = createSampleDeleteKanbanParam();
    const entity: Partial<Kanban> =
    {
      id: param.id,
      is_trashed: IS_TRASHED.DELETED
    };
    const userId = createSampleUserId();
    const error = new DeleteKanbanParamError({
      ...KanbanErrorDics.KANBAN_NOT_FOUND,
      attributes: {
        id: param.id
      }
    });
    kanbanRepository.findOne.mockReturnValue(entity);

    try {
      await kanbanService.delete(userId, param);
    } catch (err) {
      expect(err).toBeInstanceOf(DeleteKanbanParamError);
      expect(err).toStrictEqual(error);
    }

    expect(kanbanRepository.findOne).toBeCalledTimes(1);
    expect(kanbanRepository.findOne).toBeCalledWith({
      select: ['id', 'is_trashed', 'kanban_type'],
      where: {
        user_id: userId,
        id: param.id
      }
    });
    expect(kanbanRepository.update).toBeCalledTimes(0);
    expect(kanbanQueueService.deleteKanban).toBeCalledTimes(0);
  });

  it('should batch delete kanban', async () => {
    const params = [createSampleDeleteKanbanParam(), createSampleDeleteKanbanParam()];
    const entities = [{
      id: params[0].id,
      is_trashed: IS_TRASHED.TRASHED
    }, {
      id: params[1].id,
      is_trashed: IS_TRASHED.TRASHED
    }];
    const userId = createSampleUserId();

    kanbanService.delete = jest.fn().mockResolvedValueOnce(entities[0])
      .mockResolvedValueOnce(entities[1]);

    const { deleted, errors } = await kanbanService.batchDelete(userId, params);

    expect(kanbanService.delete).toBeCalledTimes(2);
    expect(kanbanService.delete).toHaveBeenNthCalledWith(1, userId, params[0]);
    expect(kanbanService.delete).toHaveBeenNthCalledWith(2, userId, params[1]);
    expect(deleted).toHaveLength(2);
    expect(errors).toHaveLength(0);
    deleted.forEach((item, idx) => {
      expect(item.id).toEqual(entities[idx].id);
    });
  });

  it('should batch delete kanban having error', async () => {
    const params = [createSampleDeleteKanbanParam(), createSampleDeleteKanbanParam(),
    createSampleDeleteKanbanParam(), createSampleDeleteKanbanParam()];
    const entities = [{
      id: params[0].id,
    }, {
      id: params[1].id,
    }];
    const userId = createSampleUserId();
    const paramErrors = [new DeleteKanbanParamError({
      ...KanbanErrorDics.KANBAN_NOT_FOUND,
      attributes: {
        id: params[2].id
      }
    }), new DeleteKanbanParamError({
      ...KanbanErrorDics.KANBAN_NOT_FOUND,
      attributes: {
        id: params[3].id
      }
    })];

    kanbanService.delete = jest.fn().mockResolvedValueOnce(entities[0])
      .mockResolvedValueOnce(entities[1])
      .mockImplementationOnce(() => {
        throw paramErrors[0];
      })
      .mockImplementationOnce(() => {
        throw paramErrors[1];
      });

    const { deleted, errors } = await kanbanService.batchDelete(userId, params);

    expect(kanbanService.delete).toBeCalledTimes(4);
    expect(kanbanService.delete).toHaveBeenNthCalledWith(1, userId, params[0]);
    expect(kanbanService.delete).toHaveBeenNthCalledWith(2, userId, params[1]);
    expect(kanbanService.delete).toHaveBeenNthCalledWith(3, userId, params[2]);
    expect(kanbanService.delete).toHaveBeenNthCalledWith(4, userId, params[3]);
    expect(deleted).toHaveLength(2);
    expect(errors).toHaveLength(2);
    deleted.forEach((item, idx) => {
      expect(item.id).toEqual(entities[idx].id);
    });
    errors.forEach((item, idx) => {
      expect(item).toBeInstanceOf(DeleteKanbanParamError);
      expect(item).toStrictEqual(paramErrors[idx]);
    });
  });

  it('should batch delete kanban having query failed error', async () => {
    const params = [createSampleDeleteKanbanParam(), createSampleDeleteKanbanParam(),
    createSampleDeleteKanbanParam(), createSampleDeleteKanbanParam()];
    const entities = [{
      id: params[0].id,
    }, {
      id: params[1].id,
    }];
    const userId = createSampleUserId();
    const paramErrors = [new DeleteKanbanParamError({
      code: KanbanErrorCode.KANBAN_ENTITY_ERROR,
      message: 'query failed',
      attributes: params[2]
    }), new DeleteKanbanParamError({
      code: KanbanErrorCode.KANBAN_ENTITY_ERROR,
      message: 'entity not found',
      attributes: params[3]
    })];
    const queryFailedError = new QueryFailedError('', [], new Error());
    queryFailedError.message = paramErrors[0].message;
    const entityNotFoundError = new EntityNotFoundError(Kanban, null);
    entityNotFoundError.message = paramErrors[1].message;

    kanbanService.delete = jest.fn().mockResolvedValueOnce(entities[0])
      .mockResolvedValueOnce(entities[1])
      .mockImplementationOnce(() => {
        throw queryFailedError;
      })
      .mockImplementationOnce(() => {
        throw entityNotFoundError;
      });

    const { deleted, errors } = await kanbanService.batchDelete(userId, params);

    expect(kanbanService.delete).toBeCalledTimes(4);
    expect(kanbanService.delete).toHaveBeenNthCalledWith(1, userId, params[0]);
    expect(kanbanService.delete).toHaveBeenNthCalledWith(2, userId, params[1]);
    expect(kanbanService.delete).toHaveBeenNthCalledWith(3, userId, params[2]);
    expect(kanbanService.delete).toHaveBeenNthCalledWith(4, userId, params[3]);
    expect(deleted).toHaveLength(2);
    expect(errors).toHaveLength(2);
    deleted.forEach((item, idx) => {
      expect(item.id).toEqual(entities[idx].id);
    });
    errors.forEach((item, idx) => {
      expect(item).toBeInstanceOf(DeleteKanbanParamError);
      expect(item).toStrictEqual(paramErrors[idx]);
    });
  });

  it('should batch delete kanban having unknown error', async () => {
    const params = [createSampleDeleteKanbanParam(), createSampleDeleteKanbanParam()];
    const entities = [{
      id: params[0].id,
    }, {
      id: params[1].id,
    }];
    const userId = createSampleUserId();
    const error = new Error('any message');

    kanbanService.delete = jest.fn().mockResolvedValueOnce(entities[0])
      .mockImplementationOnce(() => {
        throw error;
      });

    try {
      await kanbanService.batchDelete(userId, params);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err).toStrictEqual(error);
    }

    expect(kanbanService.delete).toBeCalledTimes(2);
    expect(kanbanService.delete).toHaveBeenNthCalledWith(1, userId, params[0]);
    expect(kanbanService.delete).toHaveBeenNthCalledWith(2, userId, params[1]);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
  });

  it('should find one by id', async () => {
    const entity = createSampleKanbanEntity();
    kanbanRepository.findOne = jest.fn().mockResolvedValue(entity);
    const userId = createSampleUserId();

    const result = await kanbanService.findOneById(userId, entity.id, { fields: ['id', 'name'] });
    expect(kanbanRepository.findOne).toHaveBeenCalledTimes(1);
    expect(kanbanRepository.findOne).toHaveBeenCalledWith({
      select: ['id', 'name'],
      where: {
        id: entity.id,
        user_id: userId,
      }
    });
    expect(result).not.toBeNull();
    expect(result.id).toEqual(result.id);
    expect(result.name).toEqual(result.name);
    expect(result.color).toEqual(result.color);
    expect(result.collection_id).toEqual(result.collection_id);
    expect(result.created_date).toEqual(result.created_date);
    expect(result.updated_date).toEqual(result.updated_date);
    expect(result.order_number).toEqual(result.order_number);
    expect(result.order_update_time).toEqual(result.order_update_time);
    expect(result.archive_status).toEqual(result.archive_status);
    expect(result.show_done_todo).toEqual(result.show_done_todo);
    expect(result.add_new_obj_type).toEqual(result.add_new_obj_type);
    expect(result.sort_by_type).toEqual(result.sort_by_type);
    expect(result.archived_time).toEqual(result.archived_time);
    expect(result.kanban_type).toEqual(result.kanban_type);
  });

  describe('Delete deleteByColIdsAndUserId', () => {
    const item_1 = createSampleDeleteKanbanParam();
    const item_2 = createSampleDeleteKanbanParam();
    const userId = createSampleUserId();
    it('should be success delete collection instances', async () => {
      kanbanRepository.find = jest.fn().mockReturnValueOnce([
        { id: item_1.id },
        { id: item_2.id },
      ]);
      deletedItemService.create = jest.fn().mockReturnValueOnce({})
        .mockReturnValueOnce({})

      const result = await kanbanService.
        deleteByColIdsAndUserId([item_1.id, item_2.id], userId);

      const result2 = await kanbanService.
        deleteByColIdsAndUserId([], userId);
    });

    it('should be success delete do not have collection instances', async () => {
      kanbanRepository.find = jest.fn().mockReturnValueOnce([
      ]);
      deletedItemService.create = jest.fn().mockReturnValueOnce({})
        .mockReturnValueOnce({})

      const result = await kanbanService.
        deleteByColIdsAndUserId([item_1.id, item_2.id], userId);
    });

  });
  afterAll(async () => {
    await app.close();
  });
});