import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { CIRTERION_TYPE } from '../../../common/constants';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_ERR_NOT_EXIST, MSG_ERR_WHEN_CREATE, MSG_ERR_WHEN_DELETE, MSG_ERR_WHEN_UPDATE } from '../../../common/constants/message.constant';
import { Collection } from '../../../common/entities/collection.entity';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { IdenticalSender } from '../../../common/entities/identical_sender.entity';
import { SuggestedCollection } from '../../../common/entities/suggested_collection.entity';
import { ThirdPartyAccount } from '../../../common/entities/third-party-account.entity';
import { IUser } from '../../../common/interfaces';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { SuggestedCollectionService } from '../suggested_collection.service';
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

const repoMockIdenticalSenderFactory: () => MockType<Repository<IdenticalSender>> = jest.fn(() => ({
  create: jest.fn(entity => entity),
  insert: jest.fn(entity => entity),
  createQueryBuilder: jest.fn(entity => entity),
  select: jest.fn(entity => entity),
  where: jest.fn(entity => entity),
}));
const repoMockCollectionFactory: () => MockType<Repository<Collection>> = jest.fn(() => ({
  findOne: jest.fn(entity => entity),
}));
const repoMockThirdPartyAccountFactory: () => MockType<Repository<ThirdPartyAccount>> = jest.fn(() => ({
  findOne: jest.fn(entity => entity),
}));

