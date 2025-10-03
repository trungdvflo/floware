import { BullModule } from '@nestjs/bull';
import { BadRequestException, CacheModule, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { SORT_OBJECTS_STATE } from '../../../common/constants/common';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_ERR_DUPLICATE_ENTRY, MSG_FIND_NOT_FOUND, MSG_ITEM_IS_IN_DELETED_ITEM_COLLECTION, SortObjectResponseMessage } from '../../../common/constants/message.constant';
import { CalendarObjects } from '../../../common/entities/calendar-objects.entity';
import { Cloud } from '../../../common/entities/cloud.entity';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { KanbanCard } from '../../../common/entities/kanban-card.entity';
import { Kanban } from '../../../common/entities/kanban.entity';
import { SortObject } from '../../../common/entities/sort-object.entity';
import { Url } from '../../../common/entities/urls.entity';
import { IObjectOrder, ITodoObjectOrder } from '../../../common/interfaces/object-order.interface';
import { IUser } from '../../../common/interfaces/user';
import { LoggerService } from '../../../common/logger/logger.service';
import { CalendarObjectsRepository } from '../../../common/repositories/calendar-objects.repository';
import { KanbanCardRepository } from '../../../common/repositories/kanban-card.repository';
import { SortObjectRepository } from '../../../common/repositories/sort-object.repository';
import { UrlRepository } from '../../../common/repositories/url.repository';
import { CacheUtil } from '../../../common/utils/cache.util';
import { ApiLastModifiedQueueService } from '../../../modules/bullmq-queue/api-last-modified-queue.service';
import { SortObjectQueueService } from '../../bullmq-queue/sort-object-queue.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { ThirdPartyAccountService } from '../../third-party-account/third-party-account.service';
import { BadRequestSortObjectError } from '../sort-object.error';
import { SortObjectService } from '../sort-object.service';

jest.mock('bull');

const repositoryMockFactory: () => MockType<SortObjectRepository> = jest.fn(() => ({
  findByObjUid: jest.fn(entity => entity),
  delete: jest.fn(entity => entity),
  find: jest.fn(entity => entity),
  findOne: jest.fn((id: number) => id),
  save: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  insert: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  remove: jest.fn(entity => entity),
  createQueryBuilder: jest.fn(entity => {
    entity = {};
    entity.select = (jest.fn(e => e));
    entity.where = (jest.fn(e => e));
    entity.getRawOne = (jest.fn(() => {
      const res = {
        max: 10
      };
      return res;
    }));
    return entity;
  }),
}));

const apiLastModifiedServiceMockFactory: () => MockType<ApiLastModifiedQueueService> = jest.fn(() => ({
  addJob: jest.fn(entity => entity),
}));
const sortObjectQueueServiceMockFactory: () => MockType<SortObjectQueueService> = jest.fn(() => ({
  addSortObjectJob: jest.fn(entity => entity),
  addResetOrderJob: jest.fn(entity => entity),
}));

const deletedItemRepositoryMockFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({
  save: jest.fn((entity) => entity),
  find: jest.fn((entity) => entity),
  insert: jest.fn((entity) => entity),
}));

