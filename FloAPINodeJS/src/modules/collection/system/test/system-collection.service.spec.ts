import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../../test';
import { ErrorCode } from '../../../../common/constants/error-code';
import { MSG_ERR_NOT_EXIST, MSG_ERR_WHEN_CREATE, MSG_ERR_WHEN_DELETE, MSG_ERR_WHEN_UPDATE } from '../../../../common/constants/message.constant';
import { BaseGetDTO } from '../../../../common/dtos/base-get.dto';
import { SystemCollection } from '../../../../common/entities/collection-system.entity';
import { DeletedItem } from '../../../../common/entities/deleted-item.entity';
import { Users } from '../../../../common/entities/users.entity';
import { IUser } from '../../../../common/interfaces';
import { ApiLastModifiedQueueService } from '../../../../modules/bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../../../../modules/database/database-utilities.service';
import { DeletedItemService } from '../../../../modules/deleted-item/deleted-item.service';
import { SystemCollectionService } from '../system-collection.service';
import { fakeCreatedDTO, fakeEntity, fakeUpdatedDTO } from './fakeData';

const repoMockFactory = jest.fn(() => ({
  save: jest.fn((entity) => {
    entity.id = 1;
    return entity;
  }),
  createQueryBuilder: jest.fn(e => e),
  delete: jest.fn((entity) => {
    return { ...entity, affected: true };
  }),
  find: jest.fn((entity) => entity),
  findOne: jest.fn((entity) => entity),
  create: jest.fn((entity) => entity),
  remove: jest.fn((entity) => entity),
  update: jest.fn((entity) => entity),
  metadata: {
    ownColumns: [
      {
        databaseName: 'id'
      },
      {
        databaseName: 'user_id'
      },
      {
        databaseName: 'name'
      },
      {
        databaseName: 'type'
      },
      {
        databaseName: 'order_number'
      },
      {
        databaseName: 'order_update_time'
      },
      {
        databaseName: 'enable_mini_month'
      },
      {
        databaseName: 'enable_quick_view'
      },
      {
        databaseName: 'show_mini_month'
      },
      {
        databaseName: 'created_date'
      },
      {
        databaseName: 'updated_date'
      },
    ]
  }
}));
const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({}));
const repoMockUserFactory: () => MockType<Repository<Users>> = jest.fn(() => ({
  delete: jest.fn((entity) => {
    return { ...entity, affected: true };
  })
}));

const apiLastModifiedQueueServiceMockFactory: () => MockType<ApiLastModifiedQueueService> = jest.fn(
  () => ({
    addJob: jest.fn((e) => e),
  }),
);

