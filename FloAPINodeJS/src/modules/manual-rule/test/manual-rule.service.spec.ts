import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { ErrorCode } from '../../../common/constants/error-code';
import { ACTION_FLO_RULE } from '../../../common/constants/manual_rule.constant';
import { MSG_ERR_NOT_EXIST, MSG_ERR_WHEN_DELETE, MSG_ERR_WHEN_UPDATE } from '../../../common/constants/message.constant';
import { BaseGetDTO } from '../../../common/dtos/base-get.dto';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { RuleEntity } from '../../../common/entities/manual-rule.entity';
import { Users } from '../../../common/entities/users.entity';
import { IUser } from '../../../common/interfaces';
import { RuleRepository } from '../../../common/repositories/rule.repository';
import { ApiLastModifiedQueueService } from '../../../modules/bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../../../modules/database/database-utilities.service';
import { DeletedItemService } from '../../../modules/deleted-item/deleted-item.service';
import { LinkedCollectionObjectService } from '../../../modules/link/collection/linked-collection-object.service';
import { TrashService } from '../../../modules/trash/trash.service';
import { ManualRuleService } from '../manual-rule.service';
import { SieveEmailService } from '../sieve.email';
import { fakeCreatedDTO, fakeEntity, fakeExecuteDTO, fakeUpdatedDTO } from './fakeData';

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

const repoMockMailFactory: () => MockType<SieveEmailService> = jest.fn(
  () => ({
    sortByKey: jest.fn(e => e),
    modifyRuleConditions: jest.fn(),
    modifySieveRule: jest.fn(),
  }),
);

const repoMockFactory = jest.fn(() => ({
  save: jest.fn((entity) => {
    entity.id = 1;
    return entity;
  }),
  transaction: jest.fn(),
  createQueryBuilder: jest.fn(e => e),
  delete: jest.fn((entity) => {
    return { ...entity, affected: true };
  }),
  find: jest.fn((entity) => entity),
  findOne: jest.fn((entity) => entity),
  create: jest.fn((entity) => entity),
  remove: jest.fn((entity) => entity),
  update: jest.fn((entity) => entity),
  where: jest.fn((entity) => entity),
  checkExistCollection: jest.fn((entity) => true),
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
        databaseName: 'match_type'
      },
      {
        databaseName: 'order_number'
      },
      {
        databaseName: 'is_enable'
      },
      {
        databaseName: 'apply_all'
      },
      {
        databaseName: 'conditions'
      },
      {
        databaseName: 'destinations'
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
  }),
  findOne: jest.fn((entity) => {
    return { ...entity, id: 1 };
  }),
  find: jest.fn((entity) => {
    return [{ ...entity, id: 1 }];
  }),
}));

const apiLastModifiedQueueServiceMockFactory: () => MockType<ApiLastModifiedQueueService> = jest.fn(
  () => ({
    addJob: jest.fn((e) => e),
  }),
);

