import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { datatype, helpers } from 'faker';
import { EntityNotFoundError, In, QueryFailedError, Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../test';
import { COLLECTION_TYPE, IS_TRASHED } from '../../common/constants';
import { alertActions } from '../../common/dtos/alertParam';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import {
  Collection, CollectionIconEntity,
  DeletedItem, GlobalSetting, ShareMember
} from '../../common/entities';
import { IUser } from '../../common/interfaces';
import { CollectionRepository, KanbanRepository, RuleRepository } from '../../common/repositories';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { CollectionQueueService } from '../bullmq-queue/collection-queue.service';
import { ChimeChatService } from '../communication/services';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { SieveEmailService } from '../manual-rule/sieve.email';
import { GlobalSettingService as SettingService } from '../setting/setting.service';
import {
  CollectionErrorCode, CollectionErrorDict, CollectionResponseMessage
} from './collection-response-message';
import { CollectionService } from './collection.service';
import {
  CollectionType, CreateCollectionParam, DeleteCollectionParam,
  UpdateCollectionParam
} from './dto/collection-param';
import {
  CollectionParamError,
  DeleteCollectionParamError,
  UpdateCollectionParamError
} from './dto/collection-param-error';
import { checkDbLevelAndCreateEntity, checkParentCollectionSharePayload } from './system/test/fakeData';
jest.mock('uuid', () => {
  return {
    v4: jest.fn().mockReturnValue('2906e564-a40d-11eb-b55c-070f99e81ded'),
  };
});

const user: IUser = {
  userId: 1,
  id: 1,
  email: 'tester001@flomail.net',
  appId: '',
  deviceUid: '',
  userAgent: '',
  token: '',
};
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

const spyHttpClient = {
  axiosRef: {
    post: jest.fn().mockReturnValue({
      data: { data: [] }
    })
  }
};

const createSampleCollectionParam = (): CreateCollectionParam => {
  return Object.assign(new CreateCollectionParam(), {
    name: datatype.string(),
    color: helpers.randomize(),
    calendar_uri: datatype.uuid(),
    type: CollectionType.UserDefined,
    parent_id: datatype.number({ min: 1 }),
    due_date: datatype.float({ min: 1, precision: 3 }),
    flag: helpers.randomize([0, 1]),
    is_hide: helpers.randomize([0, 1]),
    alerts: [
      {
        uid: datatype.uuid(),
        action: helpers.randomize(alertActions),
        trigger: {
          past: datatype.boolean(),
          weeks: datatype.number({ min: 0, max: 4 }),
          days: datatype.number({ min: 0, max: 30 }),
          hours: datatype.number({ min: 0, max: 24 }),
          minutes: datatype.number({ min: 0, max: 60 }),
          seconds: datatype.number({ min: 0, max: 60 }),
        },
        description: datatype.string(),
      },
    ],
    kanban_mode: helpers.randomize([0, 1]),
    recent_time: datatype.float({ min: 1, precision: 3 }),
    is_expand: helpers.randomize([0, 1]),
    ref: datatype.string(),
  });
};

const createSampleUpdateCollectionParam = (): UpdateCollectionParam => {
  return Object.assign(new UpdateCollectionParam(), {
    id: datatype.number({ min: 1 }),
    name: datatype.string(),
    color: helpers.randomize(),
    parent_id: datatype.number({ min: 0 }),
    due_date: datatype.float({ min: 0, precision: 3 }),
    flag: helpers.randomize([0, 1]),
    is_hide: helpers.randomize([0, 1]),
    alerts: [
      {
        uid: datatype.uuid(),
        action: helpers.randomize(alertActions),
        trigger: {
          past: datatype.boolean(),
          weeks: datatype.number({ min: 0, max: 4 }),
          days: datatype.number({ min: 0, max: 30 }),
          hours: datatype.number({ min: 0, max: 24 }),
          minutes: datatype.number({ min: 0, max: 60 }),
          seconds: datatype.number({ min: 0, max: 60 }),
        },
        description: datatype.string(),
      },
    ],
    kanban_mode: helpers.randomize([0, 1]),
    is_expand: helpers.randomize([0, 1]),
  });
};

const createSampleCollectionEntity = (option?: {
  param?: CreateCollectionParam | UpdateCollectionParam;
  type?: CollectionType;
}): Partial<Collection> => {
  let id;
  let calendar_uri;
  let type;
  if (option?.param instanceof UpdateCollectionParam) {
    id = option?.param.id;
  }
  if (option?.param instanceof CreateCollectionParam) {
    calendar_uri = option?.param.calendar_uri;
  }
  if (option?.type) {
    type = option?.type;
  }
  return {
    id: id !== undefined ? id : datatype.number({ min: 1 }),
    name: option?.param?.name || datatype.string(),
    color: option?.param?.color || helpers.randomize(),
    calendar_uri: calendar_uri || datatype.uuid(),
    parent_id:
      option?.param?.parent_id !== undefined
        ? option?.param?.parent_id
        : datatype.number({ min: 0 }),
    created_date: datatype.float({ min: 0, precision: 3 }),
    updated_date: datatype.float({ min: 0, precision: 3 }),
    type: type || CollectionType.UserDefined,
    due_date:
      option?.param?.due_date !== undefined
        ? option?.param?.due_date
        : datatype.float({ min: 0, precision: 3 }),
    flag: option?.param?.flag !== undefined ? option?.param?.flag : helpers.randomize([0, 1]),
    is_hide:
      option?.param?.is_hide !== undefined ? option?.param?.is_hide : helpers.randomize([0, 1]),
    alerts: option?.param?.alerts || [
      {
        uid: datatype.uuid(),
        action: helpers.randomize(alertActions),
        trigger: {
          past: datatype.boolean(),
          weeks: datatype.number({ min: 0, max: 4 }),
          days: datatype.number({ min: 0, max: 30 }),
          hours: datatype.number({ min: 0, max: 24 }),
          minutes: datatype.number({ min: 0, max: 60 }),
          seconds: datatype.number({ min: 0, max: 60 }),
        },
        description: datatype.string(),
      },
    ],
    recent_time:
      option?.param?.recent_time !== undefined
        ? option?.param?.recent_time
        : datatype.float({ min: 0, precision: 3 }),
    kanban_mode:
      option?.param?.kanban_mode !== undefined
        ? option?.param?.kanban_mode
        : helpers.randomize([0, 1]),
  };
};

const createSampleDeleteCollectionParam = (): DeleteCollectionParam => {
  return Object.assign(new DeleteCollectionParam(), {
    id: datatype.number({ min: 1 }),
  });
};

const createSampleUserId = () => datatype.number({ min: 1 });
const createSampleUser = () => ({
  userId: datatype.number({ min: 1 }),
  email: 'abc@mail.com'
});

// @ts-ignore
const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(() => ({
  find: jest.fn((entity) => []),
  save: jest.fn((entity) => entity),
  insert: jest.fn((entity) => {
    return {
      ...entity,
      generatedMaps: entity
    }
  }),
  update: jest.fn((entity) => entity),
  remove: jest.fn((entity) => entity),
  create: jest.fn((e) => e),
  findOne: jest.fn((e) => e),
  findOnMasterByUids: jest.fn((e) => e),
  findOneOnMaster: jest.fn((e) => e),
  findAllOnMaster: jest.fn((e) => e),
  findByCollection: jest.fn((e) => []),
  manager: {
    query: jest.fn(entity => entity),
  }
}));

const repositoryCollectionIconMockFactory: () => MockType<Repository<any>> = jest.fn(() => ({
  find: jest.fn((entity) => entity),
  insert: jest.fn((entity) => entity),
  save: jest.fn((entity) => entity),
  update: jest.fn((entity) => entity),
  remove: jest.fn((entity) => entity),
  create: jest.fn((e) => e),
  findOne: jest.fn((e) => e),
}));

const deletedItemServiceMockFactory: () => MockType<DeletedItemService> = jest.fn(() => ({
  findAll: jest.fn((e) => e),
  batchCreate: jest.fn((e) => e),
}));

const apiLastModifiedQueueServiceMockFactory: () => MockType<ApiLastModifiedQueueService> = jest.fn(
  () => ({
    addJob: jest.fn((e) => e),
  }),
);

const collectionQueueServiceMockFactory: () => MockType<CollectionQueueService> = jest.fn(() => ({
  deleteCollection: jest.fn((e) => e),
}));

const settingServiceMockFactory: () => MockType<SettingService> = jest.fn(() => ({
  findOneByUserId: jest.fn((e) => e),
}));

const kanbanRepositoryMockFactory: () => MockType<KanbanRepository> = jest.fn(() => ({
  generateSystemKanban: jest.fn((e) => e),
}));
describe('CollectionService', () => {
  let app: INestApplication;
  let collectionRepository: MockType<CollectionRepository>;
  let shareMemberRepository: MockType<Repository<ShareMember>>;
  let collectionIconRepository: MockType<Repository<CollectionIconEntity>>;
  let databaseService: DatabaseUtilitiesService;
  let collectionService: CollectionService;
  let deletedItemService: MockType<DeletedItemService>;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;
  let collectionQueueService: MockType<CollectionQueueService>;
  let settingService: MockType<SettingService>;
  let chimeService: ChimeChatService;
  let sieveEmailService: SieveEmailService;
  let httpClient: HttpService;
  let eventEmitter: EventEmitter2;
  let kanbanRepo: KanbanRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionService,
        SieveEmailService,
        ChimeChatService,
        {
          // how you provide the injection token in a test instance
          provide: CollectionRepository,
          useFactory: repositoryMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(ShareMember),
          useFactory: repositoryMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(CollectionIconEntity),
          useFactory: repositoryCollectionIconMockFactory,
        },
        {
          provide: RuleRepository,
          useFactory: repositoryMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: DeletedItemService,
          useFactory: deletedItemServiceMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: DatabaseUtilitiesService,
          useValue: {
            getAll: jest.fn((e) => e),
          },
        },
        {
          // how you provide the injection token in a test instance
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedQueueServiceMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: CollectionQueueService,
          useFactory: collectionQueueServiceMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: SettingService,
          useFactory: settingServiceMockFactory,
        },
        {
          provide: HttpService,
          useValue: spyHttpClient
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn((e) => e),
            emitAsync: jest.fn((e) => e),
          },
        },
        {
          provide: KanbanRepository,
          useValue: kanbanRepositoryMockFactory
        }
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    collectionRepository = module.get(CollectionRepository);
    shareMemberRepository = module.get(getRepositoryToken(ShareMember));
    collectionIconRepository = module.get(getRepositoryToken(CollectionIconEntity));
    databaseService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    deletedItemService = module.get(DeletedItemService);
    collectionService = module.get<CollectionService>(CollectionService);
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    collectionQueueService = module.get(CollectionQueueService);
    settingService = module.get(SettingService);
    sieveEmailService = module.get<SieveEmailService>(SieveEmailService);
    chimeService = module.get<ChimeChatService>(ChimeChatService);
    httpClient = module.get<HttpService>(HttpService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    kanbanRepo = module.get<KanbanRepository>(KanbanRepository);
  });

  it('should be defined', () => {
    expect(collectionService).toBeDefined();
  });

  it('findOneById should be defined', async () => {
    const entity = { id: 1, name: "Quang" }
    collectionRepository.findOne = jest.fn().mockResolvedValue(entity);
    const rs = await collectionService.findOneById(1, 1, { fields: ['id', 'name'] });
    expect(rs).toEqual(entity);
  });

  it('findOneWithCondition should be defined', async () => {
    const entity = { id: 1, name: "Quang" }
    collectionRepository.findOne = jest.fn().mockResolvedValue(entity);
    const rs = await collectionService.findOneWithCondition({ fields: ['id', 'name'] });
    expect(rs).toEqual(entity);
  });

  it('findByIds should be defined', async () => {
    collectionRepository.find = jest.fn().mockResolvedValue(true);
    await collectionService.findByIds(1, [1, 2, 3], { fields: ['id', 'name'] });
    expect(collectionRepository.find).toHaveBeenCalledTimes(1);
  });

  it('checkParentCollectionShare should be defined', async () => {
    const { valid, errors } = collectionService.checkParentCollectionShare(checkParentCollectionSharePayload);
    expect(valid).toHaveLength(3);
    expect(errors[0].message).toEqual(CollectionResponseMessage.UNABLE_TO_SET_PARENT);
  });

  it('checkDuplicateCollNamePayload should be defined', async () => {
    const { valid, errors } = collectionService.checkDuplicateCollNamePayload(checkParentCollectionSharePayload);
    expect(valid).toHaveLength(3);
    expect(errors[0].message).toEqual(CollectionResponseMessage.DUPLICATED_COLLECTION_NAME);
  });

  it('checkDbLevelAndCreateEntity should be error with null calendar_uri ', async () => {
    const param = checkDbLevelAndCreateEntity[1];
    collectionService['checkValidLevelCollection'] = jest.fn().mockResolvedValue({
      result: true,
      error: [],
    });
    const rs = await collectionService.checkDbLevelAndCreateEntity(user, param, 123);
    expect(rs.calendar_uri).not.toBeNull();
  });

  it('updateWithReturn should be return Parent collection is not found', async () => {
    const param = createSampleUpdateCollectionParam();
    const userId = createSampleUserId();
    const entities: Partial<Collection>[] = [
      param,
    ];
    const updated_date = 123456;
    const setting = <GlobalSetting>{};
    try {
      await collectionService.updateWithReturn(entities, userId, param, setting, updated_date);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateCollectionParamError);
      expect(err.message).toEqual(CollectionResponseMessage.PARENT_NOT_FOUND);
    }
  });

  it('updateWithReturn should be return Collection not found', async () => {
    const param = createSampleUpdateCollectionParam();
    const userId = createSampleUserId();
    const entities: Partial<Collection>[] = [
      param,
    ];
    const updated_date = 123456;
    const setting = <GlobalSetting>{};
    try {
      collectionService['checkValidLevelCollectionUpdate'] = jest.fn().mockResolvedValue({
        result: true,
      });
      await collectionService.updateWithReturn(entities, userId, param, setting, updated_date);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateCollectionParamError);
      expect(err.message).toEqual(CollectionResponseMessage.COLLECTION_NOT_FOUND);
    }
  });

  it('checkValidLevelCollection should be break', async () => {
    const userId = createSampleUserId();
    const { result } = await collectionService['checkValidLevelCollection'](userId, 0);
    expect(collectionRepository.findOne).toHaveBeenCalledTimes(0);
    expect(result).toBe(true);
  });

  it('should checkValidLevelCollection false - exceed 7 levels', async () => {
    const userId = createSampleUserId();
    const entity = createSampleCollectionEntity();
    entity.parent_id = 0;
    entity.user_id = userId;
    const resolvedValues = [entity];
    for (let i = 0; i < 6; i++) {
      const tEntity = createSampleCollectionEntity();
      tEntity.parent_id = resolvedValues[resolvedValues.length - 1].id;
      tEntity.user_id = resolvedValues[resolvedValues.length - 1].user_id;
      resolvedValues.push(tEntity);
    }
    const curParentId = resolvedValues[resolvedValues.length - 1].id;
    let mock = jest.fn().mockResolvedValueOnce(resolvedValues[resolvedValues.length - 1]);
    for (let i = 5; i >= 0; i--) {
      mock = mock.mockResolvedValueOnce(resolvedValues[i]);
    }
    collectionRepository.findOne = mock;

    const { result, error } = await collectionService['checkValidLevelCollection'](
      userId,
      curParentId,
    );

    expect(collectionRepository.findOne).toHaveBeenCalledTimes(7);
    for (let i = 0; i < resolvedValues.length; i++) {
      expect(collectionRepository.findOne).toHaveBeenNthCalledWith(i + 1, {
        select: ['user_id', 'parent_id', 'type', 'is_trashed'],
        where: {
          id: resolvedValues[resolvedValues.length - 1 - i].id,
        },
      });
    }
    expect(result).toBe(false);
    expect(error).toBe(CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED);
  });

  it('should getUniqueCalendarUidCollection', async () => {
    const params = [createSampleCollectionParam(), createSampleCollectionParam()];
    params[1].calendar_uri = params[0].calendar_uri;
    const { valid, errors: duplicated } = collectionService['getUniqueCalendarUidCollection'](params);
    expect(valid).toHaveLength(1);
    expect(duplicated).toHaveLength(1);
    valid.forEach((item, idx) => {
      expect(item.name).toEqual(params[idx].name);
      expect(item.color).toEqual(params[idx].color);
      expect(item.calendar_uri).toEqual(params[idx].calendar_uri);
      expect(item.parent_id).toEqual(params[idx].parent_id);
      expect(item.type).toEqual(params[idx].type);
      if (params[idx].alerts) {
        expect(item.alerts).toHaveLength(1);
        expect(item.alerts[0].description).toEqual(params[idx].alerts[0].description);
        expect(item.alerts[0].uid).toEqual(params[idx].alerts[0].uid);
        expect(item.alerts[0].trigger).toMatchObject(params[idx].alerts[0].trigger);
      }
    });
  });

  it('findAllRecursive should be return level 0', async () => {
    const userId = createSampleUserId();
    collectionRepository.findAllOnMaster = jest.fn().mockResolvedValue([]);
    const result = await collectionService['findAllRecursive'](1, userId, 2, 3, 0);
    expect(result).toEqual(0);
  });

  it('should findAll return collection array', async () => {
    const req = {
      page_size: 2,
    } as BaseGetDTO;
    const entities: Partial<Collection>[] = [
      createSampleCollectionEntity(),
      createSampleCollectionEntity(),
    ];
    const userId = createSampleUserId();
    collectionRepository.find.mockReturnValue(entities);
    databaseService.getAll = jest.fn().mockResolvedValue(entities);

    const result = await collectionService.getAllFiles(req, userId);

    expect(databaseService.getAll).toBeCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data_del).toBeUndefined();
    result.data.forEach((e, idx) => {
      expect(e.id).toEqual(entities[idx].id);
      expect(e.name).toEqual(entities[idx].name);
      expect(e.color).toEqual(entities[idx].color);
      expect(e.calendar_uri).toEqual(entities[idx].calendar_uri);
      expect(e.parent_id).toEqual(entities[idx].parent_id);
      expect(e.created_date).toEqual(entities[idx].created_date);
      expect(e.updated_date).toEqual(entities[idx].updated_date);
      expect(e.type).toEqual(entities[idx].type);
      if (entities[idx].alerts) {
        expect(e.alerts).toHaveLength(1);
        expect(e.alerts[0].description).toEqual(entities[idx].alerts[0].description);
        expect(e.alerts[0].uid).toEqual(entities[idx].alerts[0].uid);
        expect(e.alerts[0].trigger).toMatchObject(entities[idx].alerts[0].trigger);
      }
    });
  });

  it('should findAll return collection array with data_del', async () => {
    const entities: Partial<Collection>[] = [
      createSampleCollectionEntity(),
      createSampleCollectionEntity(),
    ];
    const userId = createSampleUserId();
    const filter: GetAllFilter<Collection> = {
      page_size: 2,
      has_del: 1,
      modified_gte: 1621327600.089,
      modified_lt: 1621337600.089,
      ids: [1, 2],
      fields: ['name', 'color'],
    };
    const deletedItemEntities: Partial<DeletedItem>[] = [
      {
        item_id: 1,
        is_recovery: 0,
      },
      {
        item_id: 2,
        is_recovery: 0,
      },
    ];

    collectionRepository.find.mockReturnValue(entities);

    databaseService.getAll = jest.fn().mockResolvedValue(entities);
    deletedItemService.findAll = jest.fn().mockResolvedValue(deletedItemEntities);

    const { data, data_del } = await collectionService.getAllFiles(filter, userId);

    expect(databaseService.getAll).toBeCalledTimes(1);
    expect(databaseService.getAll).toHaveBeenCalledWith({
      userId,
      filter: {
        ...filter,
        remove_deleted: true,
      },
      repository: collectionRepository,
    });
    expect(deletedItemService.findAll).toBeCalledTimes(1);
    expect(data).toHaveLength(2);
    expect(data_del).toHaveLength(2);
    data.forEach((e, idx) => {
      expect(e.id).toEqual(entities[idx].id);
      expect(e.name).toEqual(entities[idx].name);
      expect(e.color).toEqual(entities[idx].color);
      expect(e.calendar_uri).toEqual(entities[idx].calendar_uri);
      expect(e.parent_id).toEqual(entities[idx].parent_id);
      expect(e.created_date).toEqual(entities[idx].created_date);
      expect(e.updated_date).toEqual(entities[idx].updated_date);
      expect(e.type).toEqual(entities[idx].type);
      if (entities[idx].alerts) {
        expect(e.alerts).toHaveLength(1);
        expect(e.alerts[0].description).toEqual(entities[idx].alerts[0].description);
        expect(e.alerts[0].uid).toEqual(entities[idx].alerts[0].uid);
        expect(e.alerts[0].trigger).toMatchObject(entities[idx].alerts[0].trigger);
      }
    });
    data_del.forEach((item, idx) => {
      expect(item.item_id).toEqual(deletedItemEntities[idx].item_id);
      expect(item.is_recovery).toEqual(deletedItemEntities[idx].is_recovery);
    });
  });

  it('should create collection', async () => {
    const param = createSampleCollectionParam();
    const entity = createSampleCollectionEntity({ param });
    const userId = createSampleUserId();

    collectionRepository.create.mockReturnValue(entity);
    // collectionRepository.insert.mockReturnValue({
    //   ...entity,
    //   raw: { insertId: entity.id }
    // });
    collectionRepository.findOne.mockReturnValue({ ...entity, ...param });
    collectionService['checkValidLevelCollection'] = jest.fn().mockResolvedValue({
      result: true,
    });
    // collectionService['checkValidNameSameLevelCollection'] = jest.fn().mockResolvedValue(true);
    // collectionService['checkDuplicateCalendarUriCollection'] = jest.fn().mockResolvedValue(true);

    const createdDate = 0;
    const result = await collectionService.checkDbLevelAndCreateEntity(user, param, createdDate);

    expect(collectionRepository.create).toBeCalledTimes(1);
    // expect(collectionRepository.insert).toBeCalledTimes(1);
    // expect(collectionRepository.insert).toBeCalledWith(entity);
    expect(result).not.toBeNull();
    expect(result.id).toEqual(entity.id);
    expect(result.name).toEqual(param.name);
    expect(result.color).toEqual(param.color);
    expect(result.parent_id).toEqual(param.parent_id);
    expect(result.due_date).toEqual(param.due_date);
    expect(result.flag).toEqual(param.flag);
    expect(result.is_hide).toEqual(param.is_hide);
    expect(result.alerts).toEqual(param.alerts);
    expect(result.calendar_uri).toEqual(param.calendar_uri);
    expect(result.kanban_mode).toEqual(entity.kanban_mode);
    expect(result.created_date).toEqual(entity.created_date);
    expect(result.updated_date).toEqual(entity.updated_date);
  });

  it('should createSystemKanbanAndMergeResult with error ', async () => {
    const param: Collection = createSampleCollectionParam() as Collection;
    const userId = createSampleUserId();
    shareMemberRepository.manager['query'].mockReturnValue([0]);
    kanbanRepo.generateSystemKanban = jest.fn().mockReturnValue(0);
    const result = await collectionService['createSystemKanbanAndMergeResult']([param], [], {
      ...fakeReq,
      user: {
        id: createSampleUserId(),
        userId: createSampleUserId(),
        email: '',
        appId: '',
        deviceUid: '',
        userAgent: '',
        token: ''
      }
    });
    expect(result.itemFail).not.toBeNull();
    expect(result.itemFail).toHaveLength(1);
  });

  it('should checkDuplicateCollectionIdUpdate with error ', async () => {
    const param = createSampleUpdateCollectionParam();

    const result = await collectionService['checkDuplicateCollectionIdUpdate']([param, param]);
    expect(result.errors).not.toBeNull();
    expect(result.errors).toHaveLength(1);
  });

  it('should checkParentCollectionUpdate with error ', async () => {
    const param = createSampleUpdateCollectionParam();
    const param2 = createSampleUpdateCollectionParam();
    const e1: Collection = createSampleCollectionEntity({
      param,
      type: COLLECTION_TYPE.SHARE_COLLECTION
    }) as Collection;
    const e2: Collection = createSampleCollectionEntity({
      param: param2
    }) as Collection;
    param2.parent_id = undefined;

    const result = await collectionService['checkParentCollectionUpdate']([param, param2], [e1, e2]);
    expect(result.errors).not.toBeNull();
    expect(result.errors).toHaveLength(1);
  });

  it('should checkDupNameOrCalendarDb with error ', async () => {
    const param = createSampleCollectionParam();
    const param1 = createSampleCollectionParam();
    const param2 = createSampleCollectionParam();
    const userId = createSampleUserId();

    collectionRepository.find.mockReturnValue([param, { ...param2, name: 'test' }]);
    param1.parent_id = undefined;
    const result = await collectionService['checkDupNameOrCalendarDb'](userId, [param, param1, param2]);
    expect(result.errors).not.toBeNull();
    expect(result.errors).toHaveLength(2);
  });

  it('should checkValidLevelCollectionUpdate with error ', async () => {
    const param = createSampleCollectionParam();
    const e1: Collection = createSampleCollectionEntity({
      param,
      type: COLLECTION_TYPE.SHARE_COLLECTION
    }) as Collection;
    const userId = createSampleUserId();

    e1.user_id = userId;
    collectionRepository.findOneOnMaster.mockReturnValue(e1);
    collectionRepository.findAllOnMaster.mockReturnValue({ ...e1, parent_id: 5 });
    const result = await collectionService['checkValidLevelCollectionUpdate'](userId, 1, 2);
    expect(result.result).not.toBeNull();
    expect(result.result).toEqual(false);
    const e2: Collection = createSampleCollectionEntity({
      param
    }) as Collection;
    e2.user_id = userId;
    collectionRepository.findOneOnMaster.mockReturnValue({ ...e2, parent_id: 0 });
    jest.spyOn(CollectionService.prototype as any, 'findAllRecursive').mockReturnValue(9);
    const result2 = await collectionService['checkValidLevelCollectionUpdate'](userId, 1, 2);
    expect(result2.result).not.toBeNull();
    expect(result2.result).toEqual(false);
    jest.spyOn(CollectionService.prototype as any, 'findAllRecursive').mockReturnValue(2);
    const result3 = await collectionService['checkValidLevelCollectionUpdate'](userId, 1, 2);
    expect(result3.result).not.toBeNull();
    expect(result3.result).toEqual(true);
  });


  it('create collection has checking level error', async () => {
    const entity: Partial<Collection> = {
      id: 1,
      name: 'General',
      color: '#ac725e',
      calendar_uri: '2906e564-a40d-11eb-b55c-070f99e81ded',
      parent_id: 0,
      created_date: 0,
      updated_date: 0,
      type: CollectionType.UserDefined,
      due_date: 0,
      flag: 0,
      is_hide: 0,
      alerts: null,
      recent_time: 0,
      kanban_mode: 0,
    };
    const param: CreateCollectionParam = {
      name: 'General',
      color: '#ac725e',
      calendar_uri: '2906e564-a40d-11eb-b55c-070f99e81ded',
      type: CollectionType.UserDefined,
      parent_id: 1,
      due_date: 0,
      flag: 0,
      is_hide: 0,
      alerts: null,
      kanban_mode: 0,
      ref: 1234,
      is_trashed: 0,
      icon: 'ic_symbols_70'
    };
    const error = new CollectionParamError({
      ...CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED,
      attributes: {
        parent_id: param.parent_id,
        ref: param.ref,
      },
    });

    collectionRepository.create.mockReturnValue(entity);
    collectionRepository.findOne.mockReturnValue({ ...entity, ...param });
    collectionService['checkValidLevelCollection'] = jest.fn().mockResolvedValue({
      result: false,
      error: CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED,
    });
    // collectionService['checkValidNameSameLevelCollection'] = jest.fn().mockResolvedValue(true);
    // collectionService['checkDuplicateCalendarUriCollection'] = jest.fn().mockResolvedValue(true);

    try {
      await collectionService.checkDbLevelAndCreateEntity(user, param, 123);
    } catch (err) {
      expect(err).toBeInstanceOf(CollectionParamError);
      // expect(err).toStrictEqual(error);
    }

    expect(collectionService['checkValidLevelCollection']).toBeCalledTimes(1);
    expect(collectionRepository.create).toBeCalledTimes(0);
    expect(collectionRepository.save).toBeCalledTimes(0);
  });

  it('create collection has invalid name at same level error', async () => {
    const entity: Partial<Collection> = {
      id: 1,
      name: 'General',
      color: '#ac725e',
      calendar_uri: '2906e564-a40d-11eb-b55c-070f99e81ded',
      parent_id: 0,
      created_date: 0,
      updated_date: 0,
      type: CollectionType.UserDefined,
      due_date: 0,
      flag: 0,
      is_hide: 0,
      alerts: null,
      recent_time: 0,
      kanban_mode: 0,
    };
    const param: CreateCollectionParam = {
      name: 'General',
      color: '#ac725e',
      calendar_uri: '2906e564-a40d-11eb-b55c-070f99e81ded',
      type: CollectionType.UserDefined,
      parent_id: 1,
      due_date: 0,
      flag: 0,
      is_hide: 0,
      alerts: null,
      kanban_mode: 0,
      ref: 1234,
      icon: 'ic_symbols_70'
    };
    const error = new CollectionParamError({
      ...CollectionErrorDict.DUPLICATED_COLLECTION_NAME,
      attributes: {
        parent_id: param.parent_id,
        name: param.name,
        ref: param.ref,
      },
    });

    collectionRepository.create.mockReturnValue(entity);
    collectionRepository.findOne.mockReturnValue({ ...entity, ...param });
    collectionService['checkValidLevelCollection'] = jest.fn().mockResolvedValue({
      result: true,
    });
    // collectionService['checkValidNameSameLevelCollection'] = jest.fn().mockResolvedValue(false);
    // collectionService['checkDuplicateCalendarUriCollection'] = jest.fn().mockResolvedValue(true);

    try {
      await collectionService.checkDbLevelAndCreateEntity(user, param, 123);
    } catch (err) {
      // expect(err).toBeInstanceOf(CollectionParamError);
      // expect(err).toStrictEqual(error);
    }

    expect(collectionService['checkValidLevelCollection']).toBeCalledTimes(1);
    // expect(collectionService['checkValidNameSameLevelCollection']).toBeCalledTimes(1);
    // expect(collectionRepository.create).toBeCalledTimes(0);
    // expect(collectionRepository.save).toBeCalledTimes(0);
  });

  it('create collection has duplicated calendar uri error', async () => {
    const entity: Partial<Collection> = {
      id: 1,
      name: 'General',
      color: '#ac725e',
      calendar_uri: '2906e564-a40d-11eb-b55c-070f99e81ded',
      parent_id: 0,
      created_date: 0,
      updated_date: 0,
      type: CollectionType.UserDefined,
      due_date: 0,
      flag: 0,
      is_hide: 0,
      alerts: null,
      recent_time: 0,
      kanban_mode: 0,
    };
    const param: CreateCollectionParam = {
      name: 'General',
      color: '#ac725e',
      calendar_uri: '2906e564-a40d-11eb-b55c-070f99e81ded',
      type: CollectionType.UserDefined,
      parent_id: 1,
      due_date: 0,
      flag: 0,
      is_hide: 0,
      alerts: null,
      kanban_mode: 0,
      icon: 'ic_symbols_70',
      ref: 1234,
    };
    const error = new CollectionParamError({
      ...CollectionErrorDict.CALID_ALREADY_EXISTS,
      attributes: {
        calendar_uri: param.calendar_uri,
        ref: param.ref,
      },
    });

    collectionRepository.create.mockReturnValue(entity);
    collectionRepository.findOne.mockReturnValue({ ...entity, ...param });
    collectionService['checkValidLevelCollection'] = jest.fn().mockResolvedValue({
      result: true,
    });

    try {
      await collectionService.checkDbLevelAndCreateEntity(user, param, 123);
    } catch (err) {
      // expect(err).toBeInstanceOf(CollectionParamError);
      // expect(err).toStrictEqual(error);
    }

    expect(collectionService['checkValidLevelCollection']).toBeCalledTimes(1);
    // expect(collectionService['checkValidNameSameLevelCollection']).toBeCalledTimes(1);
    // expect(collectionService['checkDuplicateCalendarUriCollection']).toBeCalledTimes(1);
    // expect(collectionRepository.create).toBeCalledTimes(0);
    // expect(collectionRepository.save).toBeCalledTimes(0);
  });

  it('create batch collection has duplicated calendar uri error', async () => {
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };
    const entities: Partial<Collection>[] = [
      {
        id: 1,
        name: 'General',
        color: '#ac725e',
        calendar_uri: '2906e564-a40d-11eb-b55c-070f99e81ded',
        parent_id: 0,
        created_date: 0,
        updated_date: 0,
        type: CollectionType.UserDefined,
        due_date: 0,
        flag: 0,
        is_hide: 0,
        alerts: null,
        recent_time: 0,
        kanban_mode: 0,
      },
      {
        id: 2,
        name: 'Home',
        color: '#d06b64',
        calendar_uri: '47d34f40-6871-415a-bb61-06de87b89b98',
        parent_id: 0,
        created_date: 0,
        updated_date: 0,
        type: CollectionType.UserDefined,
        due_date: 0,
        flag: 0,
        is_hide: 0,
        alerts: null,
        recent_time: 0,
        kanban_mode: 0,
      },
      {
        id: 3,
        name: 'Favorite',
        color: '#ac725e',
        calendar_uri: '3452e01d-66ff-4c4c-9d24-45606385d46f',
        parent_id: 0,
        created_date: 0,
        updated_date: 0,
        type: CollectionType.UserDefined,
        due_date: 0,
        flag: 0,
        is_hide: 0,
        alerts: null,
        recent_time: 0,
        kanban_mode: 0,
      },
      {
        id: 4,
        name: 'Temp',
        color: '#ac725e',
        calendar_uri: '20f0aa5b-8dad-442c-aae2-d4c8aabcb1b6',
        type: CollectionType.UserDefined,
        parent_id: 0,
        created_date: 0,
        updated_date: 0,
        due_date: 0,
        flag: 0,
        is_hide: 0,
        alerts: null,
        kanban_mode: 0,
      },
    ];
    const params: CreateCollectionParam[] = [
      {
        name: 'General',
        color: '#d06b64',
        calendar_uri: '2906e564-a40d-11eb-b55c-070f99e81ded',
        type: CollectionType.UserDefined,
        parent_id: 0,
        due_date: 0,
        flag: 0,
        is_hide: 0,
        alerts: null,
        icon: 'ic_symbols_70',
        kanban_mode: 0,
      },
      {
        name: 'Home',
        color: '#ac725e',
        calendar_uri: '47d34f40-6871-415a-bb61-06de87b89b98',
        type: CollectionType.UserDefined,
        parent_id: 0,
        due_date: 0,
        flag: 0,
        is_hide: 0,
        alerts: null,
        kanban_mode: 0,
        icon: 'ic_symbols_70',
      },
      {
        name: 'Favorite',
        color: '#ac725e',
        calendar_uri: '3452e01d-66ff-4c4c-9d24-45606385d46f',
        type: CollectionType.UserDefined,
        parent_id: 0,
        due_date: 0,
        flag: 0,
        is_hide: 0,
        alerts: null,
        kanban_mode: 0,
        icon: 'ic_symbols_70',
      },
      {
        name: 'Temp',
        color: '#ac725e',
        calendar_uri: '20f0aa5b-8dad-442c-aae2-d4c8aabcb1b6',
        type: CollectionType.UserDefined,
        parent_id: 0,
        due_date: 0,
        flag: 0,
        is_hide: 0,
        alerts: null,
        kanban_mode: 0,
        icon: 'ic_symbols_70',
      },
    ];
    const paramErrors = [
      new CollectionParamError({
        ...CollectionErrorDict.DUPLICATED_CALID_BATCH,
        attributes: {
          parent_id: params[2].parent_id,
          ref: params[2].ref,
        },
      }),
      new CollectionParamError({
        ...CollectionErrorDict.DUPLICATED_CALID_BATCH,
        attributes: {
          parent_id: params[3].parent_id,
          ref: params[3].ref,
        },
      }),
    ];

    collectionService['getUniqueCalendarUidCollection'] = jest.fn().mockReturnValue({
      valid: [params[0], params[1]],
      errors: [paramErrors[0], paramErrors[1]],
    });
    collectionService.checkDbLevelAndCreateEntity = jest
      .fn()
      .mockResolvedValueOnce(entities[0])
      .mockResolvedValueOnce(entities[1])
      .mockResolvedValueOnce(entities[2])
      .mockResolvedValueOnce(entities[3]);

    kanbanRepo.generateSystemKanban = jest.fn().mockReturnValue(1);

    const { created, errors } = await collectionService.createBatchCollections(params, fakeReq);

    expect(collectionService.checkDbLevelAndCreateEntity).toBeCalledTimes(2);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    // expect(apiLastModifiedQueueService.addJob).toHaveBeenCalledWith({
    //   apiName: ApiLastModifiedName.COLLECTION,
    //   userId: 1,
    //   updatedDate: getCreatedDate()
    // });
    expect(created).toHaveLength(2);
    expect(errors).toHaveLength(2);
    created.forEach((item, idx) => {
      expect(item.id).toEqual(entities[idx].id);
      expect(item.name).toEqual(entities[idx].name);
      expect(item.color).toEqual(params[idx].color);
      expect(item.calendar_uri).toEqual(entities[idx].calendar_uri);
      expect(item.parent_id).toEqual(entities[idx].parent_id);
      expect(item.created_date).toEqual(entities[idx].created_date);
      expect(item.updated_date).toEqual(entities[idx].updated_date);
      expect(item.type).toEqual(entities[idx].type);
      if (entities[idx].alerts) {
        expect(item.alerts).toHaveLength(1);
        expect(item.alerts[0].description).toEqual(entities[idx].alerts[0].description);
        expect(item.alerts[0].uid).toEqual(entities[idx].alerts[0].uid);
        expect(item.alerts[0].trigger).toMatchObject(entities[idx].alerts[0].trigger);
      }
    });
    errors.forEach((item, idx) => {
      expect(item).toBeInstanceOf(CollectionParamError);
      expect(item).toStrictEqual(errors[idx]);
    });
  });

  it('should batch create collections', async () => {
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };
    const params: CreateCollectionParam[] = [
      createSampleCollectionParam(),
      createSampleCollectionParam(),
    ];
    const entities: Partial<Collection>[] = [
      { ...createSampleCollectionEntity({ param: params[0] }), ...{ id: 0 } },
      { ...createSampleCollectionEntity({ param: params[1] }), ...{ id: 1 } },
    ];
    const userId = createSampleUserId();

    collectionService['getUniqueCalendarUidCollection'] = jest.fn().mockReturnValue({
      valid: params,
      errors: [],
    });
    const collectionService_create = jest.fn();
    for (const entity of entities) {
      collectionService_create.mockResolvedValueOnce(entity);
    }
    collectionService.checkDbLevelAndCreateEntity = collectionService_create;

    const { created, errors } = await collectionService.createBatchCollections(params, fakeReq);

    expect(collectionService.checkDbLevelAndCreateEntity).toBeCalledTimes(2);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    expect(created).toHaveLength(2);
    expect(errors).toHaveLength(0);
    created.forEach((item, idx) => {
      expect(item.id).toEqual((entities[idx] as any).id);
      expect(item.name).toEqual(entities[idx].name);
      expect(item.color).toEqual(entities[idx].color);
      expect(item.calendar_uri).toEqual(entities[idx].calendar_uri);
      expect(item.parent_id).toEqual(entities[idx].parent_id);
      expect(item.created_date).toEqual(entities[idx].created_date);
      expect(item.updated_date).toEqual(entities[idx].updated_date);
      expect(item.type).toEqual(entities[idx].type);
      if (entities[idx].alerts) {
        expect(item.alerts).toHaveLength(1);
        expect(item.alerts[0].description).toEqual(entities[idx].alerts[0].description);
        expect(item.alerts[0].uid).toEqual(entities[idx].alerts[0].uid);
        expect(item.alerts[0].trigger).toMatchObject(entities[idx].alerts[0].trigger);
      }
    });
  });

  it('should batch create collections error icon', async () => {
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };
    const params: CreateCollectionParam[] = [
      createSampleCollectionParam(),
      createSampleCollectionParam(),
    ];
    params[0].icon = 'icon0';
    params[1].icon = 'icon1';
    const entities: Partial<Collection>[] = [
      { ...createSampleCollectionEntity({ param: params[0] }), ...{ id: 0 } },
      { ...createSampleCollectionEntity({ param: params[1] }), ...{ id: 1 } },
    ];
    const userId = createSampleUserId();

    collectionService['getUniqueCalendarUidCollection'] = jest.fn().mockReturnValue({
      valid: params,
      errors: [],
    });
    const collectionService_create = jest.fn();
    for (const entity of entities) {
      collectionService_create.mockResolvedValueOnce(entity);
    }
    collectionService.checkDbLevelAndCreateEntity = collectionService_create;
    const { created, errors } = await collectionService.createBatchCollections(params, fakeReq);

    expect(collectionService.checkDbLevelAndCreateEntity).toBeCalledTimes(2);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    expect(created).toHaveLength(2);
    expect(errors).toHaveLength(0);
    created.forEach((item, idx) => {
      expect(item.id).toEqual((entities[idx] as any).id);
      expect(item.name).toEqual(entities[idx].name);
      expect(item.color).toEqual(entities[idx].color);
      expect(item.calendar_uri).toEqual(entities[idx].calendar_uri);
      expect(item.parent_id).toEqual(entities[idx].parent_id);
      expect(item.created_date).toEqual(entities[idx].created_date);
      expect(item.updated_date).toEqual(entities[idx].updated_date);
      expect(item.type).toEqual(entities[idx].type);
      if (entities[idx].alerts) {
        expect(item.alerts).toHaveLength(1);
        expect(item.alerts[0].description).toEqual(entities[idx].alerts[0].description);
        expect(item.alerts[0].uid).toEqual(entities[idx].alerts[0].uid);
        expect(item.alerts[0].trigger).toMatchObject(entities[idx].alerts[0].trigger);
      }
    });
    collectionIconRepository.findOne.mockReturnValue(false);
    await collectionService.createBatchCollections(params, fakeReq);

  });

  it('create batch collection has error when creating', async () => {
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };
    const entities: Partial<Collection>[] = [
      createSampleCollectionParam(),
      createSampleCollectionParam(),
      createSampleCollectionParam(),
      createSampleCollectionParam(),
    ];
    const params: CreateCollectionParam[] = [
      createSampleCollectionParam(),
      createSampleCollectionParam(),
      createSampleCollectionParam(),
      createSampleCollectionParam(),
    ];
    const queryFailedError = new QueryFailedError('some error', [], new Error());
    const paramErrors = [
      new CollectionParamError({
        ...CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED,
        attributes: {
          parent_id: params[2].parent_id,
          ref: params[2].ref,
        },
      }),
      new CollectionParamError({
        code: CollectionErrorCode.COLLECTION_ENTITY_ERROR,
        message: queryFailedError.message,
        attributes: params[3],
      }),
    ];

    collectionService['getUniqueCalendarUidCollection'] = jest.fn().mockReturnValue({
      valid: params,
      errors: [],
    });
    collectionService.checkDbLevelAndCreateEntity = jest
      .fn()
      .mockResolvedValueOnce({ ...entities[0], ...{ id: 0 } })
      .mockResolvedValueOnce({ ...entities[1], ...{ id: 1 } })
      .mockImplementationOnce(() => {
        throw paramErrors[0];
      })
      .mockImplementationOnce(() => {
        throw queryFailedError;
      });

    const { created, errors } = await collectionService.createBatchCollections(params, fakeReq);

    expect(collectionService.checkDbLevelAndCreateEntity).toBeCalledTimes(4);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    // expect(apiLastModifiedQueueService.addJob).toHaveBeenCalledWith({
    //   apiName: ApiLastModifiedName.COLLECTION,
    //   userId: 1,
    //   updatedDate: getCreatedDate()
    // });
    expect(created).toHaveLength(2);
    expect(errors).toHaveLength(2);

    created.forEach((item, idx) => {
      expect(item.name).toEqual(entities[idx].name);
      expect(item.color).toEqual(entities[idx].color);
      expect(item.calendar_uri).toEqual(entities[idx].calendar_uri);
      expect(item.parent_id).toEqual(entities[idx].parent_id);
      expect(item.created_date).toEqual(entities[idx].created_date);
      expect(item.updated_date).toEqual(entities[idx].updated_date);
      expect(item.type).toEqual(entities[idx].type);
      if (entities[idx].alerts) {
        expect(item.alerts).toHaveLength(1);
        expect(item.alerts[0].description).toEqual(entities[idx].alerts[0].description);
        expect(item.alerts[0].uid).toEqual(entities[idx].alerts[0].uid);
        expect(item.alerts[0].trigger).toMatchObject(entities[idx].alerts[0].trigger);
      }
    });
    errors.forEach((item, idx) => {
      expect(item).toBeInstanceOf(CollectionParamError);
      expect(item).toStrictEqual(errors[idx]);
    });
  });

  it('create batch collection has duplicated entry error when creating', async () => {
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };
    const entities: Partial<Collection>[] = [
      { ...createSampleCollectionParam(), ...{ id: 0 } },
      { ...createSampleCollectionParam(), ...{ id: 1 } },
      createSampleCollectionParam(),
      createSampleCollectionParam(),
    ];
    const params: CreateCollectionParam[] = [
      createSampleCollectionParam(),
      createSampleCollectionParam(),
      createSampleCollectionParam(),
      createSampleCollectionParam(),
    ];
    const queryFailedError = new QueryFailedError('some error', [], new Error());
    queryFailedError.message = 'ER_DUP_ENTRY';
    const paramErrors = [
      new CollectionParamError({
        ...CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED,
        attributes: {
          parent_id: params[2].parent_id,
          ref: params[2].ref,
        },
      }),
      new CollectionParamError({
        ...CollectionErrorDict.DUPLICATED_ENTRY,
        attributes: params[3],
      }),
    ];

    collectionService['getUniqueCalendarUidCollection'] = jest.fn().mockReturnValue({
      valid: params,
      errors: [],
    });
    collectionService.checkDbLevelAndCreateEntity = jest
      .fn()
      .mockResolvedValueOnce({ ...entities[0], ...{ id: 0 } })
      .mockResolvedValueOnce({ ...entities[1], ...{ id: 1 } })
      .mockImplementationOnce(() => {
        throw paramErrors[0];
      })
      .mockImplementationOnce(() => {
        throw queryFailedError;
      });

    const { created, errors } = await collectionService.createBatchCollections(params, fakeReq);

    expect(collectionService.checkDbLevelAndCreateEntity).toBeCalledTimes(4);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    expect(created).toHaveLength(2);
    expect(errors).toHaveLength(2);
    created.forEach((item, idx) => {
      expect(item.id).toEqual(entities[idx].id);
      expect(item.name).toEqual(entities[idx].name);
      expect(item.color).toEqual(entities[idx].color);
      expect(item.calendar_uri).toEqual(entities[idx].calendar_uri);
      expect(item.parent_id).toEqual(entities[idx].parent_id);
      expect(item.created_date).toEqual(entities[idx].created_date);
      expect(item.updated_date).toEqual(entities[idx].updated_date);
      expect(item.type).toEqual(entities[idx].type);
      if (entities[idx].alerts) {
        expect(item.alerts).toHaveLength(1);
        expect(item.alerts[0].description).toEqual(entities[idx].alerts[0].description);
        expect(item.alerts[0].uid).toEqual(entities[idx].alerts[0].uid);
        expect(item.alerts[0].trigger).toMatchObject(entities[idx].alerts[0].trigger);
      }
    });
    errors.forEach((item, idx) => {
      expect(item).toBeInstanceOf(CollectionParamError);
      expect(item).toStrictEqual(errors[idx]);
    });
  });

  it('create batch collection has unknown error', async () => {
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };
    const params = [createSampleCollectionParam(), createSampleCollectionParam()];
    const entities = [
      createSampleCollectionEntity({ param: params[0] }),
      createSampleCollectionEntity({ param: params[1] }),
    ];
    const userId = createSampleUserId();
    const unknownError = new Error('any error');

    collectionService['getUniqueCalendarUidCollection'] = jest.fn().mockReturnValue({
      valid: params,
      errors: [],
    });
    collectionService.checkDbLevelAndCreateEntity = jest
      .fn()
      .mockImplementationOnce(() => {
        throw unknownError;
      })
      .mockResolvedValueOnce(entities[0]);

    try {
      await collectionService.createBatchCollections(params, fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err).toStrictEqual(unknownError);
    }
    expect(collectionService.checkDbLevelAndCreateEntity).toBeCalledTimes(2);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
  });

  it('should update collection', async () => {
    const param = createSampleUpdateCollectionParam();
    const entity = createSampleCollectionEntity({ param });
    const userId = createSampleUserId();
    const entities: Partial<Collection>[] = [
      param,
    ];

    collectionRepository.create.mockReturnValue(entity);
    collectionRepository.update.mockReturnValue({
      affected: 1,
    });
    collectionRepository.findOne.mockReturnValue({ ...entity, ...param });
    collectionService['checkValidLevelCollectionUpdate'] = jest.fn().mockResolvedValue({
      result: true,
    });
    collectionService['checkValidNameSameLevelUpdateCollection'] = jest
      .fn()
      .mockResolvedValue(true);
    const updated_date = 123456;
    const setting = <GlobalSetting>{};
    const result = await collectionService.updateWithReturn(entities, userId, param, setting, updated_date);

    expect(collectionRepository.create).toBeCalledTimes(1);
    expect(collectionRepository.create).toBeCalledWith({
      ...param,
      updated_date,
    });
    expect(collectionRepository.update).toBeCalledTimes(1);
    expect(collectionRepository.update.mock.calls).toEqual([
      [
        {
          user_id: userId,
          id: param.id,
        },
        entity,
      ],
    ]);
    expect(result).not.toBeNull();
  });

  it('should update collection has level error', async () => {
    const param = createSampleUpdateCollectionParam();
    const entity = createSampleCollectionEntity({ param });
    const userId = createSampleUserId();
    const entities: Partial<Collection>[] = [
      param,
    ];
    const error = new UpdateCollectionParamError({
      ...CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED,
      attributes: {
        id: param.id,
        parent_id: param.parent_id,
      },
    });

    collectionRepository.create.mockReturnValue(entity);
    collectionRepository.update.mockReturnValue({
      affected: 1,
    });
    collectionRepository.findOneOnMaster.mockReturnValue({ ...entity, ...param, user_id: userId });
    collectionService['checkValidNameSameLevelUpdateCollection'] = jest
      .fn()
      .mockResolvedValue(true);
    const updated_date = 123456;
    try {
      const setting = <GlobalSetting>{};
      await collectionService.updateWithReturn(entities, userId, param, setting, updated_date);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateCollectionParamError);
    }

    expect(collectionRepository.create).toBeCalledTimes(0);
    expect(collectionRepository.update).toBeCalledTimes(0);
    expect(collectionRepository.findOneOnMaster).toBeCalledTimes(7);
  });

  it('should update collection has level error 2', async () => {
    const param = createSampleUpdateCollectionParam();
    param.parent_id = 0;
    const entity = createSampleCollectionEntity({ param });
    const userId = createSampleUserId();
    const error = new UpdateCollectionParamError({
      ...CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED,
      attributes: {
        id: param.id,
        parent_id: param.parent_id,
      },
    });

    collectionRepository.create.mockReturnValue(entity);
    collectionRepository.update.mockReturnValue({
      affected: 1,
    });
    collectionRepository.findOneOnMaster.mockReturnValue({ ...entity, ...param, user_id: userId });
    collectionRepository.findAllOnMaster.mockReturnValue([{ ...entity, ...param }]);
    collectionService['checkValidNameSameLevelUpdateCollection'] = jest
      .fn()
      .mockResolvedValue(true);
    try {
      await collectionService.updateBatchCollectionsWithReturn([param], fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateCollectionParamError);
      expect(err).toStrictEqual(error);
    }

    expect(collectionRepository.create).toBeCalledTimes(0);
    expect(collectionRepository.update).toBeCalledTimes(0);
  });

  it('should update collection has level error 2 icon', async () => {
    const param = createSampleUpdateCollectionParam();
    param.parent_id = 0;
    param.icon = 'icon';
    const entity = createSampleCollectionEntity({ param });
    const userId = createSampleUserId();
    const error = new UpdateCollectionParamError({
      ...CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED,
      attributes: {
        id: param.id,
        parent_id: param.parent_id,
      },
    });

    collectionRepository.create.mockReturnValue(entity);
    collectionRepository.update.mockReturnValue({
      affected: 1,
    });
    collectionRepository.findOneOnMaster.mockReturnValue({ ...entity, ...param, user_id: userId });
    collectionRepository.findAllOnMaster.mockReturnValue([{ ...entity, ...param }]);
    collectionService['checkValidNameSameLevelUpdateCollection'] = jest
      .fn()
      .mockResolvedValue(true);
    try {
      await collectionService.updateBatchCollectionsWithReturn([param], fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateCollectionParamError);
      expect(err).toStrictEqual(error);
    }
    collectionIconRepository.findOne.mockReturnValue(false);
    try {
      await collectionService.updateBatchCollectionsWithReturn([param], fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateCollectionParamError);
      expect(err).toStrictEqual(error);
    }

    expect(collectionRepository.create).toBeCalledTimes(0);
    expect(collectionRepository.update).toBeCalledTimes(0);
  });

  it('should batch update collections', async () => {
    const params = [createSampleUpdateCollectionParam(), createSampleUpdateCollectionParam()];
    const entities = [
      createSampleCollectionEntity({ param: params[0] }),
      createSampleCollectionEntity({ param: params[1] }),
    ];

    collectionService.updateWithReturn = jest
      .fn()
      .mockResolvedValueOnce(entities[0])
      .mockResolvedValueOnce(entities[1]);

    collectionRepository.find.mockReturnValue(entities);

    const { updated, errors } = await collectionService.updateBatchCollectionsWithReturn(
      params,
      fakeReq);

    expect(collectionService.updateWithReturn).toBeCalledTimes(2);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    expect(updated).toHaveLength(2);
    expect(errors).toHaveLength(0);

    updated.forEach((item, idx) => {
      expect(item.id).toEqual(entities[idx].id);
      expect(item.name).toEqual(entities[idx].name);
      expect(item.color).toEqual(entities[idx].color);
      expect(item.calendar_uri).toEqual(entities[idx].calendar_uri);
      expect(item.parent_id).toEqual(entities[idx].parent_id);
      expect(item.created_date).toEqual(entities[idx].created_date);
      expect(item.updated_date).toEqual(entities[idx].updated_date);
      expect(item.type).toEqual(entities[idx].type);
      if (entities[idx].alerts) {
        expect(item.alerts).toHaveLength(1);
        expect(item.alerts[0].description).toEqual(entities[idx].alerts[0].description);
        expect(item.alerts[0].uid).toEqual(entities[idx].alerts[0].uid);
        expect(item.alerts[0].trigger).toMatchObject(entities[idx].alerts[0].trigger);
      }
    });
  });

  it('should batch update collections share', async () => {
    const params = [createSampleUpdateCollectionParam(), createSampleUpdateCollectionParam()];
    params[0].parent_id = 0;
    const entities = [
      createSampleCollectionEntity({ param: params[0], type: CollectionType.SharedCollection }),
      createSampleCollectionEntity({ param: params[1] }),
    ];

    entities[0].type = 3;
    entities[0].parent_id = 0;
    collectionService.updateWithReturn = jest
      .fn()
      .mockResolvedValueOnce(entities[0])
      .mockResolvedValueOnce(entities[1]);

    collectionRepository.find.mockReturnValue(entities);
    shareMemberRepository.find.mockReturnValue(entities);

    const { updated, errors } = await collectionService.updateBatchCollectionsWithReturn(
      params,
      fakeReq);

    expect(collectionService.updateWithReturn).toBeCalledTimes(2);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(3);
    expect(updated).toHaveLength(2);
    expect(errors).toHaveLength(0);

    updated.forEach((item, idx) => {
      expect(item.id).toEqual(entities[idx].id);
      expect(item.name).toEqual(entities[idx].name);
      expect(item.color).toEqual(entities[idx].color);
      expect(item.calendar_uri).toEqual(entities[idx].calendar_uri);
      expect(item.parent_id).toEqual(entities[idx].parent_id);
      expect(item.created_date).toEqual(entities[idx].created_date);
      expect(item.updated_date).toEqual(entities[idx].updated_date);
      expect(item.type).toEqual(entities[idx].type);
      if (entities[idx].alerts) {
        expect(item.alerts).toHaveLength(1);
        expect(item.alerts[0].description).toEqual(entities[idx].alerts[0].description);
        expect(item.alerts[0].uid).toEqual(entities[idx].alerts[0].uid);
        expect(item.alerts[0].trigger).toMatchObject(entities[idx].alerts[0].trigger);
      }
    });
  });

  it('should update batch collection has error when updating', async () => {
    const params = [
      createSampleUpdateCollectionParam(),
      createSampleUpdateCollectionParam(),
      createSampleUpdateCollectionParam(),
      createSampleUpdateCollectionParam(),
    ];
    const entities = [
      createSampleCollectionEntity({ param: params[0] }),
      createSampleCollectionEntity({ param: params[1] }),
    ];
    const queryFailedError = new QueryFailedError('some error', [], new Error());
    const paramErrors = [
      new UpdateCollectionParamError({
        ...CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED,
        attributes: {
          parent_id: params[2].parent_id,
        },
      }),
      new UpdateCollectionParamError({
        code: CollectionErrorCode.COLLECTION_ENTITY_ERROR,
        message: queryFailedError.message,
        attributes: params[3],
      }),
    ];

    collectionService['getUniqueCalendarUidCollection'] = jest.fn().mockReturnValue({
      valid: params,
      errors: [],
    });

    collectionService.updateWithReturn = jest
      .fn()
      .mockResolvedValueOnce(entities[0])
      .mockResolvedValueOnce(entities[1])
      .mockImplementationOnce(() => {
        throw paramErrors[0];
      })
      .mockImplementationOnce(() => {
        throw queryFailedError;
      });

    collectionRepository.find.mockReturnValue(entities);
    const { updated, errors } = await collectionService.updateBatchCollectionsWithReturn(
      params,
      fakeReq);

    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    expect(updated).toHaveLength(2);
    updated.forEach((item, idx) => {
      expect(item.id).toEqual(entities[idx].id);
      expect(item.name).toEqual(entities[idx].name);
      expect(item.color).toEqual(entities[idx].color);
      expect(item.calendar_uri).toEqual(entities[idx].calendar_uri);
      expect(item.parent_id).toEqual(entities[idx].parent_id);
      expect(item.created_date).toEqual(entities[idx].created_date);
      expect(item.updated_date).toEqual(entities[idx].updated_date);
      expect(item.type).toEqual(entities[idx].type);
      if (entities[idx].alerts) {
        expect(item.alerts).toHaveLength(1);
        expect(item.alerts[0].description).toEqual(entities[idx].alerts[0].description);
        expect(item.alerts[0].uid).toEqual(entities[idx].alerts[0].uid);
        expect(item.alerts[0].trigger).toMatchObject(entities[idx].alerts[0].trigger);
      }
    });
    errors.forEach((item, idx) => {
      expect(item).toBeInstanceOf(UpdateCollectionParamError);
      expect(item).toStrictEqual(errors[idx]);
    });
  });

  it('should update batch collection has unknown error when updating', async () => {
    const params = [createSampleUpdateCollectionParam(), createSampleUpdateCollectionParam()];
    const entities = [
      createSampleCollectionEntity({ param: params[0] }),
      createSampleCollectionEntity({ param: params[1] }),
    ];
    const unknownError = new Error('any error');

    collectionService.updateWithReturn = jest
      .fn()
      .mockImplementationOnce(() => {
        throw unknownError;
      })
      .mockResolvedValueOnce(entities[0].id);

    try {
      await collectionService.updateBatchCollectionsWithReturn(params, fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err).toStrictEqual(unknownError);
    }

    // expect(collectionService.updateWithReturn).toBeCalledTimes(2);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
  });

  it('should update collection error with checkDupName4UpdateDb function', async () => {
    const param = createSampleUpdateCollectionParam();
    const entity = createSampleCollectionEntity({ param });
    const error = new UpdateCollectionParamError({
      ...CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED,
      attributes: {
        id: param.id,
        parent_id: param.parent_id,
      },
    });

    collectionRepository.create.mockReturnValue(entity);
    collectionRepository.update.mockReturnValue({
      affected: 1,
    });
    collectionRepository.findOneOnMaster.mockReturnValue(false);

    try {
      await collectionService.updateBatchCollectionsWithReturn([param], fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateCollectionParamError);
      expect(err).toStrictEqual(error);
    }
    expect(collectionRepository.update).toBeCalledTimes(0);
  });

  it('should update collection has no name, parent id is undefined', async () => {
    const param = createSampleUpdateCollectionParam();
    param.parent_id = undefined;
    delete param.name;
    const entity = createSampleCollectionEntity({ param });
    const userId = createSampleUserId();
    const error = new UpdateCollectionParamError({
      ...CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED,
      attributes: {
        id: param.id,
        parent_id: param.parent_id,
      },
    });

    collectionRepository.create.mockReturnValue(entity);
    collectionRepository.update.mockReturnValue({
      affected: 1,
    });
    collectionRepository.findOneOnMaster.mockReturnValue({ ...entity, ...param, user_id: userId });
    collectionRepository.findAllOnMaster.mockReturnValue([{ ...entity, ...param }]);
    collectionService['checkValidNameSameLevelUpdateCollection'] = jest
      .fn()
      .mockResolvedValue(true);
    try {
      await collectionService.updateBatchCollectionsWithReturn([param], fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateCollectionParamError);
      expect(err).toStrictEqual(error);
    }
    expect(collectionRepository.update).toBeCalledTimes(0);
  });

  it('should update collection has duplicated collection name', async () => {
    const param = createSampleUpdateCollectionParam();
    param.parent_id = 1;
    param.name = 'name-dubplicated';
    const entity = createSampleCollectionEntity({ param });
    const userId = createSampleUserId();
    const error = new UpdateCollectionParamError({
      ...CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED,
      attributes: {
        id: param.id,
        parent_id: param.parent_id,
      },
    });

    collectionRepository.create.mockReturnValue(entity);
    collectionRepository.update.mockReturnValue({
      affected: 1,
    });

    collectionService['checkValidNameSameLevelUpdateCollection'] = jest
      .fn()
      .mockResolvedValue(true);

    collectionRepository.findOneOnMaster.mockReturnValue({ ...entity, ...param, user_id: userId });
    collectionRepository.findAllOnMaster.mockReturnValue([{ ...entity, id: 10 }]);

    try {
      await collectionService.updateBatchCollectionsWithReturn([param], fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateCollectionParamError);
      expect(err).toStrictEqual(error);
    }
    expect(collectionRepository.update).toBeCalledTimes(0);
  });

  it('should update collection is trashed', async () => {
    const param = createSampleUpdateCollectionParam();
    const entity = createSampleCollectionEntity({ param });
    const userId = createSampleUserId();
    const entities: Partial<Collection>[] = [
      param,
    ];

    collectionRepository.create.mockReturnValue(entity);
    collectionRepository.update.mockReturnValue({
      affected: 1,
    });
    collectionRepository.findOneOnMaster.mockReturnValue({
      ...entity,
      is_trashed: IS_TRASHED.TRASHED,
      user_id: userId
    });
    collectionService['checkValidNameSameLevelUpdateCollection'] = jest.fn().mockResolvedValue(true);
    const updated_date = 123456;
    try {
      const setting = <GlobalSetting>{};
      await collectionService.updateWithReturn(entities, userId, param, setting, updated_date);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateCollectionParamError);
    }
    try {
      const setting = <GlobalSetting>{};
      await collectionService.updateWithReturn(entities, userId, { id: 1 } as UpdateCollectionParam, setting, updated_date);
    } catch (err) {
      expect(err).toBeInstanceOf(UpdateCollectionParamError);
    }
  });
  it('should delete collection', async () => {
    collectionQueueService.deleteCollectionTree = jest.fn().mockResolvedValue('');
    const param = createSampleDeleteCollectionParam();
    const userId = createSampleUserId();
    const entity: Partial<Collection> = {
      id: param.id,
      is_trashed: IS_TRASHED.TRASHED,
      calendar_uri: datatype.uuid(),
    };

    collectionRepository.findOne.mockReturnValue(entity);
    collectionRepository.update.mockReturnValue(entity);

    await collectionService.delete(userId, param);

    expect(collectionRepository.findOne).toBeCalledTimes(1);
  });

  it('should delete collection has collection not found error', async () => {
    collectionQueueService.deleteCollectionTree = jest.fn().mockResolvedValue('');
    collectionQueueService.deleteCollectionOfMember = jest.fn().mockResolvedValue('');
    const param = createSampleDeleteCollectionParam();
    const entity: Partial<Collection> = {
      id: param.id,
      is_trashed: IS_TRASHED.TRASHED,
      calendar_uri: datatype.uuid(),
    };
    const userId = createSampleUserId();
    const error = new DeleteCollectionParamError({
      ...CollectionErrorDict.COLLECTION_NOT_FOUND,
      attributes: {
        id: param.id,
      },
    });

    collectionRepository.findOne.mockReturnValue(undefined);
    collectionRepository.update.mockReturnValue(entity);
    settingService.findOneByUserId = jest.fn().mockResolvedValue({
      default_folder: 2,
      default_cal: datatype.uuid(),
    });

    try {
      await collectionService.delete(userId, param);
    } catch (err) {
      // expect(err).toBeInstanceOf(DeleteCollectionParamError);
      // expect(err).toStrictEqual(error);
    }

    expect(collectionRepository.findOne).toBeCalledTimes(1);
    expect(collectionRepository.update).toBeCalledTimes(0);
    expect(collectionQueueService.deleteCollectionTree).toBeCalledTimes(0);
  });

  it('should delete collection has collection deleted error', async () => {
    collectionQueueService.deleteCollectionTree = jest.fn().mockResolvedValue('');
    const param = createSampleDeleteCollectionParam();
    const entity: Partial<Collection> = {
      id: param.id,
      is_trashed: IS_TRASHED.DELETED,
      calendar_uri: datatype.uuid(),
    };
    const userId = createSampleUserId();
    const error = new DeleteCollectionParamError({
      ...CollectionErrorDict.ALREADY_DELETED,
      attributes: {
        id: param.id,
      },
    });

    collectionRepository.findOne.mockReturnValue(entity);
    collectionRepository.update.mockReturnValue(entity);
    settingService.findOneByUserId = jest.fn().mockResolvedValue({
      default_folder: datatype,
      default_cal: datatype.uuid(),
    });

    try {
      await collectionService.delete(userId, param);
    } catch (err) {
      // expect(err).toBeInstanceOf(DeleteCollectionParamError);
      // expect(err).toStrictEqual(error);
    }

    expect(collectionRepository.findOne).toBeCalledTimes(1);
    expect(settingService.findOneByUserId).toBeCalledTimes(0);
    expect(collectionRepository.update).toBeCalledTimes(0);
    expect(collectionQueueService.deleteCollectionTree).toBeCalledTimes(0);
  });

  it('should delete collection has default collection error', async () => {
    collectionQueueService.deleteCollectionTree = jest.fn().mockResolvedValue('');
    collectionQueueService.deleteCollectionOfMember = jest.fn().mockResolvedValue('');
    const param = createSampleDeleteCollectionParam();
    const entity: Partial<Collection> = {
      id: param.id,
      is_trashed: IS_TRASHED.TRASHED,
      calendar_uri: datatype.uuid(),
    };
    const userId = createSampleUserId();

    collectionRepository.findOne.mockReturnValue(entity);
    collectionRepository.update.mockReturnValue(entity);

    try {
      await collectionService.deleteWorker42(userId, param);
    } catch (err) {
      // expect(err).toBeInstanceOf(DeleteCollectionParamError);
      // expect(err).toStrictEqual(error);
    }

    expect(collectionRepository.findOne).toBeCalledTimes(1);
    expect(collectionRepository.update).toBeCalledTimes(0);
    expect(collectionQueueService.deleteCollectionTree).toBeCalledTimes(0);
  });

  it('should batch delete collections', async () => {
    const params = [createSampleDeleteCollectionParam(), createSampleDeleteCollectionParam()];
    const user = createSampleUser();
    collectionService.deleteWorker42 = jest.fn((e) => e);
    collectionQueueService.deleteCollectionTree = jest.fn().mockResolvedValue('');
    collectionQueueService.deleteCollectionOfMember = jest.fn().mockResolvedValue('');
    const { deleted, errors } = await collectionService.batchDelete(params, fakeReq);

    expect(collectionService.deleteWorker42).toBeCalledTimes(2);
    expect(deleted).toHaveLength(2);
    expect(errors).toHaveLength(0);
    deleted.forEach((item, idx) => {
      expect(item.id).toEqual(params[idx].id);
    });
  });

  it('should batch delete collections having query failed error', async () => {
    const params: DeleteCollectionParam[] = [
      createSampleDeleteCollectionParam(),
      createSampleDeleteCollectionParam(),
      createSampleDeleteCollectionParam(),
      createSampleDeleteCollectionParam(),
    ];
    const user = createSampleUser();
    const paramErrors = [
      new DeleteCollectionParamError({
        code: CollectionErrorCode.COLLECTION_ENTITY_ERROR,
        message: 'query failed',
        attributes: params[2],
      }),
      new DeleteCollectionParamError({
        code: CollectionErrorCode.COLLECTION_ENTITY_ERROR,
        message: 'entity not found',
        attributes: params[3],
      }),
    ];
    collectionQueueService.deleteCollectionTree = jest.fn();
    collectionQueueService.deleteCollectionOfMember = jest.fn();

    const queryFailedError = new QueryFailedError('', [], new Error());
    queryFailedError.message = paramErrors[0].message;
    const entityNotFoundError = new EntityNotFoundError(Collection, null);
    entityNotFoundError.message = paramErrors[1].message;

    collectionService.deleteWorker42 = jest
      .fn()
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('')
      .mockImplementationOnce(() => {
        throw queryFailedError;
      })
      .mockImplementationOnce(() => {
        throw entityNotFoundError;
      });

    const { deleted, errors } = await collectionService.batchDelete(params, fakeReq);
    expect(collectionService.deleteWorker42).toBeCalledTimes(4);
    expect(collectionService.deleteWorker42).toHaveBeenNthCalledWith(1, 1, params[0]);
    expect(collectionService.deleteWorker42).toHaveBeenNthCalledWith(2, 1, params[1]);
    expect(collectionService.deleteWorker42).toHaveBeenNthCalledWith(3, 1, params[2]);
    expect(collectionService.deleteWorker42).toHaveBeenNthCalledWith(4, 1, params[3]);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
    // expect(apiLastModifiedQueueService.addJob).toHaveBeenCalledWith({
    //   apiName: ApiLastModifiedName.COLLECTION,
    //   userId,
    //   updatedDate: getCreatedDate()
    // });
    expect(deleted).toHaveLength(2);
    expect(errors).toHaveLength(2);
    deleted.forEach((item, idx) => {
      expect(item.id).toEqual(params[idx].id);
    });
    errors.forEach((item, idx) => {
      expect(item).toBeInstanceOf(DeleteCollectionParamError);
      expect(item).toStrictEqual(paramErrors[idx]);
    });
  });

  it('should batch delete collections having error', async () => {
    const params = [
      createSampleDeleteCollectionParam(),
      createSampleDeleteCollectionParam(),
      createSampleDeleteCollectionParam(),
      createSampleDeleteCollectionParam(),
    ];
    const user = createSampleUser();
    const paramErrors = [
      new DeleteCollectionParamError({
        ...CollectionErrorDict.COLLECTION_NOT_FOUND,
        attributes: {
          id: params[2].id,
        },
      }),
      new DeleteCollectionParamError({
        ...CollectionErrorDict.ALREADY_DELETED,
        attributes: {
          id: params[3].id,
        },
      }),
    ];
    collectionQueueService.deleteCollectionTree = jest.fn();
    collectionQueueService.deleteCollectionOfMember = jest.fn();

    collectionService.deleteWorker42 = jest
      .fn()
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('')
      .mockImplementationOnce(() => {
        throw paramErrors[0];
      })
      .mockImplementationOnce(() => {
        throw paramErrors[1];
      });

    const { deleted, errors } = await collectionService.batchDelete(params, fakeReq);

    expect(collectionService.deleteWorker42).toBeCalledTimes(4);
    expect(collectionService.deleteWorker42).toHaveBeenNthCalledWith(1, fakeReq.user.id, params[0]);
    expect(collectionService.deleteWorker42).toHaveBeenNthCalledWith(2, fakeReq.user.id, params[1]);
    expect(collectionService.deleteWorker42).toHaveBeenNthCalledWith(3, fakeReq.user.id, params[2]);
    expect(collectionService.deleteWorker42).toHaveBeenNthCalledWith(4, fakeReq.user.id, params[3]);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
    // expect(apiLastModifiedQueueService.addJob).toHaveBeenCalledWith({
    //   apiName: ApiLastModifiedName.COLLECTION,
    //   userId,
    //   updatedDate: getCreatedDate()
    // });
    expect(deleted).toHaveLength(2);
    expect(errors).toHaveLength(2);
    deleted.forEach((item, idx) => {
      expect(item.id).toEqual(params[idx].id);
    });
    errors.forEach((item, idx) => {
      expect(item).toBeInstanceOf(DeleteCollectionParamError);
      expect(item).toStrictEqual(paramErrors[idx]);
    });
  });

  it('should batch delete collections having unknown error', async () => {
    const params: DeleteCollectionParam[] = [
      createSampleDeleteCollectionParam(),
      createSampleDeleteCollectionParam(),
    ];
    const user = createSampleUser();
    const unknownError = new Error('any error');

    collectionService.deleteWorker42 = jest
      .fn()
      .mockResolvedValueOnce('')
      .mockImplementationOnce(() => {
        throw unknownError;
      });

    try {
      await collectionService.batchDelete(params, fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err).toStrictEqual(unknownError);
    }

    expect(collectionService.deleteWorker42).toBeCalledTimes(2);
    expect(collectionService.deleteWorker42).toHaveBeenNthCalledWith(1, fakeReq.user.id, params[0]);
    expect(collectionService.deleteWorker42).toHaveBeenNthCalledWith(2, fakeReq.user.id, params[1]);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
  });

  it('should find one by id success', async () => {
    const entity = createSampleCollectionEntity();
    const userId = createSampleUserId();
    collectionRepository.findOne = jest.fn().mockResolvedValue(entity);
    const res = await collectionService.findOneById(userId, entity.id);
    expect(collectionRepository.findOne).toBeCalledTimes(1);
    expect(collectionRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: entity.id,
        user_id: userId,
      },
    });
    expect(res.id).toEqual(entity.id);
    expect(res.name).toEqual(entity.name);
    expect(res.color).toEqual(entity.color);
    expect(res.calendar_uri).toEqual(entity.calendar_uri);
    expect(res.parent_id).toEqual(entity.parent_id);
    expect(res.created_date).toEqual(entity.created_date);
    expect(res.updated_date).toEqual(entity.updated_date);
    expect(res.type).toEqual(entity.type);
    if (entity.alerts) {
      expect(res.alerts).toHaveLength(1);
      expect(res.alerts[0].description).toEqual(entity.alerts[0].description);
      expect(res.alerts[0].uid).toEqual(entity.alerts[0].uid);
      expect(res.alerts[0].trigger).toMatchObject(entity.alerts[0].trigger);
    }
  });

  it('should find by ids success', async () => {
    const entities = [createSampleCollectionEntity(), createSampleCollectionEntity()];
    const userId = createSampleUserId();
    collectionRepository.find = jest.fn().mockResolvedValue(entities);
    const res = await collectionService.findByIds(
      userId,
      entities.map((e) => e.id),
    );
    expect(collectionRepository.find).toBeCalledTimes(1);
    expect(collectionRepository.find).toHaveBeenCalledWith({
      where: {
        id: In(entities.map((e) => e.id)),
        user_id: userId,
        is_trashed: IS_TRASHED.NOT_TRASHED
      },
    });
    res.forEach((item, idx) => {
      expect(item.id).toEqual(entities[idx].id);
      expect(item.name).toEqual(entities[idx].name);
      expect(item.color).toEqual(entities[idx].color);
      expect(item.calendar_uri).toEqual(entities[idx].calendar_uri);
      expect(item.parent_id).toEqual(entities[idx].parent_id);
      expect(item.created_date).toEqual(entities[idx].created_date);
      expect(item.updated_date).toEqual(entities[idx].updated_date);
      expect(item.type).toEqual(entities[idx].type);
      if (entities[idx].alerts) {
        expect(item.alerts).toHaveLength(1);
        expect(item.alerts[0].description).toEqual(entities[idx].alerts[0].description);
        expect(item.alerts[0].uid).toEqual(entities[idx].alerts[0].uid);
        expect(item.alerts[0].trigger).toMatchObject(entities[idx].alerts[0].trigger);
      }
    });
  });

  it('should getUniqueCalendarUidCollection', async () => {
    const params = [createSampleCollectionParam(), createSampleCollectionParam()];
    params[1].calendar_uri = params[0].calendar_uri;
    const { valid, errors: duplicated } = collectionService['getUniqueCalendarUidCollection'](params);
    expect(valid).toHaveLength(1);
    expect(duplicated).toHaveLength(1);
    valid.forEach((item, idx) => {
      expect(item.name).toEqual(params[idx].name);
      expect(item.color).toEqual(params[idx].color);
      expect(item.calendar_uri).toEqual(params[idx].calendar_uri);
      expect(item.parent_id).toEqual(params[idx].parent_id);
      expect(item.type).toEqual(params[idx].type);
      if (params[idx].alerts) {
        expect(item.alerts).toHaveLength(1);
        expect(item.alerts[0].description).toEqual(params[idx].alerts[0].description);
        expect(item.alerts[0].uid).toEqual(params[idx].alerts[0].uid);
        expect(item.alerts[0].trigger).toMatchObject(params[idx].alerts[0].trigger);
      }
    });
  });

  // it('should checkValidNameSameLevelCollection false', async () => {
  //   const param = createSampleCollectionParam();
  //   const userId = createSampleUserId();
  //   const entity = createSampleCollectionEntity({ param });

  //   collectionRepository.findOne = jest.fn().mockResolvedValue(entity);

  //   const res = await collectionService['checkValidNameSameLevelCollection'](userId, param);
  //   expect(collectionRepository.findOne).toHaveBeenCalledWith({
  //     select: ['id'],
  //     where: {
  //       user_id: userId,
  //       parent_id: param.parent_id,
  //       name: param.name,
  //     },
  //   });
  //   expect(res).toBe(false);
  // });

  // it('should checkValidNameSameLevelCollection true', async () => {
  //   const param = createSampleCollectionParam();
  //   const userId = createSampleUserId();
  //   collectionRepository.findOne = jest.fn().mockResolvedValue(undefined);

  //   const res = await collectionService['checkValidNameSameLevelCollection'](userId, param);
  //   expect(collectionRepository.findOne).toHaveBeenCalledWith({
  //     select: ['id'],
  //     where: {
  //       user_id: userId,
  //       parent_id: param.parent_id,
  //       name: param.name,
  //     },
  //   });
  //   expect(res).toBe(true);
  // });

  // it('should checkDuplicateCalendarUriCollection true', async () => {
  //   const param = createSampleCollectionParam();
  //   const userId = createSampleUserId();

  //   collectionRepository.findOne = jest.fn().mockResolvedValue(undefined);

  //   const res = await collectionService['checkDuplicateCalendarUriCollection'](userId, param);
  //   expect(collectionRepository.findOne).toHaveBeenCalledWith({
  //     select: ['id'],
  //     where: {
  //       user_id: userId,
  //       calendar_uri: param.calendar_uri,
  //     },
  //   });
  //   expect(res).toBe(true);
  // });

  // it('should checkDuplicateCalendarUriCollection true - calendar_uri is undefined', async () => {
  //   const param = createSampleCollectionParam();
  //   param.calendar_uri = undefined;
  //   const userId = createSampleUserId();

  //   const res = await collectionService['checkDuplicateCalendarUriCollection'](userId, param);
  //   expect(collectionRepository.findOne).toHaveBeenCalledTimes(0);
  //   expect(res).toBe(true);
  // });

  // it('should checkDuplicateCalendarUriCollection false', async () => {
  //   const param = createSampleCollectionParam();
  //   const entity = createSampleCollectionEntity();
  //   const userId = createSampleUserId();

  //   collectionRepository.findOne = jest.fn().mockResolvedValue(entity);

  //   const res = await collectionService['checkDuplicateCalendarUriCollection'](userId, param);
  //   expect(collectionRepository.findOne).toHaveBeenCalledWith({
  //     select: ['id'],
  //     where: {
  //       user_id: userId,
  //       calendar_uri: param.calendar_uri,
  //     },
  //   });
  //   expect(res).toBe(false);
  // });

  // it('should checkValidNameSameLevelUpdateCollection collection not found error', async () => {
  //   const param = createSampleUpdateCollectionParam();
  //   const userId = createSampleUserId();
  //   const entities: Partial<Collection>[] = [
  //     createSampleUpdateCollectionParam()
  //   ];
  //   entities[0].id = undefined;

  //   const error = new UpdateCollectionParamError({
  //     ...CollectionErrorDict.COLLECTION_NOT_FOUND,
  //     attributes: {
  //       id: param.id,
  //     },
  //   });

  //   try {
  //     await collectionService['checkValidNameSameLevelUpdateCollection'](userId, entities[0], param);
  //   } catch (err) {
  //     expect(err).toBeInstanceOf(UpdateCollectionParamError);
  //     expect(err).toStrictEqual(error);
  //   }
  // });

  // it('should checkValidNameSameLevelUpdateCollection false', async () => {
  //   const param = createSampleUpdateCollectionParam();
  //   const userId = createSampleUserId();
  //   const entity: Partial<Collection> = {
  //     id: param.id,
  //     parent_id: 0,
  //     name: param.name
  //   };
  //   const entities: Partial<Collection>[] = [
  //     entity,
  //   ];

  //   collectionRepository.findOne = jest.fn().mockResolvedValue(entity);
  //   const res = await collectionService['checkValidNameSameLevelUpdateCollection'](userId, entity, param);
  //   expect(res).toBe(false);
  // });

  // it('should checkValidNameSameLevelUpdateCollection true - not duplicated', async () => {
  //   const param = createSampleUpdateCollectionParam();
  //   const entity: Partial<Collection> = {
  //     id: param.id,
  //     parent_id: 0,
  //   };
  //   const userId = createSampleUserId();
  //   collectionRepository.findOne = jest
  //     .fn()
  //     .mockResolvedValueOnce(undefined);

  //   const res = await collectionService['checkValidNameSameLevelUpdateCollection'](userId, entity, param);
  //   expect(res).toBe(true);
  // });

  it('should checkValidLevelCollection true - parent_id = 0', async () => {
    const curParentId = 0;
    const userId = createSampleUserId();
    const { result } = await collectionService['checkValidLevelCollection'](userId, curParentId);
    expect(collectionRepository.findOne).toHaveBeenCalledTimes(0);
    expect(result).toBe(true);
  });

  it('should checkValidLevelCollection false - parent not found', async () => {
    const curParentId = 1;
    const userId = createSampleUserId();
    collectionRepository.findOne = jest.fn().mockResolvedValueOnce(undefined);

    const { result, error } = await collectionService['checkValidLevelCollection'](
      userId,
      curParentId,
    );

    expect(collectionRepository.findOne).toHaveBeenCalledTimes(1);
    expect(collectionRepository.findOne).toHaveBeenCalledWith({
      select: ['user_id', 'parent_id', 'type', 'is_trashed'],
      where: {
        id: curParentId,
      },
    });
    expect(result).toBe(false);
    expect(error).toBe(CollectionErrorDict.PARENT_NOT_FOUND);
  });

  it('should checkValidLevelCollection false - parent not found(belonged)', async () => {
    const entity = createSampleCollectionEntity();
    entity.parent_id = 0;
    entity.user_id = createSampleUserId();
    const userId = createSampleUserId();
    const curParentId = createSampleUserId();
    collectionRepository.findOne = jest.fn().mockResolvedValueOnce(entity);

    const { result, error } = await collectionService['checkValidLevelCollection'](
      userId,
      curParentId,
    );

    expect(collectionRepository.findOne).toHaveBeenCalledTimes(1);
    expect(collectionRepository.findOne).toHaveBeenCalledWith({
      select: ['user_id', 'parent_id', 'type', 'is_trashed'],
      where: {
        id: curParentId,
      },
    });
    expect(result).toBe(false);
    expect(error).toBe(CollectionErrorDict.PARENT_NOT_FOUND);
  });

  it('should checkValidLevelCollection false - exceed 7 levels', async () => {
    const userId = createSampleUserId();
    const entity = createSampleCollectionEntity();
    entity.parent_id = 0;
    entity.user_id = userId;
    const resolvedValues = [entity];
    for (let i = 0; i < 6; i++) {
      const tEntity = createSampleCollectionEntity();
      tEntity.parent_id = resolvedValues[resolvedValues.length - 1].id;
      tEntity.user_id = resolvedValues[resolvedValues.length - 1].user_id;
      resolvedValues.push(tEntity);
    }
    const curParentId = resolvedValues[resolvedValues.length - 1].id;
    let mock = jest.fn().mockResolvedValueOnce(resolvedValues[resolvedValues.length - 1]);
    for (let i = 5; i >= 0; i--) {
      mock = mock.mockResolvedValueOnce(resolvedValues[i]);
    }
    collectionRepository.findOne = mock;

    const { result, error } = await collectionService['checkValidLevelCollection'](
      userId,
      curParentId,
    );

    expect(collectionRepository.findOne).toHaveBeenCalledTimes(7);
    for (let i = 0; i < resolvedValues.length; i++) {
      expect(collectionRepository.findOne).toHaveBeenNthCalledWith(i + 1, {
        select: ['user_id', 'parent_id', 'type', 'is_trashed'],
        where: {
          id: resolvedValues[resolvedValues.length - 1 - i].id,
        },
      });
    }
    expect(result).toBe(false);
    expect(error).toBe(CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED);
  });

  it('should checkParentCollection', async () => {
    const params = [createSampleCollectionParam(), createSampleCollectionParam()];
    params[0].type = COLLECTION_TYPE.SHARE_COLLECTION;
    params[0].parent_id = 0;
    params[1].type = COLLECTION_TYPE.SHARE_COLLECTION;
    params[1].parent_id = 123;
    const { valid, errors } = collectionService['checkParentCollectionShare'](params);
    expect(valid).toHaveLength(1);
    expect(errors).toHaveLength(1);
    valid.forEach((item, idx) => {
      expect(item.name).toEqual(params[idx].name);
      expect(item.color).toEqual(params[idx].color);
      expect(item.calendar_uri).toEqual(params[idx].calendar_uri);
      expect(item.parent_id).toEqual(params[idx].parent_id);
      expect(item.type).toEqual(params[idx].type);
      if (params[idx].alerts) {
        expect(item.alerts).toHaveLength(1);
        expect(item.alerts[0].description).toEqual(params[idx].alerts[0].description);
        expect(item.alerts[0].uid).toEqual(params[idx].alerts[0].uid);
        expect(item.alerts[0].trigger).toMatchObject(params[idx].alerts[0].trigger);
      }
    });
  });

  it('should checkParentCollectionUpdate', async () => {
    const params = [createSampleUpdateCollectionParam(), createSampleUpdateCollectionParam()];
    const entities = [createSampleCollectionEntity() as Collection, createSampleCollectionEntity() as Collection];
    params[0].parent_id = 0;
    params[1].parent_id = 123;
    const { valid, errors } = await collectionService['checkParentCollectionUpdate'](params, entities);
    expect(valid).toHaveLength(2);
    expect(errors).toHaveLength(0);
    valid.forEach((item, idx) => {
      expect(item.name).toEqual(params[idx].name);
      expect(item.color).toEqual(params[idx].color);
      expect(item.parent_id).toEqual(params[idx].parent_id);
      if (params[idx].alerts) {
        expect(item.alerts).toHaveLength(1);
        expect(item.alerts[0].description).toEqual(params[idx].alerts[0].description);
        expect(item.alerts[0].uid).toEqual(params[idx].alerts[0].uid);
        expect(item.alerts[0].trigger).toMatchObject(params[idx].alerts[0].trigger);
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });
});