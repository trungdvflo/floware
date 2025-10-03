import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { datatype } from 'faker';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { DELETED_ITEM_TYPE } from '../../../common/constants';
import { GetAllFilter } from '../../../common/dtos/get-all-filter';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { ThirdPartyAccount } from '../../../common/entities/third-party-account.entity';
import { IUser } from '../../../common/interfaces';
import { LoggerModule } from '../../../common/logger/logger.module';
import { LoggerService } from '../../../common/logger/logger.service';
import { ThirdPartyAccountRepo } from '../../../common/repositories/third-party-account.repository';
import { ThirdPartyQueueService } from '../../../modules/bullmq-queue/third-party-account.queue.service';
import { DatabaseUtilitiesService } from '../../../modules/database/database-utilities.service';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { ACCOUNT_TYPE } from '../contants';
import { CreateThirdPartyAccountDto } from '../dto/create-third-party-account.dto';
import { TypeAccountSync } from '../dto/third-party-account.dto';
import { UpdateThirdPartyAccountDto } from '../dto/update-third-party-account.dto';
import { ThirdPartyAccountService } from '../third-party-account.service';

const dataCreate: CreateThirdPartyAccountDto[] = [{
  created_date: new Date().getTime() / 1000,
  updated_date: new Date().getTime() / 1000,
  user_id: 1,
  user_income: 'abc@yahoo.com',
  port_income: 993,
  user_smtp: 'def@gmail.com',
  port_smtp: '465',
  auth_type_smtp: 256,
  user_caldav: 'xyz@abc.com',
  port_caldav: '993',
  auth_type: 256,
  account_type: 1,
  account_sync: new TypeAccountSync(),
  ref: 'abc',
  server_income: '',
  use_ssl_income: 1,
  type_income: 1,
  server_smtp: '',
}];

const dataUpdate: UpdateThirdPartyAccountDto[] = [
  {
    id: 1,
    updated_date: new Date().getTime() / 1000,
    user_income: 'abc@yahoo.com',
    port_income: 993,
    pass_income: 'abc123',
    user_smtp: 'def@gmail.com',
    port_smtp: 465,
    auth_type_smtp: 256,
    pass_smtp: '123',
    user_caldav: 'xyz@abc.com',
    port_caldav: 993,
    auth_type: 256,
    account_type: 1,
    account_sync: new TypeAccountSync(),
  },
];
const thirdPartyJobMockFactory: () => MockType<ThirdPartyQueueService> = jest.fn(
  () => ({
    addJob: jest.fn((entity) => entity),
  }),
);

const apiLastModifiedQueueServiceMockFactory: () => MockType<ApiLastModifiedQueueService> = jest.fn(
  () => ({
    addJob: jest.fn((entity) => entity),
  }),
);

const repoMockFactory: () => MockType<Repository<ThirdPartyAccount>> = jest.fn(() => ({
  create: jest.fn((entity) => {
    return dataCreate;
  }),
  query: jest.fn((entity) => {
    return Promise.resolve([{ is_existed: 1 }]);
  }),
  update: jest.fn((a, entity) => {
    return dataUpdate;
  }),
  count: jest.fn((entity) => {
    return entity;
  }),
  findAll: jest.fn((entity) => {
    return entity;
  }),
  findOne: jest.fn((entity) => {
    return dataUpdate[0];
  }),
  findAllv2: jest.fn((entity) => {
    return entity;
  }),
  save: jest.fn(entity => entity),
  delete: jest.fn(entity => ({ affected: 1 })),
  removeNullProperties: jest.fn(entity => entity),
  updateAndReturn: jest.fn(entity => entity),
  insert3rdPatrtyAccount: jest.fn((entity) => {
    return Promise.resolve({ identifiers: [{ id: entity.id }], raw: { insertId: entity.id } });
  }),
  save3rdPatrtyAccount: jest.fn((entity) => {
    return Promise.resolve({ identifiers: [{ id: entity.id }], raw: { insertId: entity.id } });
  }),
  find: jest.fn((entity) => {
    return dataUpdate;
  }),
  findAllSettingByUserID: jest.fn((entity) => {
    return entity;
  }),
  eachCreate: jest.fn((entity) => {
    return entity;
  }),
  metadata: jest.fn((entity) => {
    return {
      tableName: 'third_party_account',
    };
  }),
}));

