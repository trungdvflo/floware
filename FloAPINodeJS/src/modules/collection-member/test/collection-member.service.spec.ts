import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { datatype, helpers } from 'faker';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { SHARE_STATUS } from '../../../common/constants';
import { MSG_ERR_NOT_EXIST } from '../../../common/constants/message.constant';
import { alertActions } from '../../../common/dtos/alertParam';
import { BaseGetDTO } from '../../../common/dtos/base-get.dto';
import { Collection } from '../../../common/entities/collection.entity';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { IUser } from '../../../common/interfaces/user';
import { CollectionInstanceMemberService } from '../../../modules/collection_instance_member/collection-instance-member.service';
import { KanbanService } from '../../../modules/kanban/kanban.service';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { CollectionService } from '../../collection/collection.service';
import {
  CollectionParam,
  CollectionType,
  UpdateCollectionParam
} from '../../collection/dto/collection-param';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { ShareMemberService } from '../../share-member/share-member.service';
import { CollectionMemberService } from '../collection-member.service';
import { CollectionMemberParam } from '../dto/collection-member-param';
import { LeaveShareDTO } from '../dto/leave-share.dto';

jest.mock('uuid', () => {
  return {
    v4: jest.fn().mockReturnValue('2906e564-a40d-11eb-b55c-070f99e81ded'),
  };
});

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

const createSampleCollectionEntity = (option?: {
  param?: CollectionMemberParam;
  type?: CollectionType;
}): Partial<CollectionMemberParam> => {
  let id;
  let calendar_uri;
  let type;
  if (option?.param instanceof UpdateCollectionParam) {
    id = option?.param.id;
  }
  if (option?.param instanceof CollectionParam) {
    calendar_uri = option?.param.calendar_uri;
  }
  if (option?.param instanceof CollectionParam) {
    type = option?.param.type;
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
    shared_status: option?.param?.shared_status || datatype.number({ min: 0 }),
    owner: option?.param?.owner || datatype.string(),
    access: option?.param?.access || datatype.number({ min: 0 }),
  };
};

const user: IUser = {
  userId: 1,
  id: 1,
  email: 'tester001@flomail.net',
  appId: '',
  deviceUid: '',
  userAgent: '',
  token: '',
};

// @ts-ignore
const repositoryMockFactory = jest.fn(() => ({
  createQueryBuilder: jest.fn((e) => e),
}));

const deletedItemServiceMockFactory: () => MockType<DeletedItemService> = jest.fn(() => ({
  findAll: jest.fn((e) => e),
  batchCreate: jest.fn((e) => e),
}));

const apiLastModifiedServiceMockFactory: () =>
  MockType<ApiLastModifiedQueueService> = jest.fn(() => ({}));

