import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { QueryFailedError, Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_ERR_DUPLICATE_ENTRY, MSG_ERR_EXISTED, MSG_ERR_LINK, MSG_ERR_NOT_EXIST, MSG_ERR_WHEN_CREATE, MSG_ERR_WHEN_DELETE } from '../../../common/constants/message.constant';
import { CollectionInstanceMember } from '../../../common/entities/collection-instance-member.entity';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { ShareMember } from '../../../common/entities/share-member.entity';
import { IUser } from '../../../common/interfaces';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { CollectionInstanceMemberService } from '../collection-instance-member.service';
import * as FakeData from './fakeData';

const repoMockFactory = jest.fn(() => ({
  save: jest.fn((entity) => {
    return entity;
  }),
  createQueryBuilder: jest.fn(e => e),
  delete: jest.fn((entity) => {
    return { ...entity, affected: true };
  }),
  find: jest.fn((entity) => entity),
  findOne: jest.fn((entity) => entity),
  create: jest.fn((entity) => entity),
  insert: jest.fn((entity) => {
    return {
      raw: { insertId: entity.id }
    }
  }),
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
        databaseName: 'collection_id'
      },
      {
        databaseName: 'collection_share_member_id'
      },
      {
        color: 'access'
      },
      {
        favorite: 'shared_status'
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
const apiLastModifiedServiceMockFactory: () =>
  MockType<ApiLastModifiedQueueService> = jest.fn(() => ({}));

describe('CollectionInstanceMemberService', () => {
  let createQueryBuilder: any;
  let app: INestApplication;
  let instanceMemberService: CollectionInstanceMemberService;
  let repo: MockType<Repository<CollectionInstanceMember>>;
  let deletedItemService: DeletedItemService;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let shareMemberRepo: MockType<Repository<ShareMember>>;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;

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
        CollectionInstanceMemberService,
        DeletedItemService,
        DatabaseUtilitiesService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(CollectionInstanceMember),
          useFactory: repoMockFactory,
        },
        {
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory,
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory,
          useValue: {
            addJob: jest.fn((e) => e),
          },
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(ShareMember),
          useFactory: repoMockFactory,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    instanceMemberService = module.get<CollectionInstanceMemberService>(CollectionInstanceMemberService);
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    databaseUtilitiesService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    repo = module.get(getRepositoryToken(CollectionInstanceMember));
    shareMemberRepo = module.get(getRepositoryToken(ShareMember));
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    createQueryBuilder = {
      select: jest.fn(() => createQueryBuilder),
      addSelect: jest.fn(() => createQueryBuilder),
      leftJoin: jest.fn(() => createQueryBuilder),
      innerJoin: jest.fn(() => createQueryBuilder),
      where: jest.fn(() => createQueryBuilder),
      andWhere: jest.fn(() => createQueryBuilder),
      execute: jest.fn(() => createQueryBuilder),
      limit: jest.fn(() => createQueryBuilder),
      getMany: jest.fn(() => createQueryBuilder),
    };
    repo.createQueryBuilder = jest.fn(() => createQueryBuilder);
  });

  it('should be defined', () => {
    expect(instanceMemberService).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(databaseUtilitiesService).toBeDefined();
    expect(shareMemberRepo).toBeDefined();
    expect(apiLastModifiedQueueService).toBeDefined();
  });

  it('filterDuplicateItem should be return data error', async () => {
    const dto_1 = FakeData.fakeCreatedDTO();
    const resData = instanceMemberService.filterDuplicateItem([dto_1, dto_1]);
    expect(resData.dataFilter[0]).toEqual(dto_1);
    expect(resData.dataError[0]).toEqual(dto_1);
  });

  it('filterDuplicateItem should be return data without duplicate', async () => {
    const dto_1 = FakeData.fakeCreatedDTO();
    const dto_2 = FakeData.fakeCreatedDTO();
    const resData = instanceMemberService.filterDuplicateItem([dto_1, dto_2]);
    expect(resData.dataFilter).toEqual([dto_1, dto_2]);
    expect(resData.dataError).toHaveLength(0);
  });

  describe('get collection instances', () => {
    it('should get collection instance list return empty array', async () => {
      const filter = {
        page_size: 1100
      };
      databaseUtilitiesService.getAll = jest.fn().mockReturnValue([]);
      const result = await instanceMemberService.getAllFiles(filter, fakeReq);
      expect(databaseUtilitiesService.getAll).toBeCalledTimes(1);
      expect(result.data).not.toBeNull();
      expect(result.data).toHaveLength(0);
    });

    it('should get collection instance list', async () => {
      const entity1 = FakeData.fakeEntity();
      const entity2 = FakeData.fakeEntity();
      const filter = {
        page_size: 50,
        has_del: 1
      };
      databaseUtilitiesService.getAll = jest.fn().mockResolvedValue([entity1, entity2]);
      deletedItemService.findAll = jest.fn().mockReturnValue([]);

      const result = await instanceMemberService.getAllFiles(filter, fakeReq);
      expect(databaseUtilitiesService.getAll).toHaveBeenCalledWith({
        userId: user.userId,
        filter,
        repository: repo
      }, undefined);
      expect(databaseUtilitiesService.getAll).toBeCalledTimes(1);
      expect(result).toMatchObject({
        data: [entity1, entity2],
        data_del: []
      });
      expect(result.data).toHaveLength(2);
      expect(result.data[0].collection_id).toEqual(entity1.collection_id);
    });

    it('should get collection instance list with collection_id', async () => {
      const entity1 = FakeData.fakeEntity();
      const entity2 = FakeData.fakeEntity();
      const filter = {
        page_size: 50,
        collection_id: entity1.collection_id
      };
      databaseUtilitiesService.getAll = jest.fn().mockResolvedValue([entity1, entity2]);
      deletedItemService.findAll = jest.fn().mockReturnValue([]);

      const result = await instanceMemberService.getAllFiles(filter, fakeReq);

      expect(databaseUtilitiesService.getAll).toHaveBeenCalledWith({
        userId: user.userId,
        filter,
        repository: repo
      }, entity1.collection_id);
      expect(databaseUtilitiesService.getAll).toBeCalledTimes(1);
      expect(result.data[0]).toEqual(entity1);
      expect(result.data[0].collection_id).toEqual(entity1.collection_id);
    });
  });

  describe('Created collection instances', () => {
    const item_1 = FakeData.fakeCreatedDTO();
    const item_2 = FakeData.fakeCreatedDTO();
    const dataDto = [item_1, item_2];
    const entity1 = FakeData.fakeEntity();
    const entity2 = FakeData.fakeEntity();

    it('should be show duplicate entry', async () => {
      const dto_1 = FakeData.fakeCreatedDTO();
      const resData = await instanceMemberService.createInstanceMember([dto_1, dto_1], fakeReq);
      expect(resData.itemFail[0].code).toEqual(ErrorCode.DUPLICATE_ENTRY);
      expect(resData.itemFail[0].message).toEqual(MSG_ERR_DUPLICATE_ENTRY);
    });

    it('should be success created collection instances', async () => {
      shareMemberRepo.find = jest.fn().mockReturnValue({ id: entity1.collection_id });

      repo.create = jest.fn().mockResolvedValueOnce(plainToClass(CollectionInstanceMember, {
        user_id: user.userId,
        ...item_1,
        created_date: entity1.createDate,
        updated_date: entity1.createDate
      })).mockResolvedValueOnce(plainToClass(CollectionInstanceMember, {
        user_id: user.userId,
        ...item_2,
        created_date: entity2.createDate,
        updated_date: entity2.createDate
      }));

      repo.save = jest.fn().mockResolvedValueOnce(plainToClass(CollectionInstanceMember, {
        user_id: user.userId,
        ...entity1
      })).mockResolvedValueOnce(plainToClass(CollectionInstanceMember, {
        user_id: user.userId,
        ...entity2
      }));

      const result = await instanceMemberService.createInstanceMember(dataDto, fakeReq);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
      expect(result.itemPass).toHaveLength(2);
      expect(result.itemPass[0].ref).toEqual(item_1.ref);
      expect(result.itemPass[1].ref).toEqual(item_2.ref);
    });

    it('should return item fail with share user not existed', async () => {
      shareMemberRepo.find = jest.fn().mockReturnValue([]);

      const result = await instanceMemberService.createInstanceMember(dataDto, fakeReq);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
      expect(result.itemPass).toHaveLength(0);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_LINK.COLLECTION_NOT_EXIST);
      expect(result.itemFail[1].message).toEqual(MSG_ERR_LINK.COLLECTION_NOT_EXIST);
    });

    it('should return item fail with duplicate', async () => {
      shareMemberRepo.find = jest.fn().mockReturnValue([
        { id: entity1.collection_id },
        { id: entity2.collection_id }]);
      repo.findOne = jest.fn().mockReturnValue({ id: entity1.id });

      const result = await instanceMemberService.createInstanceMember(dataDto, fakeReq);
      expect(result.itemPass).toHaveLength(0);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_EXISTED);
      expect(result.itemFail[1].message).toEqual(MSG_ERR_EXISTED);
    });

    it('should return item fail with exception', async () => {
      shareMemberRepo.find = jest.fn().mockReturnValue(undefined);

      const result = await instanceMemberService.createInstanceMember(dataDto, fakeReq);
      expect(result.itemPass).toHaveLength(0);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_WHEN_CREATE);
      expect(result.itemFail[1].message).toEqual(MSG_ERR_WHEN_CREATE);
    });
  });

  describe('Update collection instances', () => {
    const item_1 = FakeData.fakeUpdatedDTO();
    const item_2 = FakeData.fakeUpdatedDTO();

    const entity1 = FakeData.fakeEntity();
    const entity2 = FakeData.fakeEntity();
    const dataDto = [item_1, item_2];
    it('should be success update collection instances', async () => {
      entity1.id = item_1.id;
      entity2.id = item_2.id;

      repo.findOne = jest.fn().mockReturnValueOnce(entity1)
        .mockReturnValueOnce(entity2);

      const result = await instanceMemberService.updateInstanceMember(dataDto, fakeReq);

      expect(result.itemPass).toHaveLength(2);
      expect(result.itemPass[0].id).toEqual(item_1.id);
      expect(result.itemPass[1].id).toEqual(item_2.id);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    });

    it('should return item fail with share user not existed', async () => {
      repo.findOne = jest.fn().mockReturnValue(undefined);

      const result = await instanceMemberService.updateInstanceMember(dataDto, fakeReq);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
      expect(result.itemPass).toHaveLength(0);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST);
      expect(result.itemFail[1].message).toEqual(MSG_ERR_NOT_EXIST);
    });

    it('should throw error when having query failed error', async () => {
      const queryFailedError = new QueryFailedError('', [], new Error());
      repo.findOne = jest.fn().mockImplementationOnce(() => {
        throw queryFailedError;
      })

      const result = await instanceMemberService.updateInstanceMember(dataDto, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[1].code).toEqual(ErrorCode.MEMBER_NOT_FOUND);
    });
  });

  describe('Delete collection instances', () => {
    const item_1 = FakeData.fakeDeleteDTO();
    const item_2 = FakeData.fakeDeleteDTO();

    const entity1 = FakeData.fakeEntity();
    const entity2 = FakeData.fakeEntity();
    const dataDto = [item_1, item_2];
    it('should be success delete collection instances', async () => {
      entity1.id = item_1.id;
      entity2.id = item_2.id;

      repo.findOne = jest.fn().mockReturnValueOnce(entity1)
        .mockReturnValueOnce(entity2);
      deletedItemService.create = jest.fn().mockReturnValueOnce({})
        .mockReturnValueOnce({})

      const result = await instanceMemberService.deleteInstanceBatch(dataDto, fakeReq);

      expect(result.itemPass).toHaveLength(2);
      expect(result.itemPass[0].id).toEqual(item_1.id);
      expect(result.itemPass[1].id).toEqual(item_2.id);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    });

    it('should return item fail with share user not existed', async () => {
      repo.findOne = jest.fn().mockReturnValue(undefined)
        .mockReturnValueOnce(entity2);
      deletedItemService.create = jest.fn().mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined)

      const result = await instanceMemberService.deleteInstanceBatch(dataDto, fakeReq);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
      expect(result.itemPass).toHaveLength(0);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST);
      expect(result.itemFail[1].message).toEqual(MSG_ERR_WHEN_DELETE);
    });

    it('should throw error when having query failed error', async () => {
      const queryFailedError = new QueryFailedError('', [], new Error());
      repo.findOne = jest.fn().mockImplementationOnce(() => {
        throw queryFailedError;
      })

      const result = await instanceMemberService.deleteInstanceBatch(dataDto, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[1].code).toEqual(ErrorCode.MEMBER_NOT_FOUND);
    });
  });

  describe('Delete deleteByColIdsAndUserId', () => {
    const item_1 = FakeData.fakeDeleteDTO();
    const item_2 = FakeData.fakeDeleteDTO();

    const entity1 = FakeData.fakeEntity();
    const entity2 = FakeData.fakeEntity();
    const dataDto = [item_1, item_2];
    it('should be success delete collection instances', async () => {
      entity1.id = item_1.id;
      entity2.id = item_2.id;

      repo.findOne = jest.fn().mockReturnValueOnce(entity1)
        .mockReturnValueOnce(entity2);
      repo.find = jest.fn().mockReturnValueOnce([
        { id: item_1.id },
        { id: item_2.id },
      ]);
      deletedItemService.create = jest.fn().mockReturnValueOnce({})
        .mockReturnValueOnce({})

      const result = await instanceMemberService.
        deleteByColIdsAndUserId([item_1.id, item_2.id], fakeReq);

      expect(result.itemPass).toHaveLength(2);
      expect(result.itemPass[0].id).toEqual(item_1.id);
      expect(result.itemPass[1].id).toEqual(item_2.id);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);

      const result2 = await instanceMemberService.
        deleteByColIdsAndUserId([], fakeReq);
    });

    it('should be success delete do not have collection instances', async () => {
      entity1.id = item_1.id;
      entity2.id = item_2.id;

      repo.findOne = jest.fn().mockReturnValueOnce(entity1)
        .mockReturnValueOnce(entity2);
      repo.find = jest.fn().mockReturnValueOnce([
      ]);
      deletedItemService.create = jest.fn().mockReturnValueOnce({})
        .mockReturnValueOnce({})

      const result = await instanceMemberService.
        deleteByColIdsAndUserId([item_1.id, item_2.id], fakeReq);
    });

  });

  afterAll(async () => {
    await app.close();
  });
});
