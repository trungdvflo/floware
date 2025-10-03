import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { datatype, helpers } from 'faker';
import { QueryFailedError, Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import {
  DELETED_ITEM_TYPE,
  OBJ_TYPE
} from '../../../common/constants/common';
import { ErrorCode } from '../../../common/constants/error-code';
import { SortObjectResponseMessage } from '../../../common/constants/message.constant';
import { GetAllFilter } from '../../../common/dtos/get-all-filter';
import { EmailObjectPlain, LINK_OBJ_TYPE, LINK_OBJ_TYPE_ARRAY, ObjectId } from '../../../common/dtos/object-uid';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { KanbanCard } from '../../../common/entities/kanban-card.entity';
import { KanbanCardRepository } from '../../../common/repositories/kanban-card.repository';
import * as CommonUtil from '../../../common/utils/common';
import { CryptoUtil } from '../../../common/utils/crypto.util';
import { ApiLastModifiedQueueService } from '../../../modules/bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../../../modules/database/database-utilities.service';
import { DeletedItemService } from '../../../modules/deleted-item/deleted-item.service';
import { DeleteItemParam } from '../../../modules/deleted-item/dto/deletedItemParam';
import { KanbanService } from '../../../modules/kanban/kanban.service';
import { LinkedCollectionObjectService } from '../../../modules/link/collection/linked-collection-object.service';
import { SORT_OBJECT } from '../../../modules/sort-object/sort-object.constant';
import { SortObjectService } from '../../../modules/sort-object/sort-object.service';
import { ThirdPartyAccountService } from '../../../modules/third-party-account/third-party-account.service';
import { TrashService } from '../../../modules/trash/trash.service';
import { CloudService } from '../../cloud/cloud.service';
import { DeleteKanbanCardParam, KanbanCardParam } from '../dto/kanban-card-param';
import { DeleteKanbanCardParamError, KanbanCardParamError } from '../dto/kanban-card-request-param-error';
import { KanbanCardErrorCode, KanbanCardErrorDics, KanbanCardResponseMessage } from '../kanban-card-response-message';
import { KanbanCardService } from '../kanban-card.service';

jest.mock('../../../common/utils/crypto.util');

const createSampleObjectId = (object_type?: LINK_OBJ_TYPE) => {
  object_type = object_type || helpers.randomize(LINK_OBJ_TYPE_ARRAY) as LINK_OBJ_TYPE;
  if (object_type === OBJ_TYPE.EMAIL) {
    return ObjectId.ObjectIdFactory(new EmailObjectPlain({
      uid: datatype.number({ min: 1 }),
      path: datatype.string(255)
    }), OBJ_TYPE.EMAIL);
  } else if (object_type === OBJ_TYPE.GMAIL) {
    return ObjectId.ObjectIdFactory(datatype.string(255), OBJ_TYPE.GMAIL);
  } else if (object_type === OBJ_TYPE.EMAIL365) {
    return ObjectId.ObjectIdFactory(datatype.string(255), OBJ_TYPE.EMAIL365);
  } else {
    return ObjectId.ObjectIdFactory(datatype.uuid(), object_type);
  }
};

const createSampleKanbanParam = (object_type?: LINK_OBJ_TYPE): KanbanCardParam => {
  const id = datatype.number({ min: 1 });
  const object_uid = createSampleObjectId(object_type);
  return Object.assign(new KanbanCardParam(), {
    object_type: object_type || object_uid.type,
    account_id: datatype.number({ min: 1 }),
    kanban_id: id,
    id,
    object_uid: object_uid,
    ref: datatype.number()
  });
};

const createSampleKanbanCardEntity = (option?: {
  param?: Partial<KanbanCardParam>,
  object_type?: LINK_OBJ_TYPE
}): Partial<KanbanCard> => {
  const object_uid = option?.param.object_uid || createSampleObjectId(option?.object_type);
  return {
    id: 1,
    object_type: object_uid.type,
    object_uid_buf: object_uid.objectUid,
    created_date: datatype.float({ min: 0, precision: 3 }),
    updated_date: datatype.float({ min: 0, precision: 3 }),
    kanban_id: datatype.number({ min: 1 }),
    account_id: datatype.number({ min: 0 }),
    order_number: datatype.number(),
    order_update_time: datatype.float({ min: 0, precision: 3 }),
    object_uid: typeof object_uid === 'string' ? object_uid : object_uid.getPlain()
  };
};

const createSampleDeleteCardKanbanParam = (): DeleteKanbanCardParam => {
  return {
    id: datatype.number({ min: 1 })
  };
};

const createSampleUserId = () => datatype.number({ min: 1 });
const createSampleMaxOrderNumber = () => datatype.float();

// @ts-ignore
const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(() => ({
  find: jest.fn(entity => entity),
  save: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  remove: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  delete: jest.fn(entity => entity),
  getMaxOrder: jest.fn(entity => entity),
  findOne: jest.fn(entity => entity),
  findOneOnMaster: jest.fn((e) => e),
  findAllOnMaster: jest.fn((e) => e),
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

const deletedItemServiceMockFactory: () => MockType<DeletedItemService> = jest.fn(() => ({
  findAll: jest.fn((e) => e),
  batchCreateWithDate: jest.fn((e) => e),
}));

const apiLastModifiedQueueServiceMockFactory:
  () => MockType<ApiLastModifiedQueueService> = jest.fn(() => ({
    addJob: jest.fn((e) => e),
  }));

const linkedCollectionObjectServiceMockFactory:
  () => MockType<LinkedCollectionObjectService> = jest.fn(() => ({
    findOneByObjectUidAndCollectionId: jest.fn((e) => e),
  }));

const sortObjectServiceMockFactory: (
) => MockType<SortObjectService> = jest.fn(() => ({
  isResetOrderRunning: jest.fn()
}));


const cloudServiceMockFactory: (
) => MockType<CloudService> = jest.fn(() => ({
  createCloud: jest.fn(),
}));

const kanbanServiceMockFactory: (
) => MockType<KanbanService> = jest.fn(() => ({
  findAndSelectByIds: jest.fn()
}));

describe('KanbanCardService', () => {
  let app: INestApplication;
  let kanbanCardRepository: MockType<KanbanCardRepository>;
  let kanbanCardService: KanbanCardService;
  let cloudService: CloudService;
  let databaseService: DatabaseUtilitiesService;
  let kanbanService: KanbanService;
  let deletedItemService: MockType<DeletedItemService>;
  let thirdPartyAccountService: ThirdPartyAccountService;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;
  let linkedCollectionObjectService: MockType<LinkedCollectionObjectService>;
  let sortObjectService: SortObjectService;
  let trashService: TrashService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KanbanService,
        KanbanCardService,
        CloudService,
        {
          // how you provide the injection token in a test instance
          provide: KanbanCardRepository,
          useFactory: repositoryMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(KanbanCard),
          useFactory: repositoryMockFactory
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
          provide: CloudService,
          useFactory: cloudServiceMockFactory,
        },
        {
          provide: KanbanCard,
          useFactory: kanbanServiceMockFactory,
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
          provide: KanbanService,
          useValue: {
            findOneById: jest.fn((e) => e),
            findAndSelectByIds: jest.fn((userId, data) => [createSampleKanbanParam()]),
          },
        },
        {
          provide: ThirdPartyAccountService,
          useValue: {
            findOneById: jest.fn((e) => e),
          }
        },
        {
          provide: TrashService,
          useValue: {
            getIsTrash: jest.fn((e) => 1),
          }
        },
        {
          // how you provide the injection token in a test instance
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedQueueServiceMockFactory
        },
        {
          provide: LinkedCollectionObjectService,
          useFactory: linkedCollectionObjectServiceMockFactory
        },
        {
          provide: HttpService,
          useValue: spyHttpClient
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    kanbanCardRepository = module.get(KanbanCardRepository);
    kanbanCardService = module.get<KanbanCardService>(KanbanCardService);
    cloudService = module.get<CloudService>(CloudService);
    databaseService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    kanbanService = module.get<KanbanService>(KanbanService);
    deletedItemService = module.get(DeletedItemService);
    thirdPartyAccountService = module.get<ThirdPartyAccountService>(ThirdPartyAccountService);
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    linkedCollectionObjectService = module.get(LinkedCollectionObjectService);
    CryptoUtil.aes256EncryptBuffer = jest.fn((text) => Buffer.from(text));
    CryptoUtil.aes256DecryptBuffer = jest.fn((buffer) => buffer.toString());
    sortObjectService = module.get(SortObjectService);
    trashService = module.get<TrashService>(TrashService);
  });
  describe('Defined: KanbanCardService', () => {
    it('should be defined', () => {
      expect(kanbanCardService).toBeDefined();
      expect(trashService).toBeDefined();
      expect(cloudService).toBeDefined();
    });
  });

  it('should return empty array', async () => {
    databaseService.getAll = jest.fn().mockResolvedValue([]);
    deletedItemService.findAll = jest.fn().mockResolvedValue([]);
    const userId = createSampleUserId();

    const result = await kanbanCardService.findAll(userId, {
      modified_gte: 1,
      has_del: 1,
      page_size: 1
    });
    expect(databaseService.getAll).toBeCalledTimes(1);
    expect(result.kanbanCards).not.toBeNull();
    expect(result.deletedItems).not.toBeNull();
    expect(result.kanbanCards).toHaveLength(0);
    expect(result.deletedItems).toHaveLength(0);
  });

  it('should return kanban cards array', async () => {
    const entities: Partial<KanbanCard>[] = [
      createSampleKanbanCardEntity(), createSampleKanbanCardEntity()
    ];
    const userId = createSampleUserId();
    const filter: GetAllFilter<KanbanCard> = {
      page_size: datatype.number({ min: 1, max: 1000 }),
      fields: ['object_uid', 'order_number']
    };
    databaseService.getAll = jest.fn().mockResolvedValue(entities);

    const result = await kanbanCardService.findAll(userId, filter);

    expect(databaseService.getAll).toBeCalledTimes(1);
    expect(databaseService.getAll).toHaveBeenCalledWith({
      userId,
      filter: {
        page_size: filter.page_size,
        fields: [...filter.fields, 'object_type']
      },
      repository: kanbanCardRepository
    });
    expect(result).not.toBeNull();
    expect(result.kanbanCards).toHaveLength(2);
    expect(result.deletedItems).toBeUndefined();
    result.kanbanCards.forEach((e, idx) => {
      expect(e.id).toEqual(entities[idx].id);
      expect(e.object_type).toEqual(entities[idx].object_type);
      expect(e.object_uid_buf).toEqual(entities[idx].object_uid_buf);
      expect(e.created_date).toEqual(entities[idx].created_date);
      expect(e.updated_date).toEqual(entities[idx].updated_date);
      expect(e.kanban_id).toEqual(entities[idx].kanban_id);
      expect(e.account_id).toEqual(entities[idx].account_id);
      expect(e.order_number).toEqual(entities[idx].order_number);
      expect(e.order_update_time).toEqual(entities[idx].order_update_time);
      expect(e.object_uid).toEqual(entities[idx].object_uid);
    });
  });

  it('should return kanban cards array with data_del', async () => {
    const entities: Partial<KanbanCard>[] = [
      createSampleKanbanCardEntity(), createSampleKanbanCardEntity()
    ];
    const deletedItemEntities: Partial<DeletedItem>[] = [{
      item_id: datatype.number({ min: 1 }),
      is_recovery: helpers.randomize([0, 1])
    }, {
      item_id: datatype.number({ min: 1 }),
      is_recovery: helpers.randomize([0, 1])
    }];
    const userId = createSampleUserId();
    databaseService.getAll = jest.fn().mockResolvedValue(entities);
    deletedItemService.findAll = jest.fn().mockResolvedValue(deletedItemEntities);
    const filter: GetAllFilter<KanbanCard> = {
      has_del: 1,
      page_size: datatype.number({ min: 1, max: 1000 }),
      fields: ['object_type', 'object_uid']
    };

    const { kanbanCards, deletedItems } = await kanbanCardService.findAll(userId, filter);

    expect(databaseService.getAll).toBeCalledTimes(1);
    expect(databaseService.getAll).toHaveBeenCalledWith({
      userId,
      filter,
      repository: kanbanCardRepository
    });
    expect(kanbanCards).toHaveLength(2);
    expect(deletedItems).toHaveLength(2);
    kanbanCards.forEach((e, idx) => {
      expect(e.id).toEqual(entities[idx].id);
      expect(e.object_type).toEqual(entities[idx].object_type);
      expect(e.object_uid_buf).toEqual(entities[idx].object_uid_buf);
      expect(e.created_date).toEqual(entities[idx].created_date);
      expect(e.updated_date).toEqual(entities[idx].updated_date);
      expect(e.kanban_id).toEqual(entities[idx].kanban_id);
      expect(e.account_id).toEqual(entities[idx].account_id);
      expect(e.order_number).toEqual(entities[idx].order_number);
      expect(e.order_update_time).toEqual(entities[idx].order_update_time);
      expect(e.object_uid).toEqual(entities[idx].object_uid);
    });
    deletedItems.forEach((item, idx) => {
      expect(item.id).toEqual(deletedItems[idx].id);
      expect(item.is_recovery).toEqual(deletedItems[idx].is_recovery);
    });
  });

  describe('POST: KanbanCardService', () => {

    it('should create kanban card', async () => {
      const userId = createSampleUserId();
      const param = createSampleKanbanParam();
      const entity = createSampleKanbanCardEntity({ param });
      let maxOrderNumber = createSampleMaxOrderNumber();
      maxOrderNumber = Math.round(parseFloat(maxOrderNumber.toString()));
      const colId = datatype.number({ min: 1 });

      const rsFindKanban = [{
        id: param.kanban_id,
        collection_id: colId
      }];

      kanbanService.findByIds = jest.fn().mockResolvedValue(rsFindKanban);
      jest.spyOn(CommonUtil, 'getMinTable').mockResolvedValueOnce(0);
      kanbanService.findAndSelectByIds = jest.fn().mockResolvedValue([param]);
      thirdPartyAccountService.findOneById = jest.fn().mockResolvedValue({
        id: param.account_id
      });
      linkedCollectionObjectService
        .findOneByObjectUidAndCollectionId = jest.fn().mockResolvedValue({
          id: datatype.number({ min: 1 })
        });
      kanbanCardRepository.create.mockReturnValue({
        user_id: userId,
        ...param,
      });
      kanbanCardRepository.save.mockReturnValue(entity);
      kanbanCardRepository.getMaxOrder.mockReturnValue(maxOrderNumber);
      jest.spyOn(CommonUtil, 'getMinTableKanbanCard')
        .mockResolvedValueOnce(SORT_OBJECT.MIN_ORDER_NUMBER);

      const result = await kanbanCardService.createKanbanCard([param], fakeReq);

      expect(linkedCollectionObjectService
        .findOneByObjectUidAndCollectionId).toBeCalledTimes(1);
      expect(thirdPartyAccountService.findOneById).toBeCalledTimes(1);
      expect(kanbanCardRepository.create).toBeCalledTimes(1);
      expect(kanbanCardRepository.save).toBeCalledTimes(1);
      expect(result).not.toBeNull();
      expect(result.itemPass[0].id).toEqual(entity.id);
      expect(result.itemPass[0].object_type).toEqual(entity.object_type);
      expect(result.itemPass[0].object_uid_buf).toEqual(entity.object_uid_buf);
      expect(result.itemPass[0].created_date).toEqual(entity.created_date);
      expect(result.itemPass[0].updated_date).toEqual(entity.updated_date);
      expect(result.itemPass[0].kanban_id).toEqual(entity.kanban_id);
      expect(result.itemPass[0].account_id).toEqual(entity.account_id);
      expect(result.itemPass[0].order_update_time).toEqual(entity.order_update_time);
      expect(result.itemPass[0].object_uid).toStrictEqual(entity.object_uid);
    });

    it('should create kanban card having error - kanban not found', async () => {
      const userId = createSampleUserId();
      const param = createSampleKanbanParam();
      const error = new KanbanCardParamError({
        ...KanbanCardErrorDics.KANBAN_NOT_FOUND,
        attributes: {
          kanban_id: param.kanban_id,
          ref: param.ref
        }
      });
      kanbanService.findByIds = jest.fn().mockResolvedValue([]);
      jest.spyOn(CommonUtil, 'getMinTable').mockResolvedValueOnce(0);
      kanbanService.findOneById = jest.fn().mockResolvedValue(undefined);

      try {
        await kanbanCardService.createKanbanCard([], fakeReq);
      } catch (err) {
        expect(err).toBeInstanceOf(KanbanCardParamError);
        expect(err).toStrictEqual(error);
      }

      expect(linkedCollectionObjectService
        .findOneByObjectUidAndCollectionId).toBeCalledTimes(0);
      expect(thirdPartyAccountService.findOneById).toBeCalledTimes(0);
      expect(kanbanCardRepository.getMaxOrder).toBeCalledTimes(0);
      expect(kanbanCardRepository.create).toBeCalledTimes(0);
    });

    it('should update cloud and fail all items', async () => {
      const colId = datatype.number({ min: 1 });
      const userId = createSampleUserId();
      const params = [createSampleKanbanParam(), createSampleKanbanParam()];
      const rsFindKanban = [{
        id: params[0].kanban_id,
        collection_id: colId
      }];
      const firstFailItem = {
        code: KanbanCardErrorCode.KANBAN_CARD_NOT_FOUND,
        message: KanbanCardResponseMessage.KANBAN_CARD_NOT_FOUND,
        attributes: {
          ...params[0],
          object_uid: params[0].object_uid.getPlain()
        }
      };
      const secondFailItem = {
        code: KanbanCardErrorCode.KANBAN_CARD_NOT_FOUND,
        message: KanbanCardResponseMessage.KANBAN_CARD_NOT_FOUND,
        attributes: {
          ...params[1],
          object_uid: params[1].object_uid.getPlain()
        }
      };
      const result = await kanbanCardService.createKanbanCard(params, fakeReq);
      expect(result.itemFail[0]).toEqual({ ...firstFailItem });
      expect(result.itemFail[1]).toEqual(secondFailItem);
      expect(result.itemPass).toEqual([]);
    });

    it('should create kanban cards having error worker is running', async () => {
      const userId = createSampleUserId();
      const kanbanCardParams = [createSampleKanbanParam()];
      sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(true);
      const result = await kanbanCardService.createKanbanCard(kanbanCardParams, fakeReq);
      expect(result.itemFail[0].message).toEqual(SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS);
    });

    it('should batch create kanban cards and having out of order error', async () => {
      const userId = createSampleUserId();
      const kanbanCardParams = [createSampleKanbanParam()];
      kanbanService.findOneById = jest.fn().mockResolvedValueOnce({});
      sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
      linkedCollectionObjectService.findOneByObjectUidAndCollectionId = jest.fn().mockResolvedValueOnce({});
      thirdPartyAccountService.findOneById = jest.fn().mockResolvedValueOnce({});
      kanbanService.findByIds = jest.fn().mockResolvedValue([
        { id: kanbanCardParams[0].kanban_id }
      ]);
      jest.spyOn(CommonUtil, 'getMinTableKanbanCard')
        .mockResolvedValueOnce(SORT_OBJECT.MIN_ORDER_NUMBER);
      let result: any = new QueryFailedError(ErrorCode.ORDER_NUMBER_OUT_OF_RANGE, [], new Error(ErrorCode.ORDER_NUMBER_OUT_OF_RANGE));
      kanbanCardRepository.create = jest.fn().mockRejectedValueOnce(result);
      const rs = await kanbanCardService.createKanbanCard(kanbanCardParams, fakeReq);
      expect(rs.itemFail).toHaveLength(1);
      expect(rs.itemFail[0].message).toEqual(KanbanCardResponseMessage.KANBAN_CARD_NOT_FOUND);
    });

    // it('should create cloud but having error out of order', async () => {
    //   const data = [
    //     {
    //       "bookmark_data": "Ym9vazwDAAAAAAQQMAAAAJy2yEyU9",
    //       "real_filename": "Screenshot_2018-02-22_11-08-14.png",
    //       "ext": "png",
    //       "device_uid": "D735AC90-F13C-4F68-AFC4-92D23B1C8302",
    //       "ref": "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C",
    //       "size": 123456
    //     }
    //   ];
    //   const userId = createSampleUserId();
    //   jest.spyOn(CommonUtil, 'getMinTable').mockResolvedValueOnce(-9999999);
    //   const result = await cloudService.createCloud(data, userId);
    //   expect(result.itemFail[0].message).toEqual(MSG_ORDER_NUMBER_OUT_OF_RANGE);
    // });

    it('should batch create kanban cards and having error reset order is in process', async () => {
      const userId = createSampleUserId();
      const params = [createSampleKanbanParam(), createSampleKanbanParam()];
      sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(true);
      const result = await kanbanCardService.createKanbanCard(params, fakeReq);
      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].message).toEqual(SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS);
    });

    it('should create kanban card having error - object not linked to collection', async () => {
      const param = createSampleKanbanParam();

      const error = new KanbanCardParamError({
        ...KanbanCardErrorDics.OBJECT_NOT_LINKED_TO_COLLECTION,
        attributes: {
          ...param
        }
      });
      const colId = datatype.number({ min: 1 });
      const params = [createSampleKanbanParam(), createSampleKanbanParam()];

      kanbanService.findByIds = jest.fn().mockResolvedValue(params);

      linkedCollectionObjectService
        .findOneByObjectUidAndCollectionId = jest.fn().mockResolvedValue(undefined);
      const userId = createSampleUserId();

      try {
        await kanbanCardService.createKanbanCard(params, fakeReq);
      } catch (err) {
        expect(err).toBeInstanceOf(KanbanCardParamError);
        expect(err).toStrictEqual(error);
      }

      expect(thirdPartyAccountService.findOneById).toBeCalledTimes(0);
      expect(kanbanCardRepository.getMaxOrder).toBeCalledTimes(0);
      expect(kanbanCardRepository.create).toBeCalledTimes(0);
    });

    // it('should create kanban card having error - invalid third party account', async () => {
    //   const userId = createSampleUserId();
    //   const param = createSampleKanbanParam();
    //   param.account_id = datatype.number({ min: 1 });
    //   const error = new KanbanCardParamError({
    //     ...KanbanCardErrorDics.THIRD_PARTY_ACCOUNT_NOT_FOUND,
    //     attributes: {
    //       account_id: param.account_id,
    //       ref: param.ref
    //     }
    //   });
    //   const colId = datatype.number({ min: 1 });

    //   const rsFindKanban = [{
    //     id: param.kanban_id,
    //     collection_id: colId
    //   }];
    //   kanbanService.findByIds = jest.fn().mockResolvedValue(rsFindKanban);

    //   linkedCollectionObjectService
    //     .findOneByObjectUidAndCollectionId = jest.fn().mockResolvedValue({
    //       id: datatype.number({ min: 1 })
    //     });
    //   thirdPartyAccountService.findOneById = jest.fn().mockResolvedValue(undefined);
    //   try {
    //     await kanbanCardService.createKanbanCard([param], userId);
    //   } catch (err) {
    //     expect(err).toBeInstanceOf(KanbanCardParamError);
    //     expect(err).toStrictEqual(error);
    //   }

    //   expect(linkedCollectionObjectService
    //     .findOneByObjectUidAndCollectionId).toBeCalledTimes(1);
    //   expect(linkedCollectionObjectService
    //     .findOneByObjectUidAndCollectionId).toHaveBeenCalledWith(,
    //       param.object_uid.objectUid, colId, { fields: ['id'] });
    //   expect(thirdPartyAccountService.findOneById).toBeCalledTimes(1);
    //   expect(kanbanCardRepository.getMaxOrder).toBeCalledTimes(0);
    //   expect(kanbanCardRepository.create).toBeCalledTimes(0);
    // });

    // it('should batch create kanban cards', async () => {
    //   const userId = createSampleUserId();
    //   const params = [createSampleKanbanParam(), createSampleKanbanParam()];
    //   const entities = [createSampleKanbanCardEntity({ param: params[0] }),
    //   createSampleKanbanCardEntity({ param: params[1] })];

    //   kanbanCardService.createKanbanCard = jest.fn().mockResolvedValueOnce(entities[0])
    //     .mockResolvedValueOnce(entities[1]);
    //   kanbanService.findByIds = jest.fn().mockResolvedValue([
    //     { id: params[0].kanban_id }, { id: params[1].kanban_id }
    //   ]);
    //   jest.spyOn(CommonUtil, 'getMinTableKanbanCard')
    //     .mockResolvedValueOnce(0)
    //     .mockResolvedValueOnce(-1);

    //   const { itemFail, itemPass } = await kanbanCardService.createKanbanCard(params, userId);
    //   expect(kanbanCardService.createKanbanCard).toBeCalledTimes(1);
    //   expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    //   expect(itemPass).toHaveLength(2);
    //   expect(itemFail).toHaveLength(0);
    //   itemPass.forEach((item, idx) => {
    //     const find = entities.find(e => e.object_uid === item.object_uid);
    //     expect(item.id).toEqual(find.id);
    //     expect(item.object_type).toEqual(find.object_type);
    //     expect(item.created_date).toEqual(find.created_date);
    //     expect(item.updated_date).toEqual(find.updated_date);
    //     expect(item.kanban_id).toEqual(find.kanban_id);
    //     expect(item.account_id).toEqual(find.account_id);
    //     expect(item.order_number).toEqual(find.order_number);
    //     expect(item.order_update_time).toEqual(find.order_update_time);
    //     expect(item.object_uid).toStrictEqual(find.object_uid);
    //     expect(item.ref).toEqual(params[idx].ref);
    //   });
    // });

    // it('should batch create kanban cards having errors', async () => {
    //   const userId = createSampleUserId();
    //   const params = [createSampleKanbanParam(), createSampleKanbanParam(),
    //   createSampleKanbanParam(), createSampleKanbanParam()];
    //   const entities = [createSampleKanbanCardEntity({ param: params[0] }),
    //   createSampleKanbanCardEntity({ param: params[1] })];
    //   const paramErrors = [new KanbanCardParamError({
    //     ...KanbanCardErrorDics.KANBAN_NOT_FOUND,
    //     attributes: {
    //       kanban_id: params[2].kanban_id,
    //       ref: params[2].ref
    //     }
    //   }), new KanbanCardParamError({
    //     ...KanbanCardErrorDics.OBJECT_NOT_LINKED_TO_COLLECTION,
    //     attributes: {
    //       ...params[3]
    //     }
    //   })];

    //   kanbanCardService.createKanbanCard = jest.fn().mockResolvedValueOnce(entities[0])
    //     .mockResolvedValueOnce(entities[1])
    //     .mockImplementationOnce(() => {
    //       throw paramErrors[0];
    //     })
    //     .mockImplementationOnce(() => {
    //       throw paramErrors[1];
    //     });

    //   kanbanService.findByIds = jest.fn().mockResolvedValue([
    //     { id: params[0].kanban_id }, { id: params[1].kanban_id }
    //   ]);
    //   jest.spyOn(CommonUtil, 'getMinTableKanbanCard')
    //     .mockResolvedValueOnce(0)
    //     .mockResolvedValueOnce(-1)
    //     .mockResolvedValueOnce(-2)
    //     .mockResolvedValueOnce(-3)
    //     ;

    //   const { itemFail, itemPass } = await kanbanCardService.createKanbanCard(params, userId);
    //   expect(kanbanCardService.createKanbanCard).toBeCalledTimes(1);
    //   expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    //   expect(itemPass).toHaveLength(2);
    //   expect(itemFail).toHaveLength(2);
    //   itemPass.forEach((item, idx) => {
    //     const find = entities.find(e => e.object_uid === item.object_uid);
    //     expect(item.id).toEqual(find.id);
    //     expect(item.object_type).toEqual(find.object_type);
    //     expect(item.created_date).toEqual(find.created_date);
    //     expect(item.updated_date).toEqual(find.updated_date);
    //     expect(item.kanban_id).toEqual(find.kanban_id);
    //     expect(item.account_id).toEqual(find.account_id);
    //     expect(item.order_number).toEqual(find.order_number);
    //     expect(item.order_update_time).toEqual(find.order_update_time);
    //     expect(item.object_uid).toStrictEqual(find.object_uid);
    //   });
    //   itemFail.forEach((item, idx) => {
    //     expect(item).toBeInstanceOf(KanbanCardParamError);
    //     expect(paramErrors).toContain(paramErrors[idx]);
    //   });
    // });

    // it('should batch create kanban cards having query failed errors', async () => {
    //   const userId = createSampleUserId();
    //   const params = [createSampleKanbanParam(), createSampleKanbanParam(),
    //   createSampleKanbanParam(), createSampleKanbanParam()];
    //   const entities = [createSampleKanbanCardEntity({ param: params[0] }),
    //   createSampleKanbanCardEntity({ param: params[1] })];
    //   const paramErrors = [new KanbanCardParamError({
    //     ...KanbanCardErrorDics.DUPLICATED_ENTRY,
    //     attributes: {
    //       kanban_id: params[2].kanban_id,
    //       account_id: params[2].account_id,
    //       object_uid: params[2].object_uid,
    //       object_type: params[2].object_type,
    //       ref: params[2].ref
    //     }
    //   }), new KanbanCardParamError({
    //     code: KanbanCardErrorCode.KANBAN_CARD_ENTITY_ERROR,
    //     message: 'entity not found',
    //     attributes: params[3]
    //   })];
    //   const queryFailedError = new QueryFailedError('', [], new Error());
    //   queryFailedError.message = 'ER_DUP_ENTRY';
    //   const entityNotFoundError = new EntityNotFoundError(KanbanCard, null);
    //   entityNotFoundError.message = paramErrors[1].message;

    //   kanbanCardService.createKanbanCard = jest.fn().mockResolvedValueOnce(entities[0])
    //     .mockResolvedValueOnce(entities[1])
    //     .mockImplementationOnce(() => {
    //       throw queryFailedError;
    //     })
    //     .mockImplementationOnce(() => {
    //       throw entityNotFoundError;
    //     });

    //   const rsFindKanban = [
    //     { id: params[0].kanban_id }, { id: params[1].kanban_id }
    //   ];

    //   kanbanService.findByIds = jest.fn().mockResolvedValue(rsFindKanban);
    //   jest.spyOn(CommonUtil, 'getMinTableKanbanCard')
    //     .mockResolvedValueOnce(0)
    //     .mockResolvedValueOnce(-1)
    //     .mockResolvedValueOnce(-2)
    //     .mockResolvedValueOnce(-3);

    //   const { itemFail, itemPass } = await kanbanCardService.createKanbanCard(params, userId);
    //   expect(kanbanCardService.createKanbanCard).toBeCalledTimes(1);
    //   expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    //   expect(itemPass).toHaveLength(2);
    //   expect(itemFail).toHaveLength(2);
    //   itemPass.forEach((item, idx) => {
    //     const find = entities.find(e => e.object_uid === item.object_uid);
    //     expect(item.id).toEqual(find.id);
    //     expect(item.object_type).toEqual(find.object_type);
    //     expect(item.created_date).toEqual(find.created_date);
    //     expect(item.updated_date).toEqual(find.updated_date);
    //     expect(item.kanban_id).toEqual(find.kanban_id);
    //     expect(item.account_id).toEqual(find.account_id);
    //     expect(item.order_number).toEqual(find.order_number);
    //     expect(item.order_update_time).toEqual(find.order_update_time);
    //     expect(item.object_uid).toStrictEqual(find.object_uid);
    //   });
    //   itemFail.forEach((item, idx) => {
    //     expect(item).toBeInstanceOf(KanbanCardParamError);
    //     expect(paramErrors).toContain(paramErrors[idx]);
    //   });
    // });

    // it('should batch create kanban cards having query failed errors', async () => {
    //   const userId = createSampleUserId();
    //   const params = [createSampleKanbanParam(), createSampleKanbanParam(),
    //   createSampleKanbanParam(), createSampleKanbanParam()];
    //   const entities = [createSampleKanbanCardEntity({ param: params[0] }),
    //   createSampleKanbanCardEntity({ param: params[1] })];
    //   const paramErrors = [new KanbanCardParamError({
    //     code: KanbanCardErrorCode.KANBAN_CARD_ENTITY_ERROR,
    //     message: 'query failed',
    //     attributes: params[2]
    //   }), new KanbanCardParamError({
    //     code: KanbanCardErrorCode.KANBAN_CARD_ENTITY_ERROR,
    //     message: 'entity not found',
    //     attributes: params[3]
    //   })];
    //   const queryFailedError = new QueryFailedError('', [], new Error());
    //   queryFailedError.message = paramErrors[0].message;
    //   const entityNotFoundError = new EntityNotFoundError(KanbanCard, null);
    //   entityNotFoundError.message = paramErrors[1].message;

    //   const rsFindKanban = [
    //     { id: params[0].kanban_id }, { id: params[1].kanban_id }
    //   ];
    //   kanbanService.findByIds = jest.fn().mockResolvedValue(rsFindKanban);
    //   jest.spyOn(CommonUtil, 'getMinTableKanbanCard')
    //     .mockResolvedValueOnce(0)
    //     .mockResolvedValueOnce(-1)
    //     .mockResolvedValueOnce(-2)
    //     .mockResolvedValueOnce(-3);

    //   kanbanCardService.createKanbanCard = jest.fn().mockResolvedValueOnce(entities[0])
    //     .mockResolvedValueOnce(entities[1])
    //     .mockImplementationOnce(() => {
    //       throw queryFailedError;
    //     })
    //     .mockImplementationOnce(() => {
    //       throw entityNotFoundError;
    //     });

    //   const { itemFail, itemPass } = await kanbanCardService.createKanbanCard(params, userId);
    //   expect(kanbanCardService.createKanbanCard).toBeCalledTimes(1);
    //   expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    //   expect(itemPass).toHaveLength(2);
    //   expect(itemFail).toHaveLength(2);
    //   itemPass.forEach((item, idx) => {
    //     const find = entities.find(e => e.object_uid === item.object_uid);
    //     expect(item.id).toEqual(find.id);
    //     expect(item.object_type).toEqual(find.object_type);
    //     expect(item.created_date).toEqual(find.created_date);
    //     expect(item.updated_date).toEqual(find.updated_date);
    //     expect(item.kanban_id).toEqual(find.kanban_id);
    //     expect(item.account_id).toEqual(find.account_id);
    //     expect(item.order_number).toEqual(find.order_number);
    //     expect(item.order_update_time).toEqual(find.order_update_time);
    //     expect(item.object_uid).toStrictEqual(find.object_uid);
    //   });
    //   itemFail.forEach((item, idx) => {
    //     expect(item).toBeInstanceOf(KanbanCardParamError);
    //     expect(paramErrors).toContain(paramErrors[idx]);
    //   });
    // });

    it('should batch create kanban cards having unknown error', async () => {
      const userId = createSampleUserId();
      const params = [createSampleKanbanParam(), createSampleKanbanParam(),
      createSampleKanbanParam(), createSampleKanbanParam()];
      const entities = [createSampleKanbanCardEntity({ param: params[0] }),
      createSampleKanbanCardEntity({ param: params[1] }),
      createSampleKanbanCardEntity({ param: params[3] })];
      const error = new Error('any message');

      const rsFindKanban = [
        { id: params[0].kanban_id }, { id: params[1].kanban_id }, { id: params[2].kanban_id }

      ];
      kanbanService.findByIds = jest.fn().mockResolvedValue(rsFindKanban);
      jest.spyOn(CommonUtil, 'getMinTableKanbanCard')
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(-1)
        .mockResolvedValueOnce(-2)
        .mockResolvedValueOnce(-3);

      kanbanCardService.createKanbanCard = jest.fn().mockResolvedValueOnce(entities[0])
        .mockResolvedValueOnce(entities[1])
        .mockImplementationOnce(() => {
          throw error;
        })
        .mockResolvedValueOnce(entities[3]);

      try {
        await kanbanCardService.createKanbanCard(params, fakeReq);
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect(err).toStrictEqual(error);
      }

      expect(kanbanCardService.createKanbanCard).toBeCalledTimes(1);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
    });
  });

  describe('DELETE: KanbanCardService', () => {

    it('should delete kanban card by id', async () => {
      const kanbanCardId = datatype.number({ min: 1 });
      const userId = createSampleUserId();

      await kanbanCardService.deleteById(userId, kanbanCardId);

      expect(kanbanCardRepository.delete).toBeCalledTimes(1);
      expect(kanbanCardRepository.delete).toBeCalledWith({
        user_id: userId,
        id: kanbanCardId
      });
    });

    it('should batch delete kanban card by ids', async () => {
      const param = [datatype.number({ min: 1 }), datatype.number({ min: 1 })];
      const deletedItems: DeleteItemParam[] = [{
        item_id: param[0],
        item_type: DELETED_ITEM_TYPE.CANVAS,
        created_date: 1635478859.94,
        updated_date: 1635478859.95,
      }, {
        item_id: param[1],
        item_type: DELETED_ITEM_TYPE.CANVAS,
        created_date: 1635478859.96,
        updated_date: 1635478859.97,
      }];
      const inputItems = [{
        id: param[0]
      }, {
        id: param[1]
      }];
      const userId = createSampleUserId();
      kanbanCardRepository.findAllOnMaster.mockReturnValue(inputItems);

      // @ts-ignore
      const { items } = await kanbanCardService.batchDeleteByIds(userId, param);

      expect(items).not.toBeNull();
      items.forEach((e, idx) => {
        expect(e.id).toEqual(items[idx].id);
      });
      expect(kanbanCardRepository.delete).toBeCalledTimes(1);
      expect(kanbanCardRepository.findAllOnMaster).toBeCalledTimes(1);
      expect(kanbanCardRepository.delete).toHaveBeenCalledWith(param);
      expect(deletedItemService.batchCreateWithDate).toBeCalledTimes(1);
    });

    it('should batch delete kanban cards', async () => {
      const params = [createSampleDeleteCardKanbanParam(), createSampleDeleteCardKanbanParam()];
      const items = [{
        id: params[0].id
      }, {
        id: params[1].id
      }];
      const userId = createSampleUserId();
      kanbanCardService.batchDeleteByIds = jest.fn().mockResolvedValue({ items });

      const { deleted, errors } = await kanbanCardService.batchDeleteKanbanCards(params, fakeReq);

      expect(deleted).toHaveLength(2);
      deleted.forEach((e, idx) => {
        expect(e.id).toEqual(items[idx].id);
      });
      expect(kanbanCardService.batchDeleteByIds).toBeCalledTimes(1);
      expect(kanbanCardService.batchDeleteByIds).toHaveBeenCalledWith(fakeReq.user, fakeReq.headers,
        params.map(p => p.id));
    });

    it('should batch delete kanban cards having errors', async () => {
      const params = [createSampleDeleteCardKanbanParam(), createSampleDeleteCardKanbanParam(),
      createSampleDeleteCardKanbanParam(), createSampleDeleteCardKanbanParam()];
      const items = [{
        id: params[0].id
      }, {
        id: params[1].id
      }];
      const userId = createSampleUserId();
      const paramErrors = [new DeleteKanbanCardParamError({
        ...KanbanCardErrorDics.KANBAN_CARD_NOT_FOUND,
        attributes: {
          id: params[2].id
        }
      }), new DeleteKanbanCardParamError({
        ...KanbanCardErrorDics.KANBAN_CARD_NOT_FOUND,
        attributes: {
          id: params[3].id
        }
      })];
      kanbanCardService.batchDeleteByIds = jest.fn().mockResolvedValue({ items });

      const { deleted, errors } = await kanbanCardService.batchDeleteKanbanCards(params, fakeReq);

      expect(deleted).toHaveLength(2);
      expect(errors).toHaveLength(2);
      deleted.forEach((e, idx) => {
        expect(e.id).toEqual(items[idx].id);
      });
      errors.forEach((e, idx) => {
        expect(e).toBeInstanceOf(DeleteKanbanCardParamError);
        expect(e).toStrictEqual(paramErrors[idx]);
      });
      expect(kanbanCardService.batchDeleteByIds).toBeCalledTimes(1);
      expect(kanbanCardService.batchDeleteByIds).toHaveBeenCalledWith(fakeReq.user, fakeReq.headers,
        params.map(p => p.id));
    });
  });

  afterAll(async () => {
    await app.close();
  });
});