describe('SystemCollectionService', () => {
  let createQueryBuilder: any;
  let app: INestApplication;
  let repo: MockType<Repository<SystemCollection>>;
  let systemCollection: SystemCollectionService;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;
  let deletedItemService: DeletedItemService;
  let databaseUtilitiesService: DatabaseUtilitiesService;

  const user: IUser = {
    userId: 1,
    id: 1,
    email: 'tester001@flomail.net',
    appId: '',
    deviceUid: '',
    userAgent: '',
    token: '',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemCollectionService,
        DeletedItemService,
        DatabaseUtilitiesService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(SystemCollection),
          useFactory: repoMockFactory,
        },
        {
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory,
        },
        {
          provide: getRepositoryToken(Users),
          useFactory: repoMockUserFactory,
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedQueueServiceMockFactory,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    systemCollection = module.get<SystemCollectionService>(SystemCollectionService);
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    databaseUtilitiesService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    repo = module.get(getRepositoryToken(SystemCollection));

    createQueryBuilder = {
      select: jest.fn(entity => createQueryBuilder),
      addSelect: jest.fn(entity => createQueryBuilder),
      leftJoin: jest.fn(entity => createQueryBuilder),
      innerJoin: jest.fn(entity => createQueryBuilder),
      where: jest.fn(entity => createQueryBuilder),
      andWhere: jest.fn(entity => createQueryBuilder),
      execute: jest.fn(entity => createQueryBuilder),
      limit: jest.fn(entity => createQueryBuilder),
      getMany: jest.fn(entity => createQueryBuilder),
    };
    repo.createQueryBuilder = jest.fn(() => createQueryBuilder);
  });

  it('should be defined', () => {
    expect(systemCollection).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(databaseUtilitiesService).toBeDefined();
  });

  it('should get system collection list return empty array', async () => {
    const req = {
      modified_gte: 1,
      has_del: 1,
      page_size: 1,
    } as BaseGetDTO;
    databaseUtilitiesService.getAll = jest.fn().mockResolvedValue([]);
    deletedItemService.findAll = jest.fn().mockResolvedValue([]);
    const userId = fakeEntity().id;

    const result = await systemCollection.getAllFiles(req, userId);
    expect(databaseUtilitiesService.getAll).toBeCalledTimes(1);
    expect(result.data).not.toBeNull();
    expect(result.data_del).not.toBeNull();
    expect(result.data).toHaveLength(0);
    expect(result.data_del).toHaveLength(0);
  });

  it('should findAll return system collection array', async () => {
    const req = {
      page_size: 50,
      has_del: 1
    } as BaseGetDTO;
    const entities: Partial<SystemCollection>[] = [
      fakeEntity(), fakeEntity()
    ];
    const userId = fakeEntity().id;

    databaseUtilitiesService.getAll = jest.fn().mockResolvedValue(entities);
    deletedItemService.findAll = jest.fn().mockReturnValue([]);

    const result = await systemCollection.getAllFiles(req, userId);

    expect(databaseUtilitiesService.getAll).toBeCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data_del).toHaveLength(0);
    result.data.forEach((e, idx) => {
      expect(e.id).toEqual(entities[idx].id);
      expect(e.name).toEqual(entities[idx].name);
      expect(e.created_date).toEqual(entities[idx].created_date);
      expect(e.updated_date).toEqual(entities[idx].updated_date);
      expect(e.type).toEqual(entities[idx].type);
    });
  });

  describe('Created system collection', () => {
    const paramDtos = [fakeCreatedDTO(), fakeCreatedDTO()];
    const userId = fakeEntity().id;

    it('should throw error when having query failed error', async () => {
      repo.save = jest.fn().mockImplementationOnce(() => {
        throw Error;
      })

      const result = await systemCollection.createSystemCollection(paramDtos, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_WHEN_CREATE);
    });

    it('should be create data', async () => {
      const fakeTotalItem = 2;

      databaseUtilitiesService.countItemByUser = jest.fn().mockResolvedValue(fakeTotalItem);
      const result = await systemCollection.createSystemCollection(paramDtos, fakeReq);

      paramDtos.forEach((item, idx) => {
        expect(result.itemPass[idx].id).toBeGreaterThan(0);
        expect(item.name).toEqual(result.itemPass[idx].name);
        expect(item.local_filter).toEqual(result.itemPass[idx].local_filter);
        expect(item.sub_filter).toEqual(result.itemPass[idx].sub_filter);
        expect(item.enable_mini_month).toEqual(result.itemPass[idx].enable_mini_month);
        expect(item.enable_quick_view).toEqual(result.itemPass[idx].enable_quick_view);
        expect(item.show_mini_month).toEqual(result.itemPass[idx].show_mini_month);
      });
    });
  });


  describe('Update system collection', () => {
    const paramDto1 = fakeUpdatedDTO();
    const paramDto2 = fakeUpdatedDTO();
    const paramDtos = [paramDto1, paramDto2];
    const entity1 = fakeEntity();
    const entity2 = fakeEntity();
    const userId = fakeEntity().id;

    it('should throw error the item does not exist if item is not exised', async () => {
      repo.findOne.mockReturnValue(undefined);
      const result = await systemCollection.updateSystemCollection(paramDtos, fakeReq);

      expect(result.itemFail).not.toBeNull();
      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST)
    });

    it('should throw error when having query failed error', async () => {
      repo.save = jest.fn().mockImplementationOnce(() => {
        throw Error;
      })

      const result = await systemCollection.updateSystemCollection(paramDtos, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_WHEN_UPDATE);
    });

    it('should be success update', async () => {
      entity1.id = paramDto1.id;
      entity2.id = paramDto2.id;
      beforeEach(async () => {
        repo.findOne = jest.fn().mockReturnValueOnce(entity1)
          .mockReturnValueOnce(entity2);
      });
      const result = await systemCollection.updateSystemCollection(paramDtos, fakeReq);
      expect(result.itemPass).toHaveLength(2);
      paramDtos.forEach((item, idx) => {
        expect(result.itemPass[idx].id).toBeGreaterThan(0);
        expect(item.name).toEqual(result.itemPass[idx].name);
        expect(item.local_filter).toEqual(result.itemPass[idx].local_filter);
        expect(item.sub_filter).toEqual(result.itemPass[idx].sub_filter);
        expect(item.enable_mini_month).toEqual(result.itemPass[idx].enable_mini_month);
        expect(item.enable_quick_view).toEqual(result.itemPass[idx].enable_quick_view);
        expect(item.show_mini_month).toEqual(result.itemPass[idx].show_mini_month);
      });
    });
  });

  describe('Delete system collection', () => {
    it('should return systemNotFound', async () => {
      const data = [{ "id": 1 }];
      repo.findOne = jest.fn().mockReturnValueOnce(false);
      const result = await systemCollection.deleteSystemCollection(data, fakeReq);

      expect(result.itemFail[0].code).toEqual(ErrorCode.SYSTEM_NOT_FOUND);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST);
    });

    it('should delete item', async () => {
      const data = [{ "id": 1 }, { "id": 2 }];
      repo.findOne = jest.fn().mockReturnValue(true);
      deletedItemService.create = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);

      const result = await systemCollection.deleteSystemCollection(data, fakeReq);

      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_WHEN_DELETE);
      expect(result.itemPass).toHaveLength(1);
    });

    it('should throw error when having query failed error', async () => {
      const data = [{ "id": 1 }, { "id": 2 }];
      repo.findOne = jest.fn().mockReturnValue(true);
      deletedItemService.create = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(true);
      repo.delete = jest.fn().mockImplementation(() => {
        throw Error;
      })
      const result = await systemCollection.deleteSystemCollection(data, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[1].code).toEqual(ErrorCode.BAD_REQUEST);
    });
  })

  afterAll(async () => {
    await app.close();
  });
});