import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { OBJ_TYPE } from '../../../common/constants';
import { BaseGetDTO } from '../../../common/dtos/base-get.dto';
import { EmailObjectId, GeneralObjectId, GmailObjectId } from '../../../common/dtos/object-uid';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import { ContactHistoryRepository } from '../../../common/repositories/contact-history.repository';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { ThirdPartyAccountService } from '../../third-party-account/third-party-account.service';
import { TrashService } from '../../trash/trash.service';
import { HistoryService } from '../history.service';

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

const fakeCreateHistory = {
  destination_object_uid: {
    uid: 123,
    path: 'Omni',
  },
  source_object_uid: '1234@gmail.com',
  source_object_type: 'RECEIVER',
  destination_object_type: 'EMAIL',
  source_account_id: 1,
  destination_account_id: 1,
  source_object_href: '/addressbookserver.php/addressbooks/floware@flodev.net/floware@flodev.net/',
  destination_object_href:
    '/addressbookserver.php/addressbooks/floware@flodev.net/floware@flodev.net/',
  action: 6,
  path: 'Sent',
  ref: '3700A1BD-EB0E-4B8E-84F9-06D63D672D2C',
};

const repoMockFactory = jest.fn(() => ({
  save: jest.fn((entity) => {
    entity.id = 1;
    return entity;
  }),
  find: jest.fn((entity) => entity),
  findOne: jest.fn((entity) => entity),
  create: jest.fn((entity) => entity),
  update: jest.fn((entity) => entity),
  metadata: {
    ownColumns: [
      {
        databaseName: 'id',
      },
      {
        databaseName: 'user_id',
      },
      {
        databaseName: 'source_account_id',
      },
      {
        databaseName: 'source_object_href',
      },
      {
        databaseName: 'destination_object_href',
      },
      {
        databaseName: 'action_data',
      },
      {
        databaseName: 'action',
      },
      {
        databaseName: 'source_object_uid',
      },
      {
        databaseName: 'destination_object_uid',
      },
      {
        databaseName: 'source_object_type',
      },
      {
        databaseName: 'destination_object_type',
      },
      {
        databaseName: 'destination_object_uid',
      },
      {
        databaseName: 'path',
      },
      {
        databaseName: 'created_date',
      },
      {
        databaseName: 'updated_date',
      },
    ],
  },
}));

const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({}));
const apiLastModifiedServiceMockFactory: () => MockType<ApiLastModifiedQueueService> = jest.fn(
  () => ({ addJob: jest.fn((entity) => entity) }),
);