BullModule.forRootAsync = jest.fn();
describe('SortObjectsService', () => {
  let app: INestApplication;
  let repository: MockType<SortObjectRepository>;
  let service: SortObjectService;
  let deletedItemService: DeletedItemService;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let thirdPartyAccountService: ThirdPartyAccountService;
  let urlRepository: MockType<Repository<Url>>;
  let cloudRepository: MockType<Repository<Cloud>>;
  let kanbanRepository: MockType<Repository<Kanban>>
  let kanbanCardRepository: KanbanCardRepository;
  let calendarObjectsRepository: CalendarObjectsRepository;
  let cache: { get; set; store; };
  let loggerService: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({}),
      ],
      providers: [
        LoggerService,
        SortObjectService,
        DatabaseUtilitiesService,
        {
          provide: ThirdPartyAccountService,
          useFactory: repositoryMockFactory,
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory,
        },
        {
          provide: SortObjectQueueService,
          useFactory: sortObjectQueueServiceMockFactory,
        },
        DeletedItemService,
        {
          provide: getRepositoryToken(CalendarObjects),
          useFactory: repositoryMockFactory,
        },
        {
          provide: SortObjectRepository,
          useFactory: repositoryMockFactory
        },
        {
          provide: UrlRepository,
          useFactory: deletedItemRepositoryMockFactory,
        },
        {
          provide: getRepositoryToken(Cloud),
          useFactory: deletedItemRepositoryMockFactory,
        },
        {
          provide: getRepositoryToken(Kanban),
          useFactory: repositoryMockFactory,
        },
        {
          provide: getRepositoryToken(KanbanCard),
          useFactory: repositoryMockFactory,
        },
        {
          provide: getRepositoryToken(SortObject),
          useFactory: repositoryMockFactory,
        },
        {
          provide: getRepositoryToken(DeletedItem),
          useFactory: deletedItemRepositoryMockFactory,
        },
        {
          provide: DatabaseUtilitiesService,
          useValue: {
            findTodoObjectOrders: jest.fn((e) => e),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    repository = module.get(getRepositoryToken(SortObjectRepository));
    service = module.get<SortObjectService>(SortObjectService);
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    urlRepository = module.get(UrlRepository);
    cloudRepository = module.get(getRepositoryToken(Cloud));
    thirdPartyAccountService = module.get<ThirdPartyAccountService>(ThirdPartyAccountService);
    kanbanRepository = module.get(getRepositoryToken(Kanban));
    kanbanCardRepository = module.get(getRepositoryToken(KanbanCard));
    calendarObjectsRepository = module.get(getRepositoryToken(CalendarObjects));
    databaseUtilitiesService = module.get<any>(DatabaseUtilitiesService);
    loggerService = module.get<LoggerService>(LoggerService);
    loggerService.logError = jest.fn();
    cache = module.get<{ get; set; store; }>('CACHE_MANAGER');

  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(cache).toBeDefined();
    expect(thirdPartyAccountService).toBeDefined();
    expect(urlRepository).toBeDefined();
    expect(cloudRepository).toBeDefined();
    expect(databaseUtilitiesService).toBeDefined();
    expect(cloudRepository).toBeDefined();
    expect(kanbanRepository).toBeDefined();
    expect(urlRepository).toBeDefined();
    expect(kanbanCardRepository).toBeDefined();
    expect(calendarObjectsRepository).toBeDefined();
  });

  it('should be call isDuplicate', () => {
    const data = [{ order_number: 1 }, { order_number: 2 }, { order_number: 1 }]
    const resData = service.isDuplicate(data, 'VTODO');
    expect(resData).not.toBeNull()
  });

  it('should be call sendQueueToWorker', () => {
    const request_uid = '8d39740e-c2d5-4856-a5b1-7c5551107ed1';
    const user: IUser = {
      id: 1,
      appId: 'test',
      deviceUid: 'testdevice',
      userId: 1,
      email: 'quangndn@flomail.net',
      userAgent: '',
      token: ''
    };
    const object_type = 'VTODO';
    const itemPass = [{
      "order_number": 15,
      "object_uid": "85dc-5bac-38ca49432089-46ab-0d6440011",
      "order_update_time": 1566464330.817,
      "account_id": 88321,
      "object_href": "/calendarserver.php/calendars/auto.api_user3@flouat.net/d213dd00-dc9f-11eb-8f7c-99c3a377cf97"
    }]
    const resData = service.sendQueueToWorker(request_uid, user, itemPass, object_type);
    expect(resData).not.toBeNull()
  });

  it('should call checkStatus and success', async () => {
    jest.spyOn(CacheUtil, 'getCachePatterns').mockImplementation(() => {
      return '';
    });
    cache.get = jest.fn().mockResolvedValueOnce('success');
    const rs = await service.checkStatus('fake', 1);
    expect(rs.status).not.toBeNull()
  });


  it('should getObjectOrders', async () => {
    const req = {
      page_size: 10,
      has_del: 1,
      modified_gte: 1247872251.212,
      modified_lt: 1247872251.212,
      ids: []
    }
    databaseUtilitiesService.findTodoObjectOrders = jest.fn().mockReturnValue([]);
    deletedItemService.findAll = jest.fn().mockReturnValue([]);

    await service.getTodoOrders(req, fakeReq);
    expect(databaseUtilitiesService.findTodoObjectOrders).toBeCalledTimes(1);
    expect(deletedItemService.findAll).toBeCalledTimes(1);
  });

  it('should getObjectOrders and throw internal error', async () => {
    const req = {
      page_size: 10,
      has_del: 1,
      modified_gte: 1247872251.212,
      modified_lt: 1247872251.212,
      ids: []
    }
    const queryFailedError = new QueryFailedError('', [], new Error());
    databaseUtilitiesService.findTodoObjectOrders = jest.fn().mockImplementationOnce(() => {
      throw queryFailedError;
    })
    try {
      await service.getTodoOrders(req, fakeReq);
    } catch (e) {
      expect(e).toEqual(e);
    }
  });


  it('should delete sort item ', async () => {
    const data = [{ "id": 1 }, { "id": 2 }, { "id": 3 }, { "id": 4 }];
    repository.findOne = jest.fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ id: 2 })
      .mockReturnValueOnce(true)
      .mockRejectedValueOnce({ message: 'fail' });
    deletedItemService.create = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
    deletedItemService.findMaxUpdatedDate = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          getRawOne: jest.fn().mockReturnValue(1)
        })
      })
    });
    repository.delete = jest.fn().mockReturnValueOnce(true);
    const result = await service.deleteSortItems(data, fakeReq);
    expect(repository.findOne).toBeCalledTimes(4);
    expect(deletedItemService.create).toBeCalledTimes(2);
    expect(result.itemFail.length).toEqual(3);
    expect(result.itemPass.length).toEqual(1);
    expect(result.itemPass[0].id).toEqual(2);
  });

  it('should checkStatus and success', async () => {
    jest.spyOn(CacheUtil, 'getCachePatterns').mockImplementation(() => {
      return '';
    });
    cache.get = jest.fn().mockResolvedValueOnce('success');
    const rs = await service.checkStatus('fake', 1);
    expect(rs.status).toEqual('success');
  });

  it('should checkStatus and fail', async () => {
    jest.spyOn(CacheUtil, 'getCachePatterns').mockImplementation(() => {
      return '';
    });
    cache.get = jest.fn().mockResolvedValueOnce(false);
    try {
      await service.checkStatus('fake', 1);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestSortObjectError);
      expect(e.code).toEqual(ErrorCode.INVALID_REQUEST_UID);
      expect(e.message).toEqual(SortObjectResponseMessage.INVALID_REQUEST_UID);
    }

  });

  it('should getResetOrderStatus and success', async () => {
    CacheUtil.getCacheOrderKey = jest.fn().mockReturnValue('');
    cache.get = jest.fn().mockResolvedValueOnce({
      status: '',
    })
    const rs: any = await service.getResetOrderStatus(0, '', '');
    expect(rs.status).toEqual('');
  });

  it('should getResetOrderStatus and fail not found', async () => {
    CacheUtil.getCacheOrderKey = jest.fn().mockReturnValue('');
    cache.get = jest.fn().mockResolvedValueOnce({});
    try {
      const rs: any = await service.getResetOrderStatus(0, '', '');
    } catch (e: BadRequestException | any) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });

  it('should check isResetOrderRunning and result is true', async () => {
    cache.store.keys = jest.fn().mockResolvedValueOnce([]);
    const rs: any = await service.isResetOrderRunning(0, '');
    expect(rs).toEqual(false);
  });

  it('should check isResetOrderRunning and result is true', async () => {
    cache.store.keys = jest.fn().mockResolvedValueOnce(['fake']);
    cache.get = jest.fn().mockResolvedValueOnce({
      status: SORT_OBJECTS_STATE.IN_PROCESS.toString()
    })
    const rs: any = await service.isResetOrderRunning(0, '');
    expect(rs).toEqual(true);
  });

  it('should resetOrder and success', async () => {
    service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
    cache.set = jest.fn();
    const rs: any = await service.resetOrder(0, '');
    expect(rs.data).toBeDefined();
    expect(rs.data.request_uid).toBeDefined();
  });

  it('should resetOrder and fail by already have running process', async () => {
    service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(true);
    cache.set = jest.fn();
    try {
      await service.resetOrder(0, '');
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.response.error.message).toEqual(SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS);
    }
  });

  describe('setCloudObjectOrder', () => {
    const request_uid = '8d39740e-c2d5-4856-a5b1-7c5551107ed1';
    const user: IUser = {
      id: 1,
      appId: 'test',
      deviceUid: 'testdevice',
      userId: 1,
      email: 'quangndn@flomail.net',
      userAgent: '',
      token: ''
    };
    const object_type = 'CSFILE';

    it('should return worker is running', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(true);

      const result = await service.setCloudObjectOrder(objectData, user, request_uid);
      expect(result.errors[0].message).toEqual(SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS);
    });

    it('should return duplicateEntry', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);

      const result = await service.setCloudObjectOrder(objectData, user, request_uid);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_DUPLICATE_ENTRY);
    });

    it('should return not found item', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      cloudRepository.findOne = jest.fn().mockResolvedValueOnce(undefined);

      const result = await service.setCloudObjectOrder(objectData, user, request_uid);
      expect(result.itemFail[0].message).toEqual(MSG_FIND_NOT_FOUND);
    });

    it('should return item is in deleted item', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      cloudRepository.findOne = jest.fn().mockResolvedValue(true);
      deletedItemService.findOneByItemId = jest.fn().mockResolvedValue(true);

      const result = await service.setCloudObjectOrder(objectData, user, request_uid);

      expect(result.itemFail[0].message).toEqual(MSG_ITEM_IS_IN_DELETED_ITEM_COLLECTION);
    });

    it('should sort success', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      cloudRepository.findOne = jest.fn().mockResolvedValue(true);
      deletedItemService.findOneByItemId = jest.fn().mockResolvedValue(false);

      const result = await service.setCloudObjectOrder(objectData, user, request_uid);

      expect(result.itemPass[0]).toEqual(objectData.data[0]);
    });

    it('should throw error', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }], object_type,
      };
      const error = new Error('UNKNOWN ERROR');
      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      cloudRepository.findOne = jest.fn().mockResolvedValue(() => {
        throw error;
      });

      try {
        await service.setCloudObjectOrder(objectData, user, request_uid);
      } catch (e) {
        expect(e).toEqual(e);
      }
    });
  });

  describe('setKanbanObjectOrder', () => {
    const request_uid = '8d39740e-c2d5-4856-a5b1-7c5551107ed1';
    const user: IUser = {
      id: 1,
      appId: 'test',
      deviceUid: 'testdevice',
      userId: 1,
      email: 'quangndn@flomail.net',
      userAgent: '',
      token: ''
    };
    const object_type = 'KANBAN';

    it('should return worker is running', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(true);

      const result = await service.setKanbanObjectOrder(objectData, user, request_uid);
      expect(result.errors[0].message).toEqual(SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS);
    });

    it('should return duplicateEntry', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);

      const result = await service.setKanbanObjectOrder(objectData, user, request_uid);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_DUPLICATE_ENTRY);
    });

    it('should return not found item', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      kanbanRepository.find = jest.fn().mockResolvedValue([]);

      const result = await service.setKanbanObjectOrder(objectData, user, request_uid);
      expect(result.itemFail[0].message).toEqual(MSG_FIND_NOT_FOUND);
    });

    it('should sort success', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }], object_type,
      };

      const kanBanData = [
        { 'collection_id': 2, 'id': 2 },
        { 'collection_id': 1, 'id': 1 }];

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      kanbanRepository.find = jest.fn().mockResolvedValue(kanBanData);

      const result = await service.setKanbanObjectOrder(objectData, user, request_uid);

      expect(result.itemPass[0]).toEqual(objectData.data[0]);
    });

    it('should throw error', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }], object_type,
      };
      const error = new Error('UNKNOWN ERROR');
      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      kanbanRepository.findOne = jest.fn().mockResolvedValue(() => {
        throw error;
      });

      try {
        await service.setKanbanObjectOrder(objectData, user, request_uid);
      } catch (e) {
        expect(e).toEqual(e);
      }
    });
  });

  describe('setKanbanCardObjectOrder', () => {
    const request_uid = '8d39740e-c2d5-4856-a5b1-7c5551107ed1';
    const user: IUser = {
      id: 1,
      appId: 'test',
      deviceUid: 'testdevice',
      userId: 1,
      email: 'quangndn@flomail.net',
      userAgent: '',
      token: ''
    };
    const object_type = 'CANVAS';

    it('should return worker is running', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(true);

      const result = await service.setKanbanCardObjectOrder(objectData, user, request_uid);
      expect(result.errors[0].message).toEqual(SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS);
    });

    it('should return duplicateEntry', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);

      const result = await service.setKanbanCardObjectOrder(objectData, user, request_uid);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_DUPLICATE_ENTRY);
    });

    it('should return not found item', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      kanbanCardRepository.find = jest.fn().mockResolvedValue([]);

      const result = await service.setKanbanCardObjectOrder(objectData, user, request_uid);
      expect(result.itemFail[0].message).toEqual(MSG_FIND_NOT_FOUND);
    });

    it('should sort success', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }], object_type,
      };

      const kanbanCardItems = [
        { 'kanban_id': 2, 'id': 2 },
        { 'kanban_id': 1, 'id': 1 }];

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      kanbanCardRepository.find = jest.fn().mockResolvedValue(kanbanCardItems);

      const result = await service.setKanbanCardObjectOrder(objectData, user, request_uid);

      expect(result.itemPass[0]).toEqual(objectData.data[0]);
    });

    it('should throw error', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }], object_type,
      };
      const error = new Error('UNKNOWN ERROR');
      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      kanbanCardRepository.findOne = jest.fn().mockResolvedValue(() => {
        throw error;
      });

      try {
        await service.setKanbanCardObjectOrder(objectData, user, request_uid);
      } catch (e) {
        expect(e).toEqual(e);
      }
    });
  });

  describe('setTodoObjectOrder', () => {
    const request_uid = '8d39740e-c2d5-4856-a5b1-7c5551107ed1';
    const user: IUser = {
      id: 1,
      appId: 'test',
      deviceUid: 'testdevice',
      userId: 1,
      email: 'quangndn@flomail.net',
      userAgent: '',
      token: ''
    };
    const object_type = 'TODO';

    it('should return worker is running', async () => {
      const objectData: ITodoObjectOrder = {
        data: [
          {
            "order_number": 11,
            "uid": "85dc-5bac-38ca49432089-46ab-0d644001",
            "order_update_time": 1566464380.817,
            "account_id": 8832,
            "object_href": "/calendarserver.php/calendars/auto.api_user3@flouat.net/d213dd00-dc9f-11eb-8f7c-99c3a377cf97"
          }, {
            "order_number": -10,
            "uid": "6889204c-53c0-481c-8de8-5d7a830ceda7",
            "order_update_time": 1666564370.816,
            "account_id": 0,
            "object_href": "/calendarserver.php/calendars/auto.api_user3@flouat.net/d213dd00-dc9f-11eb-8f7c-99c3a377cf97"
          }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(true);

      const result = await service.setTodoObjectOrder(objectData, user, request_uid);
      expect(result.errors[0].message).toEqual(SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS);
    });

    it('should return duplicateEntry', async () => {
      const objectData: ITodoObjectOrder = {
        data: [
          {
            "order_number": 11,
            "uid": "85dc-5bac-38ca49432089-46ab-0d644001",
            "order_update_time": 1566464380.817,
            "account_id": 8832,
            "object_href": "/calendarserver.php/calendars/auto.api_user3@flouat.net/d213dd00-dc9f-11eb-8f7c-99c3a377cf97"
          }, {
            "order_number": 11,
            "uid": "6889204c-53c0-481c-8de8-5d7a830ceda7",
            "order_update_time": 1666564370.816,
            "account_id": 0,
            "object_href": "/calendarserver.php/calendars/auto.api_user3@flouat.net/d213dd00-dc9f-11eb-8f7c-99c3a377cf97"
          }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);

      const result = await service.setTodoObjectOrder(objectData, user, request_uid);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_DUPLICATE_ENTRY);
    });

    it('should throw error', async () => {
      const objectData: ITodoObjectOrder = {
        data: [
          {
            "order_number": 11,
            "uid": "85dc-5bac-38ca49432089-46ab-0d644001",
            "order_update_time": 1566464380.817,
            "account_id": 8832,
            "object_href": "/calendarserver.php/calendars/auto.api_user3@flouat.net/d213dd00-dc9f-11eb-8f7c-99c3a377cf97"
          }, {
            "order_number": -10,
            "uid": "6889204c-53c0-481c-8de8-5d7a830ceda7",
            "order_update_time": 1666564370.816,
            "account_id": 0,
            "object_href": "/calendarserver.php/calendars/auto.api_user3@flouat.net/d213dd00-dc9f-11eb-8f7c-99c3a377cf97"
          }], object_type,
      };
      const error = new Error('UNKNOWN ERROR');
      service.isResetOrderRunning = jest.fn().mockResolvedValue(() => {
        throw error;
      });

      try {
        await service.setTodoObjectOrder(objectData, user, request_uid);
      } catch (e) {
        expect(e).toEqual(e);
      }
    });
  });

  describe('setUrlObjectOrder', () => {
    const request_uid = '8d39740e-c2d5-4856-a5b1-7c5551107ed1';
    const user: IUser = {
      id: 1,
      appId: 'test',
      deviceUid: 'testdevice',
      userId: 1,
      email: 'quangndn@flomail.net',
      userAgent: '',
      token: ''
    };
    const object_type = 'CSFILE';

    it('should return worker is running', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(true);

      const result = await service.setUrlObjectOrder(objectData, user, request_uid);
      expect(result.errors[0].message).toEqual(SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS);
    });

    it('should return duplicateEntry', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);

      const result = await service.setUrlObjectOrder(objectData, user, request_uid);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_DUPLICATE_ENTRY);
    });

    it('should return not found item', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      urlRepository.findOne = jest.fn().mockResolvedValueOnce(undefined);

      const result = await service.setUrlObjectOrder(objectData, user, request_uid);
      expect(result.itemFail[0].message).toEqual(MSG_FIND_NOT_FOUND);
    });

    it('should return item is in deleted item', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      urlRepository.findOne = jest.fn().mockResolvedValue(true);
      deletedItemService.findOneByItemId = jest.fn().mockResolvedValue(true);

      const result = await service.setUrlObjectOrder(objectData, user, request_uid);

      expect(result.itemFail[0].message).toEqual(MSG_ITEM_IS_IN_DELETED_ITEM_COLLECTION);
    });

    it('should sort success', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }], object_type,
      };

      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      urlRepository.findOne = jest.fn().mockResolvedValue(true);
      deletedItemService.findOneByItemId = jest.fn().mockResolvedValue(false);

      const result = await service.setUrlObjectOrder(objectData, user, request_uid);

      expect(result.itemPass[0]).toEqual(objectData.data[0]);
    });

    it('should throw error', async () => {
      const objectData: IObjectOrder = {
        data: [{
          'order_number': '12.00000',
          'order_update_time': 1566464330.816,
          'id': 2
        }, {
          'order_number': '13.00000',
          'order_update_time': 1566464330.816,
          'id': 1
        }], object_type,
      };
      const error = new Error('UNKNOWN ERROR');
      service.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      urlRepository.findOne = jest.fn().mockResolvedValue(() => {
        throw error;
      });

      try {
        await service.setUrlObjectOrder(objectData, user, request_uid);
      } catch (e) {
        expect(e).toEqual(e);
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