describe('CollectionMemberService', () => {
  let app: INestApplication;
  let collectionRepository: MockType<Repository<Collection>>;
  let databaseService: DatabaseUtilitiesService;
  let collectionMemberService: CollectionMemberService;
  let shareMemberService: ShareMemberService;
  let deletedItemService: MockType<DeletedItemService>;
  let createQueryBuilder: any;
  let eventEmitter: EventEmitter2;
  let collectionService: CollectionService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionMemberService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(Collection),
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
          provide: ShareMemberService,
          useValue: {
            getShareMembers: jest.fn((e) => e),
            updateMemberObject: jest.fn((e) => e),
          },
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory,
          useValue: {
            addJob: jest.fn((e) => e),
          },
        },
        {
          provide: CollectionInstanceMemberService,
          useValue: {
            deleteByColIdsAndUserId: jest.fn((e) => e),
          },
        },
        {
          provide: KanbanService,
          useValue: {
            deleteByColIdsAndUserId: jest.fn((e) => e),
          },
        },
        {
          provide: HttpService,
          useValue: spyHttpClient
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn((e) => e),
          },
        },
        {
          provide: CollectionService,
          useValue: {
            findOneWithCondition: jest.fn((e) => e),
          },
        }
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    collectionRepository = module.get(getRepositoryToken(Collection));
    collectionMemberService = module.get<CollectionMemberService>(CollectionMemberService);
    databaseService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    shareMemberService = module.get<ShareMemberService>(ShareMemberService);
    deletedItemService = module.get(DeletedItemService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    createQueryBuilder = {
      select: jest.fn((entity) => createQueryBuilder),
      addSelect: jest.fn((entity) => createQueryBuilder),
      leftJoin: jest.fn((entity) => createQueryBuilder),
      innerJoin: jest.fn((entity) => createQueryBuilder),
      where: jest.fn((entity) => createQueryBuilder),
      andWhere: jest.fn((entity) => createQueryBuilder),
      limit: jest.fn((entity) => createQueryBuilder),
      addOrderBy: jest.fn((entity) => createQueryBuilder),
      execute: jest.fn((entity) => createQueryBuilder),
    };
    collectionRepository.createQueryBuilder = jest.fn(() => createQueryBuilder);
    collectionService = module.get(CollectionService);
  });

  it('should be defined', () => {
    expect(collectionMemberService).toBeDefined();
    expect(shareMemberService).toBeDefined();
    expect(collectionService).toBeDefined();
  });

  it('should findAll return empty array', async () => {
    const req = {
      page_size: 2,
    } as BaseGetDTO;
    const entities: Partial<Collection>[] = [
      createSampleCollectionEntity(),
      createSampleCollectionEntity(),
    ];

    databaseService.synDataMember = jest.fn().mockResolvedValue([]);
    deletedItemService.findAll = jest.fn().mockResolvedValue([]);

    const result = await collectionMemberService.getAllFiles(req, fakeReq);
    expect(result.data).not.toBeNull();
    expect(result.data).toHaveLength(0);
    expect(result.data_del).not.toBeNull();
    expect(result.data_del).toBeUndefined();
  });

  it('should findAll return collection member array', async () => {
    const req = {
      page_size: 2,
    } as BaseGetDTO;
    const entities: Partial<CollectionMemberParam>[] = [
      createSampleCollectionEntity(),
      createSampleCollectionEntity(),
    ];

    databaseService.synDataMember = jest.fn().mockResolvedValue(entities);
    const result = await collectionMemberService.getAllFiles(req, fakeReq);

    expect(result).not.toBeNull();
    expect(result.data).toHaveLength(2);
    result.data.forEach((e, idx) => {
      expect(e.id).toEqual(entities[idx].id);
      expect(e.name).toEqual(entities[idx].name);
      expect(e.color).toEqual(entities[idx].color);
      expect(e.calendar_uri).toEqual(entities[idx].calendar_uri);
      expect(e.parent_id).toEqual(entities[idx].parent_id);
      expect(e.created_date).toEqual(entities[idx].created_date);
      expect(e.updated_date).toEqual(entities[idx].updated_date);
      expect(e.type).toEqual(entities[idx].type);
      expect(e['shared_status']).toEqual(entities[idx].shared_status);
      expect(e['owner']).toEqual(entities[idx].owner);
      expect(e['access']).toEqual(entities[idx].access);
      if (entities[idx].alerts) {
        expect(e.alerts).toHaveLength(1);
        expect(e.alerts[0].description).toEqual(entities[idx].alerts[0].description);
        expect(e.alerts[0].uid).toEqual(entities[idx].alerts[0].uid);
        expect(e.alerts[0].trigger).toMatchObject(entities[idx].alerts[0].trigger);
      }
    });
  });

  it('should findAll return collection member array with data_del', async () => {
    const req = {
      page_size: 2,
      has_del: 1,
      modified_gte: 1621327600.089,
      modified_lt: 1621337600.089,
      ids: [1, 2],
      fields: ['name', 'color'],
    } as BaseGetDTO;
    const entities: Partial<Collection>[] = [
      createSampleCollectionEntity(),
      createSampleCollectionEntity(),
    ];

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

    databaseService.synDataMember = jest.fn().mockResolvedValue(entities);
    deletedItemService.findAll = jest.fn().mockResolvedValue(deletedItemEntities);

    const { data, data_del } = await collectionMemberService.getAllFiles(
      req,
      fakeReq
    );

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

  describe('Leave share members', () => {
    const item_1 = new LeaveShareDTO();
    item_1.id = 1;
    const item_2 = new LeaveShareDTO();
    item_2.id = 2;

    const entity1 = {
      id: item_1.id,
      email: fakeReq.user.email,
      user_id: 1,
      shared_status: SHARE_STATUS.JOINED
    };
    const entity2 = {
      email: fakeReq.user.email,
      id: item_2.id,
      user_id: 1,
      shared_status: SHARE_STATUS.JOINED
    };
    const dataDto = [item_1, item_2];
    it('should be success un-share members', async () => {
      shareMemberService.getShareMembers = jest.fn().mockReturnValue([entity1])
        .mockReturnValue([entity2]);
      const result = await collectionMemberService.leaveShareMember(dataDto, fakeReq);
      expect(result.itemPass).toHaveLength(2);
      expect(result.itemPass[0].shared_status).toEqual(SHARE_STATUS.LEAVED);
      expect(result.itemPass[1].shared_status).toEqual(SHARE_STATUS.LEAVED);
      expect(result.itemPass[0].id).toEqual(item_1.id);
      expect(result.itemPass[1].id).toEqual(item_2.id);
    });

    it('should be not joined un-share members', async () => {
      entity2.shared_status = SHARE_STATUS.REMOVED;
      shareMemberService.getShareMembers = jest.fn().mockReturnValue([entity2])

      const result = await collectionMemberService.leaveShareMember(dataDto, fakeReq);
      expect(result.itemPass).toHaveLength(0);

      entity2.shared_status = SHARE_STATUS.JOINED;
      shareMemberService.getShareMembers = jest.fn().mockReturnValue([entity2])
      collectionService.findOneWithCondition = jest.fn().mockReturnValue({});

      const result2 = await collectionMemberService.leaveShareMember(dataDto, fakeReq);

      expect(result2.itemPass).toHaveLength(2);
      expect(result2.itemPass[0].shared_status).toEqual(SHARE_STATUS.LEAVED);
      expect(result2.itemPass[0].id).toEqual(item_1.id);
      expect(result2.itemFail).toHaveLength(0);
    });

    it('should return item fail with share user not existed', async () => {
      shareMemberService.getShareMembers = jest.fn().mockReturnValue([]);

      const result = await collectionMemberService.leaveShareMember(dataDto, fakeReq);
      expect(result.itemPass).toHaveLength(0);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST);
      expect(result.itemFail[1].message).toEqual(MSG_ERR_NOT_EXIST);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