describe('HistoryService', () => {
  let app: INestApplication;
  let historyService: HistoryService;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let repo: MockType<ContactHistoryRepository>;
  let deletedItemService: DeletedItemService;
  let thirdPartyAccountService: ThirdPartyAccountService;
  let trashService: TrashService;
  let logger: LoggerService;
  const user_id = 1;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        DeletedItemService,
        LoggerService,
        {
          provide: ContactHistoryRepository,
          useFactory: repoMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: DatabaseUtilitiesService,
          useValue: {
            getAll: jest.fn((e) => e),
          },
        },
        {
          provide: ThirdPartyAccountService,
          useValue: {
            getAll: jest.fn((e) => e),
          },
        },
        {
          provide: TrashService,
          useValue: {
            getIsTrash: jest.fn((e) => 1),
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

    historyService = module.get<HistoryService>(HistoryService);
    databaseUtilitiesService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    thirdPartyAccountService = module.get<ThirdPartyAccountService>(ThirdPartyAccountService);
    deletedItemService = module.get<any>(DeletedItemService);
    trashService = module.get<TrashService>(TrashService);
    repo = module.get(ContactHistoryRepository);
    logger = module.get<any>(LoggerService);
    logger.logError = jest.fn();
  });

  it('should be defined', () => {
    expect(historyService).toBeDefined();
    expect(trashService).toBeDefined();
  });

  it('should be get all file', async () => {
    databaseUtilitiesService.getAll = jest.fn().mockReturnValueOnce([]);
    deletedItemService.findAll = jest.fn().mockReturnValueOnce([]);
    const result = await historyService.getAllFiles({ has_del: 1 } as BaseGetDTO, user_id);
    expect(databaseUtilitiesService.getAll).toBeCalledTimes(1);
    expect(deletedItemService.findAll).toBeCalledTimes(1);
    expect(result.data).toEqual([]);
    expect(result.data_del).toEqual([]);
  });

  it('should convert des object', async () => {
    jest.spyOn(GmailObjectId.prototype, 'objectUid', 'get').mockReturnValue(null);
    const resultGmail = historyService.convertDesObject({}, OBJ_TYPE.GMAIL, false);
    expect(resultGmail).toEqual(null);

    jest.spyOn(EmailObjectId.prototype, 'objectUid', 'get').mockReturnValue(null);
    const resultEmail = historyService.convertDesObject({ uid: true, path: true }, OBJ_TYPE.EMAIL, false);
    expect(resultEmail).toEqual(null);

    jest.spyOn(GeneralObjectId.prototype, 'objectUid', 'get').mockReturnValue(null);
    const resultVevent = historyService.convertDesObject({ uid: true }, OBJ_TYPE.VEVENT, false);
    expect(resultVevent).toEqual(null);


    jest.spyOn(GeneralObjectId.prototype, 'objectUid', 'get').mockReturnValue(null);
    const resultEmailSpecial = historyService.convertDesObject(1111, OBJ_TYPE.EMAIL, true);
    expect(resultEmailSpecial).not.toEqual(null);

    jest.spyOn(GeneralObjectId.prototype, 'objectUid', 'get').mockReturnValue(null);
    const resultEmailSpecialNoObject = historyService.convertDesObject('string', OBJ_TYPE.EMAIL, true);
    expect(resultEmailSpecialNoObject).toEqual(null);

    jest.spyOn(GeneralObjectId.prototype, 'objectUid', 'get').mockReturnValue(null);
    const resultEmailPassSpecial = historyService.convertDesObject({ uid: true }, OBJ_TYPE.EMAIL, true);
    expect(resultEmailPassSpecial).toEqual(null);

  });

  it('should create history', async () => {
    thirdPartyAccountService.findOneById = jest
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);
    const rs1 = await historyService.createHistory([fakeCreateHistory] as any, fakeReq);
    expect(rs1.itemFail.length).toEqual(1);
    const rs2 = await historyService.createHistory(
      [{ ...fakeCreateHistory, destination_account_id: 0 }] as any,
      fakeReq

    );
    expect(rs2.itemFail.length).toEqual(1);
    repo.save = jest.fn().mockReturnValue({
      generatedMaps: [
        {
          id: 33785,
          order_number: -49.0851,
          order_update_time: 1655888103.36
        }, {
          id: 33786,
          order_number: -50.1137,
          order_update_time: 1655888103.361
        }
      ]
    });
    repo.isExist = jest.fn().mockResolvedValue(0);
    const rs3 = await historyService.createHistory(
      [{ ...fakeCreateHistory, destination_account_id: 0, source_account_id: 0 }] as any,
      fakeReq

    );
    expect(rs3.itemPass.length).toEqual(1);
    expect(rs3.itemFail.length).toEqual(0);
    expect(repo.save).toBeCalledTimes(1);
    repo.save = jest.fn().mockClear().mockRejectedValueOnce('fail');
    repo.isExist = jest.fn().mockResolvedValue(1);
    const rs4 = await historyService.createHistory(
      [{ ...fakeCreateHistory, destination_account_id: 0, source_account_id: 0 }] as any,
      fakeReq

    );
    expect(rs4.itemPass.length).toEqual(0);
    expect(rs4.itemFail.length).toEqual(1);
    expect(repo.save).toBeCalledTimes(0);
  });

  it('should create history2', async () => {
    thirdPartyAccountService.findOneById = jest
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);
    const rs1 = await historyService.createHistory([fakeCreateHistory] as any, fakeReq);
    expect(rs1.itemFail.length).toEqual(1);
    const rs2 = await historyService.createHistory(
      [{ ...fakeCreateHistory, destination_account_id: 0 }] as any,
      fakeReq
    );
    expect(rs2.itemFail.length).toEqual(1);
    repo.save = jest.fn().mockResolvedValueOnce(true);
    repo.isExist = jest.fn().mockResolvedValue(0);
    const rs3 = await historyService.createHistory(
      [{ ...fakeCreateHistory, destination_account_id: 0, source_account_id: 0 }] as any,
      fakeReq
    );
    expect(rs3.itemPass.length).toEqual(1);
    expect(rs3.itemFail.length).toEqual(0);
    expect(repo.save).toBeCalledTimes(1);
    repo.save = jest.fn().mockClear().mockRejectedValueOnce('fail');
    const rs4 = await historyService.createHistory(
      [{ ...fakeCreateHistory, destination_account_id: 0, source_account_id: 0 }] as any,
      fakeReq
    );
    expect(rs4.itemPass.length).toEqual(0);
    expect(rs4.itemFail.length).toEqual(1);
    expect(repo.save).toBeCalledTimes(1);
  });

  it('should delete history', async () => {
    const data: any = [{ id: 10 }, { id: 11 }, { id: 12 }, { id: 13 }];
    historyService.findItem = jest
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce('fail');
    deletedItemService.create = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    repo.delete = jest.fn().mockResolvedValueOnce(true);
    const rs = await historyService.deleteHistory(data, fakeReq);
    expect(historyService.findItem).toBeCalledTimes(4);
    expect(deletedItemService.create).toBeCalledTimes(2);
    expect(repo.delete).toBeCalledTimes(1);
    expect(rs.itemPass.length).toEqual(1);
    expect(rs.itemFail.length).toEqual(3);
  });

  it('should find item', async () => {
    repo.findOne = jest.fn().mockResolvedValueOnce(true);
    const rs = await historyService.findItem({});
    expect(rs).toEqual(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