const fakeUserId = () => datatype.number({ min: 1 });

const fakeUser = (): IUser => {
  return {
    id: 1,
    userId: 1,
    userAgent: '',
    email: 'abc@flomail.net',
    deviceUid: '',
    appId: '',
    token: ''
  };
};

describe('ThirdPartyAccount', () => {
  let app: INestApplication;
  let TService: ThirdPartyAccountService;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;
  let deletedItemService: MockType<DeletedItemService>;
  let thirdPartyRepo: ThirdPartyAccountRepo;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let logger: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        LoggerService,
        ThirdPartyAccountService,
        DeletedItemService,
        {
          provide: ThirdPartyAccountRepo,
          useFactory: repoMockFactory,
        },
        {
          provide: ThirdPartyQueueService,
          useFactory: thirdPartyJobMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedQueueServiceMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: DatabaseUtilitiesService,
          useValue: {
            getAll: jest.fn((e) => e),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    deletedItemService = module.get(DeletedItemService);
    TService = module.get<ThirdPartyAccountService>(ThirdPartyAccountService);
    databaseUtilitiesService = module.get<any>(DatabaseUtilitiesService);
    thirdPartyRepo = module.get(ThirdPartyAccountRepo);
    logger = module.get<LoggerService>(LoggerService);
    logger.logError = jest.fn();
  });
  it('should be defined ThirdPartyAccount', () => {
    expect(TService).toBeDefined();
  });
  describe('GET: ThirdPartyAccount', () => {
    it('should be success get all ThirdPartyAccount', async () => {
      const filter: GetAllFilter<ThirdPartyAccount> = {
        page_size: 2,
        has_del: 1,
        ids: [1, 2],
        modified_gte: 1247872251.212,
        modified_lt: 1247872251.212,
      };
      const userId = fakeUserId();

      databaseUtilitiesService.getAll = jest.fn().mockReturnValue([]);
      deletedItemService.findAll = jest.fn().mockResolvedValue([]);
      const pkey = await TService.findAll(userId, filter);
      expect(deletedItemService.findAll).toHaveBeenCalledWith(userId, DELETED_ITEM_TYPE.SET_3RD_ACC, {
        modified_gte: filter.modified_gte,
        modified_lt: filter.modified_lt,
        ids: filter.ids,
        page_size: filter.page_size,
      });
      expect(pkey).toMatchObject({ data: [], data_del: [] });
    });

    it('should be fail findAll ThirdPartyAccount', async () => {
      const filter: GetAllFilter<ThirdPartyAccount> = {
        page_size: 2,
        has_del: 1,
        ids: [1, 2],
        modified_gte: 1247872251.212,
        modified_lt: 1247872251.212,
      };
      try {
        const pkey = await TService.findAll(undefined, filter);
        expect(pkey).toThrow(TypeError);
      } catch (e) { }
    });

    it('should be success findAllByUserId ThirdPartyAccount', async () => {
      const userId = fakeUserId();
      const pkey = await TService.findAllByUserId({ userId, ids: [1] }, [], 'a');
      expect(pkey[0].account_sync).toMatchObject(dataCreate[0].account_sync);
      expect(pkey[0].account_type).toEqual(dataCreate[0].account_type);
    });
  });

  describe('POST: ThirdPartyAccount', () => {
    it('should be create fail ThirdPartyAccount with flomail', async () => {
      const user = fakeUser();
      const pkey = await TService.create([{
        ...dataCreate[0],
        user_income: 'aaaaaaaabc@flomail.net',
        account_type: 7
      }], fakeReq);
      expect(pkey).toMatchObject(pkey);
    });

    it('should be success create ThirdPartyAccount', async () => {
      const user = fakeUser();
      const pkey = await TService.create(dataCreate, fakeReq);
      expect(pkey).toMatchObject(pkey);
    });

    it('should be success one create ThirdPartyAccount', async () => {
      const pkey = await TService.eachCreate(dataCreate[0]);
      expect(thirdPartyRepo.save3rdPatrtyAccount).toBeCalledTimes(1);
      // expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
      expect(pkey).toMatchObject(pkey);
    });
  });

  describe('PUT: ThirdPartyAccount', () => {

    it('should be success update ThirdPartyAccount', async () => {
      const user = fakeUser();
      const res = await TService.update(dataUpdate, fakeReq);
      expect(res).not.toBeNull();
      expect(res.rok).not.toBeNull();
    });

    it('should be update ThirdPartyAccount invalid flo mail', async () => {
      const user = fakeUser();
      user.email = 'abc@gmail.com';
      dataUpdate[0].account_type = ACCOUNT_TYPE.OtherEmail;
      const res = await TService.update(dataUpdate, fakeReq);
      expect(res).not.toBeNull();
      expect(res.rok).not.toBeNull();
    });

    it('should be update ThirdPartyAccount not found', async () => {
      const user = fakeUser();
      thirdPartyRepo.updateAndReturn = jest.fn().mockResolvedValue(false);
      const res = await TService.update(dataUpdate, fakeReq);
      expect(res).not.toBeNull();
      expect(res.rok).not.toBeNull();
    });

    it('should be fail update ThirdPartyAccount', async () => {
      let res = await TService.update(dataUpdate, fakeReq);
      expect(res).not.toBeNull();
      expect(res.rer).not.toBeNull();
      try {
        res = await TService.update(null, null);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });
  });

  describe('DELETE: ThirdPartyAccount', () => {
    it('should be success delete ThirdPartyAccount error', async () => {
      const user = fakeUser();
      const dataDels = [{ id: 1 }, { id: 1 }];
      const res = await TService.delete(dataDels, fakeReq);
      expect(res).not.toBeNull();
      expect(res.itemFail).not.toBeNull();
      expect(res.itemPass).not.toBeNull();
    });

    it('should be success delete ThirdPartyAccount error affected', async () => {
      const user = fakeUser();
      const dataDels = [{ id: 1 }, { id: 1 }];
      const res = await TService.delete(dataDels, fakeReq);
      expect(res).not.toBeNull();
      expect(res.itemFail).not.toBeNull();
      expect(res.itemPass).not.toBeNull();
    });

    it('should be success delete ThirdPartyAccount', async () => {
      const user = fakeUser();
      const dataDels = [{ id: 1 }];
      const res = await TService.delete(dataDels, fakeReq);
      expect(res).not.toBeNull();
      expect(res.itemFail).not.toBeNull();
      expect(res.itemPass).not.toBeNull();
    });
  });

  describe('GET: ThirdPartyAccount Find one', () => {

    it('should be success findOneById ', async () => {
      const userId = fakeUserId();
      const pkey = await TService.findOneById(userId, 1);
      expect(thirdPartyRepo.findOne).toBeCalledTimes(1);
      expect(thirdPartyRepo.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          user_id: userId,
        },
      });
      expect(pkey).toMatchObject(dataUpdate[0]);
    });

    it('should be success findByIds ', async () => {
      const userId = fakeUserId();
      const ids = [1];
      const pkey = await TService.findByIds(userId, ids);
      expect(thirdPartyRepo.find).toBeCalledTimes(1);
      expect(pkey.length).toEqual(1);
    });
  });

  describe('PUT: ThirdPartyAccount Existed', () => {

    it('should be success isExist ', async () => {
      const pkey = await TService.isExist(1, 1);
      expect(pkey).toEqual(1);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