describe('SystemCollectionService', () => {
  let createQueryBuilder: any;
  let app: INestApplication;
  let repo: MockType<Repository<RuleEntity>>;
  let userRepo: MockType<Repository<Users>>;
  let manualRuleService: ManualRuleService;
  let sieveEmailService: SieveEmailService;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;
  let deletedItemService: DeletedItemService;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let linkedCollectionObjectService: LinkedCollectionObjectService;
  let trashService: TrashService;

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
        ManualRuleService,
        DeletedItemService,
        DatabaseUtilitiesService,
        {
          // how you provide the injection token in a test instance
          provide: RuleRepository,
          useFactory: repoMockFactory
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
          provide: SieveEmailService,
          useFactory: repoMockMailFactory,
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedQueueServiceMockFactory,
        },
        {
          provide: LinkedCollectionObjectService,
          useValue: {
            createBatchLinks: jest.fn((e) => e),
          },
        },
        {
          provide: TrashService,
          useValue: {
            saveBatch: jest.fn((e) => e),
          },
        },
        {
          provide: HttpService,
          useValue: spyHttpClient
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();


    manualRuleService = module.get<ManualRuleService>(ManualRuleService);
    sieveEmailService = module.get(SieveEmailService);
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    databaseUtilitiesService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    linkedCollectionObjectService = module.get(LinkedCollectionObjectService);
    trashService = module.get(TrashService);
    repo = module.get(getRepositoryToken(RuleRepository));
    userRepo = module.get(getRepositoryToken(Users));

    createQueryBuilder = {
      select: jest.fn(entity => createQueryBuilder),
      addSelect: jest.fn(entity => createQueryBuilder),
      addOrderBy: jest.fn(entity => createQueryBuilder),
      leftJoin: jest.fn(entity => createQueryBuilder),
      innerJoin: jest.fn(entity => createQueryBuilder),
      where: jest.fn(entity => createQueryBuilder),
      andWhere: jest.fn(entity => createQueryBuilder),
      execute: jest.fn(entity => createQueryBuilder),
      limit: jest.fn(entity => createQueryBuilder),
      getMany: jest.fn(entity => createQueryBuilder),
      setQueryRunner: jest.fn(entity => createQueryBuilder)
    };
    repo.createQueryBuilder = jest.fn(() => createQueryBuilder);
  });

  it('should be defined', () => {
    expect(manualRuleService).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(databaseUtilitiesService).toBeDefined();
  });

  it('should get manual rule list return empty array', async () => {
    const req = {
      modified_gte: 1,
      has_del: 1,
      page_size: 1,
    } as BaseGetDTO;
    databaseUtilitiesService.getAll = jest.fn().mockResolvedValue([]);
    deletedItemService.findAll = jest.fn().mockResolvedValue([]);
    const userId = fakeEntity().id;

    const result = await manualRuleService.getAllFiles(req, userId);
    expect(databaseUtilitiesService.getAll).toBeCalledTimes(1);
    expect(result.data).not.toBeNull();
    expect(result.data_del).not.toBeNull();
    expect(result.data).toHaveLength(0);
    expect(result.data_del).toHaveLength(0);
  });

  it('should findAll return manual rule array', async () => {
    const req = {
      page_size: 50,
      has_del: 1
    } as BaseGetDTO;
    const entities: Partial<RuleEntity>[] = [
      fakeEntity(), fakeEntity()
    ];
    const userId = fakeEntity().id;

    databaseUtilitiesService.getAll = jest.fn().mockResolvedValue(entities);
    deletedItemService.findAll = jest.fn().mockReturnValue([]);

    const result = await manualRuleService.getAllFiles(req, userId);

    expect(databaseUtilitiesService.getAll).toBeCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data_del).toHaveLength(0);
    result.data.forEach((e, idx) => {
      expect(e.id).toEqual(entities[idx].id);
      expect(e.name).toEqual(entities[idx].name);
      expect(e.created_date).toEqual(entities[idx].created_date);
      expect(e.updated_date).toEqual(entities[idx].updated_date);
    });
  });

  describe('Created manual rule', () => {
    const paramDtos = [fakeCreatedDTO(), fakeCreatedDTO()];
    const userId = fakeEntity().id;

    it('should throw error when having query failed error', async () => {
      repo.save = jest.fn().mockImplementationOnce(() => {
        throw Error;
      })

      createQueryBuilder.getMany.mockReturnValue([]);
      sieveEmailService.createMasterQueryRunner = jest.fn().mockImplementation(() => ({
        delete: jest.fn(),
        release: jest.fn()
      }));
      const result = await manualRuleService.createManualRule(paramDtos, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
    });

    it('should be create data', async () => {
      const fakeTotalItem = 2;

      databaseUtilitiesService.countItemByUser = jest.fn().mockResolvedValue(fakeTotalItem);
      createQueryBuilder.getMany.mockReturnValue([]);
      sieveEmailService.createMasterQueryRunner = jest.fn().mockImplementation(() => ({
        release: jest.fn()
      }));
      const result = await manualRuleService.createManualRule(paramDtos, fakeReq);

      paramDtos.forEach((item, idx) => {
        expect(result.itemPass[idx].id).toBeGreaterThan(0);
        expect(item.name).toEqual(result.itemPass[idx].name);
        expect(item.match_type).toEqual(result.itemPass[idx].match_type);
        expect(item.order_number).toEqual(result.itemPass[idx].order_number);
        expect(item.is_enable).toEqual(result.itemPass[idx].is_enable);
        expect(item.apply_all).toEqual(result.itemPass[idx].apply_all);
        expect(item.conditions).toEqual(result.itemPass[idx].conditions);
      });
    });
  });

  // describe('sortByKey', () => {
  //   const arr = [
  //     { action: 1, actionWeight: 999 },
  //     { action: 61, actionWeight: 0 },
  //   ];
  //   sieveEmailService.sortByKey(arr, 'actionWeight');
  //   expect(arr[0].actionWeight).toBeLessThan(arr[1].actionWeight);
  // });

  // describe('modifyRuleConditions is empty', () => {
  //   const data = undefined;
  //   sieveEmailService.modifyRuleConditions(data);
  //   expect(data).toEqual(undefined);
  // });

  describe('Created sieve script', () => {
    const paramDtos = [fakeCreatedDTO(), fakeCreatedDTO()];
    const userId = fakeEntity().id;

    it('should be request generate sieve "Subject" condition', async () => {
      createQueryBuilder.getMany.mockReturnValue([
        fakeEntity(1, 1),
        fakeEntity(2, 1),
        fakeEntity(1, 3),
        fakeEntity(2, 3),
        fakeEntity(1, 1, 60, "*example*"),
        fakeEntity(1, 1, 60, "*"),
        fakeEntity(1, 1, 60, "*example"),
        fakeEntity(1, 1, 60, "example*"),
        fakeEntity(2, 3, 61, "*@gmail.com"),
        fakeEntity(2, 1, 61, "abc@gmail.com"),
        fakeEntity(2, 1, 61, ""),
        fakeEntity(2, 1, 61, "abc"),
        fakeEntity(2, 3, 60),
        fakeEntity(2, 3, 61),
        fakeEntity(2, 3, 62)
      ]);

      sieveEmailService.createMasterQueryRunner = jest.fn().mockImplementation(() => ({
        release: jest.fn()
      }));

      const result = await manualRuleService.createManualRule(paramDtos, fakeReq);
      paramDtos.forEach((item, idx) => {
        expect(result.itemPass[idx].id).toBeGreaterThan(0);
        expect(item.name).toEqual(result.itemPass[idx].name);
        expect(item.match_type).toEqual(result.itemPass[idx].match_type);
        expect(item.order_number).toEqual(result.itemPass[idx].order_number);
        expect(item.is_enable).toEqual(result.itemPass[idx].is_enable);
        expect(item.apply_all).toEqual(result.itemPass[idx].apply_all);
        expect(item.conditions).toEqual(result.itemPass[idx].conditions);
      });
    });

    it('should not request generate sieve with un-supported condition', async () => {
      createQueryBuilder.getMany.mockReturnValue([
        fakeEntity(3, 3)
      ]);

      sieveEmailService.createMasterQueryRunner = jest.fn().mockImplementation(() => ({
        release: jest.fn()
      }));
      const result = await manualRuleService.createManualRule(paramDtos, fakeReq);
      paramDtos.forEach((item, idx) => {
        expect(result.itemPass[idx].id).toBeGreaterThan(0);
        expect(item.name).toEqual(result.itemPass[idx].name);
        expect(item.match_type).toEqual(result.itemPass[idx].match_type);
        expect(item.order_number).toEqual(result.itemPass[idx].order_number);
        expect(item.is_enable).toEqual(result.itemPass[idx].is_enable);
        expect(item.apply_all).toEqual(result.itemPass[idx].apply_all);
        expect(item.conditions).toEqual(result.itemPass[idx].conditions);
      });
    });

    it('should not request generate sieve', async () => {
      createQueryBuilder.getMany.mockReturnValue([]);
      sieveEmailService.createMasterQueryRunner = jest.fn().mockImplementation(() => ({
        release: jest.fn()
      }));
      const result = await manualRuleService.createManualRule(paramDtos, fakeReq);
      paramDtos.forEach((item, idx) => {
        expect(result.itemPass[idx].id).toBeGreaterThan(0);
        expect(item.name).toEqual(result.itemPass[idx].name);
        expect(item.match_type).toEqual(result.itemPass[idx].match_type);
        expect(item.order_number).toEqual(result.itemPass[idx].order_number);
        expect(item.is_enable).toEqual(result.itemPass[idx].is_enable);
        expect(item.apply_all).toEqual(result.itemPass[idx].apply_all);
        expect(item.conditions).toEqual(result.itemPass[idx].conditions);
      });
    });
  });

  describe('Execute manual rule', () => {
    const paramDtos = [fakeExecuteDTO(), fakeExecuteDTO()];

    it('should create link fail', async () => {
      linkedCollectionObjectService.createBatchLinks =
        jest.fn().mockResolvedValue({
          created: [paramDtos[1]],
          errors: [paramDtos[0]],
        });
      userRepo.find = jest.fn().mockResolvedValue([
        { id: 1, username: paramDtos[0].username },
        { id: 2, username: paramDtos[1].username }
      ]);
      const result = await manualRuleService.executeManualRule(paramDtos);
      expect(result.itemFail).toHaveLength(1);
      expect(result.itemPass).toHaveLength(1);
    });

    it('should throw error when having query failed error', async () => {
      linkedCollectionObjectService.createBatchLinks =
        jest.fn().mockResolvedValue({
          created: [paramDtos[1]],
          errors: [paramDtos[0]],
        });
      const result = await manualRuleService.executeManualRule(paramDtos);
      expect(result.itemFail).toHaveLength(2);
      expect(result.itemPass).toHaveLength(0);
    });

    it('should be Execute data', async () => {
      const fakeTotalItem = 2;

      linkedCollectionObjectService.createBatchLinks =
        jest.fn().mockResolvedValue({
          created: paramDtos,
          errors: []
        });
      userRepo.find = jest.fn().mockResolvedValue([
        { id: 1, username: paramDtos[0].username },
        { id: 2, username: paramDtos[1].username }
      ]);
      const result = await manualRuleService.executeManualRule(paramDtos);
      paramDtos.forEach((item, idx) => {
        expect(item.username).toEqual(result.itemPass[idx].username);
        expect(item.collection_id).toEqual(result.itemPass[idx].collection_id);
        expect(item.action).toEqual(result.itemPass[idx].action);
      });
    });

    it('should be Execute data trash', async () => {
      paramDtos[0].action = ACTION_FLO_RULE.move_to_trash;
      paramDtos[1].action = ACTION_FLO_RULE.move_to_trash;
      trashService.saveBatch =
        jest.fn().mockResolvedValue({
          results: paramDtos,
          errors: []
        });
      userRepo.find = jest.fn().mockResolvedValue([
        { id: 1, username: paramDtos[0].username },
        { id: 2, username: paramDtos[1].username }
      ]);
      const result = await manualRuleService.executeManualRule(paramDtos);
      paramDtos.forEach((item, idx) => {
        expect(item.username).toEqual(result.itemPass[idx].username);
        expect(item.action).toEqual(result.itemPass[idx].action);
      });
    });

    it('should be Execute data trash error', async () => {
      paramDtos[0].action = ACTION_FLO_RULE.move_to_trash;
      paramDtos[1].action = ACTION_FLO_RULE.move_to_trash;
      trashService.saveBatch =
        jest.fn().mockResolvedValue({
          results: paramDtos,
          errors: []
        });
      const result = await manualRuleService.executeManualRule(paramDtos);
      expect(result.itemFail).toHaveLength(2);
      expect(result.itemPass).toHaveLength(0);
    });
  });

  describe('Update manual rule', () => {
    const paramDto1 = fakeUpdatedDTO();
    const paramDto2 = fakeUpdatedDTO();
    const paramDtos = [paramDto1, paramDto2];
    const entity1 = fakeEntity();
    const entity2 = fakeEntity();
    const userId = fakeEntity().id;

    it('should throw error the item does not exist if item is not exised', async () => {
      repo.findOne.mockReturnValue(undefined);
      createQueryBuilder.getMany.mockReturnValue([]);
      sieveEmailService.createMasterQueryRunner = jest.fn().mockImplementation(() => ({
        release: jest.fn()
      }));
      const result = await manualRuleService.updateManualRule(paramDtos, fakeReq);
      expect(result.itemFail).not.toBeNull();
      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST)
    });

    it('should throw error when having query failed error', async () => {
      repo.save = jest.fn().mockImplementationOnce(() => {
        throw Error;
      })

      createQueryBuilder.getMany.mockReturnValue([]);
      sieveEmailService.createMasterQueryRunner = jest.fn().mockImplementation(() => ({
        release: jest.fn()
      }));
      const result = await manualRuleService.updateManualRule(paramDtos, fakeReq);
      expect(result.itemFail).toHaveLength(1);
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

      createQueryBuilder.getMany.mockReturnValue([]);
      sieveEmailService.createMasterQueryRunner = jest.fn().mockImplementation(() => ({
        release: jest.fn()
      }));

      const result = await manualRuleService.updateManualRule(paramDtos, fakeReq);
      expect(result.itemPass).toHaveLength(2);
      paramDtos.forEach((item, idx) => {
        expect(result.itemPass[idx].id).toBeGreaterThan(0);
        expect(item.name).toEqual(result.itemPass[idx].name);
        expect(item.match_type).toEqual(result.itemPass[idx].match_type);
        expect(item.order_number).toEqual(result.itemPass[idx].order_number);
        expect(item.is_enable).toEqual(result.itemPass[idx].is_enable);
        expect(item.apply_all).toEqual(result.itemPass[idx].apply_all);
        expect(item.conditions).toEqual(result.itemPass[idx].conditions);
      });
    });
  });

  describe('Delete manual rule', () => {
    it('should return systemNotFound', async () => {
      const data = [{ "id": 1 }];
      repo.findOne = jest.fn().mockReturnValueOnce(false);
      createQueryBuilder.getMany.mockReturnValue([]);
      sieveEmailService.createMasterQueryRunner = jest.fn().mockImplementation(() => ({
        release: jest.fn()
      }));
      const result = await manualRuleService.deleteManualRule(data, fakeReq);
      expect(result.itemFail[0].code).toEqual(ErrorCode.SYSTEM_NOT_FOUND);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST);
    });

    it('should delete item', async () => {
      const data = [{ "id": 1 }, { "id": 2 }];
      repo.findOne = jest.fn().mockReturnValue(true);
      createQueryBuilder.getMany.mockReturnValue([]);
      sieveEmailService.createMasterQueryRunner = jest.fn().mockImplementation(() => ({
        release: jest.fn()
      }));

      deletedItemService.create = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
      const result = await manualRuleService.deleteManualRule(data, fakeReq);

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
      createQueryBuilder.getMany.mockReturnValue([]);
      sieveEmailService.createMasterQueryRunner = jest.fn().mockImplementation(() => ({
        release: jest.fn()
      }));

      const result = await manualRuleService.deleteManualRule(data, fakeReq);
      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[1].code).toEqual(ErrorCode.BAD_REQUEST);
    });
  })

  afterAll(async () => {
    await app.close();
  });
});