describe('SuggestedCollectionService', () => {
  let app: INestApplication;
  let suggCollectionService: SuggestedCollectionService;
  let repo: MockType<Repository<SuggestedCollection>>;
  let identicalSenderRepo: MockType<Repository<IdenticalSender>>;
  let collectionRepo: MockType<Repository<Collection>>;
  let thirdPartyAccountRepo: MockType<Repository<ThirdPartyAccount>>;
  let deletedItemService: DeletedItemService;
  let databaseUtilitiesService: DatabaseUtilitiesService;
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
        SuggestedCollectionService,
        DeletedItemService,
        DatabaseUtilitiesService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(SuggestedCollection),
          useFactory: repoMockFactory,
        },
        {
          provide: getRepositoryToken(IdenticalSender),
          useFactory: repoMockIdenticalSenderFactory
        },
        {
          provide: getRepositoryToken(Collection),
          useFactory: repoMockCollectionFactory
        },
        {
          provide: getRepositoryToken(ThirdPartyAccount),
          useFactory: repoMockThirdPartyAccountFactory
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
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    suggCollectionService = module.get<SuggestedCollectionService>(SuggestedCollectionService);
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    databaseUtilitiesService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    repo = module.get(getRepositoryToken(SuggestedCollection));
    identicalSenderRepo = module.get(getRepositoryToken(IdenticalSender));
    collectionRepo = module.get(getRepositoryToken(Collection));
    thirdPartyAccountRepo = module.get(getRepositoryToken(ThirdPartyAccount));
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
  });

  it('should be defined', () => {
    expect(suggCollectionService).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(databaseUtilitiesService).toBeDefined();
    expect(apiLastModifiedQueueService).toBeDefined();
  });

  describe('get collection instances', () => {
    it('should get collection instance list return empty array', async () => {
      const req = {
        page_size: 1100
      };
      databaseUtilitiesService.getAllSuggestedCollection = jest.fn().mockReturnValue([]);
      const result = await suggCollectionService.getAll(req, fakeReq);
      expect(databaseUtilitiesService.getAllSuggestedCollection).toBeCalledTimes(1);
      expect(result.data).not.toBeNull();
      expect(result.data).toHaveLength(0);
    });

    it('should get collection instance list', async () => {
      const entity1 = FakeData.fakeEntity();
      const entity2 = FakeData.fakeEntity();
      const req = {
        page_size: 50,
        has_del: 1
      };
      databaseUtilitiesService.getAllSuggestedCollection = jest.fn().mockResolvedValue([entity1, entity2]);
      deletedItemService.findAll = jest.fn().mockReturnValue([]);

      const result = await suggCollectionService.getAll(req, fakeReq);
      expect(databaseUtilitiesService.getAllSuggestedCollection).toHaveBeenCalledWith({
        userId: user.userId,
        filter: req,
        repository: repo
      });
      expect(databaseUtilitiesService.getAllSuggestedCollection).toBeCalledTimes(1);
      expect(result).toMatchObject({
        data: [entity1, entity2],
        data_del: []
      });
      expect(result.data).toHaveLength(2);
    });
  });

  describe('Created collection instances', () => {
    const item_1 = FakeData.fakeCreatedDTO();
    const item_2 = FakeData.fakeCreatedDTO();
    const paramDtos = [item_1, item_2];
    const entity1 = FakeData.fakeEntity();
    const entity2 = FakeData.fakeEntity();

    it('should return criterion_value equal blank when criterion_type is email', async () => {
      item_1.criterion_type = CIRTERION_TYPE.EVENT_INVITEE;
      item_1.criterion_value = [
        { email: "quang@gmail.com" },
        { email: "anh@mail.com" }
      ] as unknown as [];

      const result = await suggCollectionService.createBatch([item_1], fakeReq);
      expect(result.itemPass[0].criterion_value).toEqual("");
    });

    it('should return criterion_value has value when criterion_type is not email', async () => {
      item_1.criterion_type = CIRTERION_TYPE.EMAIL_TITILE;
      item_1.criterion_value = "data test";

      const result = await suggCollectionService.createBatch([item_1], fakeReq);

      expect(result.itemPass[0].criterion_value).toEqual("data test");
    });

    it('should throw error the item does not exist if collection_id is not exised', async () => {
      collectionRepo.findOne = jest.fn().mockReturnValue(undefined);

      const result = await suggCollectionService.createBatch([item_1], fakeReq);

      expect(result.itemFail[0].code).toEqual(ErrorCode.COLLECTION_NOT_FOUND);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST);
    });

    it('should throw error the item does not exist if account_id is not exised', async () => {
      item_1.collection_id = 0;
      thirdPartyAccountRepo.findOne = jest.fn().mockReturnValue(undefined);

      const result = await suggCollectionService.createBatch([item_1], fakeReq);

      expect(result.itemFail[0].code).toEqual(ErrorCode.THIRD_PARTY_ACCOUNT);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST);
    });

    it('should create success if collection_id is exised', async () => {
      collectionRepo.findOne = jest.fn().mockReturnValue(true);
      repo.create = jest.fn().mockReturnValueOnce(entity1).mockReturnValueOnce(entity2);

      const result = await suggCollectionService.createBatch(paramDtos, fakeReq);

      expect(result.itemPass).toHaveLength(2);
    });

    it('should throw error when having query failed error', async () => {
      collectionRepo.findOne = jest.fn().mockReturnValue(true);
      repo.create = jest.fn().mockReturnValueOnce(entity1).mockReturnValueOnce(entity2);
      repo.save = jest.fn().mockImplementationOnce(() => {
        throw Error;
      })

      const result = await suggCollectionService.createBatch(paramDtos, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_WHEN_CREATE);
    });
  });

  describe('Update suggested collection instances', () => {
    const item_1 = FakeData.fakeUpdatedDTO();
    const item_2 = FakeData.fakeUpdatedDTO();
    const paramDtos = [item_1, item_2];
    const entity1 = FakeData.fakeEntity();
    const entity2 = FakeData.fakeEntity();

    it('should throw error the item does not exist if item is not exised', async () => {
      repo.findOne.mockReturnValue(undefined);
      const result = await suggCollectionService.updateBatch(paramDtos, fakeReq);

      expect(result.itemFail).not.toBeNull();
      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST)
    });


    it('should be success update', async () => {
      entity1.id = item_1.id;
      entity2.id = item_2.id;
      beforeEach(async () => {
        repo.findOne = jest.fn().mockReturnValueOnce(entity1)
          .mockReturnValueOnce(entity2);
      });
      const result = await suggCollectionService.updateBatch(paramDtos, fakeReq);
      expect(result.itemPass).toHaveLength(2);
      paramDtos.forEach((item, idx) => {
        expect(result.itemPass[idx].id).toBeGreaterThan(0);
        expect(item.frequency_used).toEqual(result.itemPass[idx].frequency_used);
        expect(item.action_time).toEqual(result.itemPass[idx].action_time);
      });
    });

    it('should throw error when having query failed error', async () => {
      repo.save = jest.fn().mockImplementationOnce(() => {
        throw Error;
      })

      const result = await suggCollectionService.updateBatch(paramDtos, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_WHEN_UPDATE);
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

      const result = await suggCollectionService.deleteInstanceBatch(dataDto, fakeReq);

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

      const result = await suggCollectionService.deleteInstanceBatch(dataDto, fakeReq);
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

      const result = await suggCollectionService.deleteInstanceBatch(dataDto, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[1].code).toEqual(ErrorCode.VALIDATION_FAILED);
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

      const result = await suggCollectionService.
        deleteByColIdsAndUserId([item_1.id, item_2.id], fakeReq);

      expect(result.itemPass).toHaveLength(2);
      expect(result.itemPass[0].id).toEqual(item_1.id);
      expect(result.itemPass[1].id).toEqual(item_2.id);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);

      const result2 = await suggCollectionService.
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

      const result = await suggCollectionService.
        deleteByColIdsAndUserId([item_1.id, item_2.id], fakeReq);
    });

  });

  afterAll(async () => {
    await app.close();
  });
});
