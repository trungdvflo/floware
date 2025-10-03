import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { isString } from 'class-validator';
import { InsertResult, QueryFailedError, Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../../test';
import { DELETED_ITEM_TYPE, OBJ_TYPE } from '../../../../common/constants/common';
import { ErrorCode } from '../../../../common/constants/error-code';
import { MSG_ERR_LINK } from '../../../../common/constants/message.constant';
import { DeletedItem } from '../../../../common/entities/deleted-item.entity';
import { KanbanCard } from '../../../../common/entities/kanban-card.entity';
import { LinkedCollectionObject } from '../../../../common/entities/linked-collection-object.entity';
import { ShareMember } from '../../../../common/entities/share-member.entity';
import { IUser } from '../../../../common/interfaces';
import { LoggerService } from '../../../../common/logger/logger.service';
import { CollectionActivityRepository } from '../../../../common/repositories/collection-activity.repository';
import { LinkedCollectionObjectRepository } from '../../../../common/repositories/linked-collection-object.repository';
import { CryptoUtil } from '../../../../common/utils/crypto.util';
import { ApiLastModifiedQueueService } from '../../../bullmq-queue/api-last-modified-queue.service';
import { CollectionService } from '../../../collection/collection.service';
import { DatabaseUtilitiesService } from '../../../database/database-utilities.service';
import { DeletedItemService } from '../../../deleted-item/deleted-item.service';
import { GlobalSettingService as SettingService } from '../../../setting/setting.service';
import { ThirdPartyAccountService } from '../../../third-party-account/third-party-account.service';
import { TrashService } from '../../../trash/trash.service';
import { LinkHelper } from '../../helper/link.helper';
import { LinkedCollectionParamError, LinkedCollectionRequestParamError } from '../dtos/error.dto';
import { LinkedCollectionObjectService } from '../linked-collection-object.service';
import * as Generator from './faker';

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

const linkedCollectionObjectRepository: () => MockType<LinkedCollectionObjectRepository> = jest.fn(() => ({
  findByObjUid: jest.fn(entity => entity),
  find: jest.fn(entity => entity),
  findOne: jest.fn((id: number) => id),
  save: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  insert: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  remove: jest.fn(entity => entity),
  LinkedCollectionObjectRepository: jest.fn(entity => ([
    Generator.fakeEntity(OBJ_TYPE.VCARD),
    Generator.fakeEntity(OBJ_TYPE.EMAIL)
  ])),
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
  getCollectionIdByObjectUid: jest.fn().mockResolvedValue(123)
}));

const collectionActivityReposMockFactory: () => MockType<CollectionActivityRepository> = jest.fn(() => ({
  findByObjUid: jest.fn(entity => entity),
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
  linked_collection_object: {
    ownColumns: [
      {
        databaseName: 'id',
      },
      {
        databaseName: 'user_id',
      },
      {
        databaseName: 'collection_id',
      },
      {
        databaseName: 'object_uid',
      },
      {
        databaseName: 'object_type',
      },
      {
        databaseName: 'account_id',
      },
      {
        databaseName: 'email_time',
      },
      {
        databaseName: 'object_href',
      },
      {
        databaseName: 'is_trashed',
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
const repoMockKanbanCardFactory: () => MockType<Repository<KanbanCard>> = jest.fn(() => ({
  delete: jest.fn((entity) => {
    return { ...entity, affected: true };
  })
}));
const apiLastModifiedServiceMockFactory: () =>
  MockType<ApiLastModifiedQueueService> = jest.fn(() => ({}));

describe('LinkedCollectionObjectService', () => {
  let createQueryBuilder: any;
  let app: INestApplication;
  let service: LinkedCollectionObjectService;
  let repo: MockType<Repository<LinkedCollectionObject>>;
  let databaseService: DatabaseUtilitiesService;
  let deletedItemService: DeletedItemService;
  let thirdPartyAccountService: ThirdPartyAccountService;
  let collectionService: CollectionService;
  let trashService: TrashService;
  let settingService: SettingService;
  let logger: LoggerService;
  let linkedCollectionObjectRepo: MockType<LinkedCollectionObjectRepository>;

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
        LinkedCollectionObjectService,
        DeletedItemService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(LinkedCollectionObject),
          useFactory: repoMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(ShareMember),
          useFactory: repoMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(KanbanCard),
          useFactory: repoMockKanbanCardFactory,
        },
        {
          provide: CollectionActivityRepository,
          useFactory: collectionActivityReposMockFactory
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
          provide: ThirdPartyAccountService,
          useValue: {
            isExist: jest.fn((e) => e),
          },
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory,
          useValue: {
            addJob: jest.fn((e) => e),
            addJobCollection: jest.fn((e) => e),
            sendLastModifiedByCollectionId: jest.fn(entity => entity),
          },
        },
        LoggerService,
        {
          // how you provide the injection token in a test instance
          provide: CollectionService,
          useValue: {
            findBy: jest.fn((e) => e),
          },
        },
        {
          provide: TrashService,
          useValue: {
            getIsTrash: jest.fn((e) => 1),
          },
        },
        {
          provide: SettingService,
          useValue: {
            findOneByUserId: jest.fn((e) => 1),
          },
        },
        {
          provide: LinkedCollectionObjectRepository,
          useFactory: linkedCollectionObjectRepository
        },
        {
          provide: HttpService,
          useValue: spyHttpClient
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<LinkedCollectionObjectService>(LinkedCollectionObjectService);
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    repo = module.get(getRepositoryToken(LinkedCollectionObject));
    databaseService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    thirdPartyAccountService = module.get<ThirdPartyAccountService>(ThirdPartyAccountService);
    collectionService = module.get<CollectionService>(CollectionService);
    trashService = module.get<TrashService>(TrashService);
    settingService = module.get<SettingService>(SettingService);
    logger = module.get<LoggerService>(LoggerService);
    logger.logError = jest.fn();
    linkedCollectionObjectRepo = module.get(LinkedCollectionObjectRepository);
    createQueryBuilder = {
      select: jest.fn(entity => createQueryBuilder),
      addSelect: jest.fn(entity => createQueryBuilder),
      leftJoin: jest.fn(entity => createQueryBuilder),
      innerJoin: jest.fn(entity => createQueryBuilder),
      where: jest.fn(entity => createQueryBuilder),
      andWhere: jest.fn(entity => createQueryBuilder),
      execute: jest.fn(entity => createQueryBuilder),
    };
    repo.createQueryBuilder = jest.fn(() => createQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(databaseService).toBeDefined();
    expect(thirdPartyAccountService).toBeDefined();
    expect(collectionService).toBeDefined();
    expect(trashService).toBeDefined();
    expect(logger).toBeDefined();
  });

  it('should be LinkedCollectionRequestParamError checked', () => {
    const eventDto = new LinkedCollectionRequestParamError({
      errors: [new LinkedCollectionParamError({
        attributes: { id: 123 },
        code: ErrorCode.BAD_REQUEST,
        message: "Error"
      })]
    });
    expect(eventDto.errors[0].code).toEqual(ErrorCode.BAD_REQUEST);
    expect(eventDto.errors[0].message).toEqual("Error");
    expect(eventDto.errors[0].attributes).toMatchObject({ id: 123 });
  });

  it('should throw error when find link', async () => {
    const obj = Generator.fakeEntity(OBJ_TYPE.VCARD);
    const error = new Error('UNKNOWN ERROR');
    jest.spyOn(repo, 'findOne').mockImplementationOnce(() => {
      throw error;
    });

    try {
      await service.findOne(obj.user_id, obj.id);
    } catch (err) {
      expect(err).toEqual(error);
    }
  });

  it('should return list of collection links', async () => {
    const obj1 = Generator.fakeEntity(OBJ_TYPE.VCARD);
    const obj2 = Generator.fakeEntity(OBJ_TYPE.EMAIL);
    const mockResults = [obj1, obj2];
    repo.find.mockReturnValue(mockResults);
    const fakeFilter = Generator.fakeFilter();
    fakeFilter.ids = [obj1.id, obj2.id];
    fakeFilter.has_del = 0;
    databaseService.getAll = jest.fn().mockResolvedValue(mockResults);
    deletedItemService.findAll = jest.fn().mockResolvedValue([]);
    const allItems = await service.findAll(user, fakeFilter);
    const { links } = allItems;
    expect(links).not.toBeNull();
    expect(links).toHaveLength(2);
    expect(links[0].collection_id).toEqual(mockResults[0].collection_id);
    const _mockObjUid = LinkHelper.getObjectUid(mockResults[0].object_uid,
      mockResults[0].object_type);
    if (isString(_mockObjUid)) {
      expect(links[0].object_uid).toEqual(_mockObjUid);
    } else {
      expect(links[0].object_uid).toMatchObject(_mockObjUid);
    }
    expect(links[0].object_type).toEqual(mockResults[0].object_type);
    expect(links[0].account_id).toEqual(mockResults[0].account_id);
    expect(links[0].object_href).toEqual(mockResults[0].object_href);
  });

  it('should return list of collection links with deleted item', async () => {
    const obj1 = Generator.fakeEntity(OBJ_TYPE.VCARD);
    const obj2 = Generator.fakeEntity(OBJ_TYPE.EMAIL);
    const mockResults = [obj1, obj2];
    repo.find.mockReturnValue(mockResults);
    const fakeFilter = Generator.fakeFilter();
    fakeFilter.ids = [obj1.id, obj2.id];
    fakeFilter.has_del = 1;
    databaseService.getAll = jest.fn().mockResolvedValue([]);
    deletedItemService.findAll = jest.fn().mockResolvedValue(mockResults.map((link, index) => {
      const delItem = new DeletedItem();
      delItem.item_id = link.id;
      delItem.item_type = DELETED_ITEM_TYPE.COLLECTION_LINK;
      delItem.is_recovery = 0;
      return delItem;
    }));
    const allItems = await service.findAll(user, fakeFilter);
    const { deletedItems } = allItems;
    expect(deletedItems).toHaveLength(2);
    deletedItems.forEach((delItem, index) => {
      expect(delItem.item_id).toEqual(mockResults[index].id);
      expect(delItem.item_type).toEqual(DELETED_ITEM_TYPE.COLLECTION_LINK);
    });
  });

  it('should be success create service', async () => {
    const mockEntity = Generator.fakeEntity(OBJ_TYPE.EMAIL);
    const createDto = Generator.fakeCreatedDTO(mockEntity);
    thirdPartyAccountService.isExist = jest.fn().mockResolvedValue(1);
    const linkCreated = await service.create(user.userId, { ...createDto }, 0);
    const linkCreatedUid = LinkHelper.getObjectUid(linkCreated.object_uid, linkCreated.object_type);
    expect(repo.save).toBeCalledTimes(1);
    if (isString(linkCreatedUid)) {
      expect(linkCreated.object_uid).toEqual(createDto.object_uid.getPlain());
    } else {
      expect(linkCreatedUid).toMatchObject(createDto.object_uid.getPlain());
    }
    expect(linkCreated.object_type).toEqual(createDto.object_type);
    expect(linkCreated.account_id).toEqual(createDto.account_id);
    expect(linkCreated.object_href).toEqual(createDto.object_href);
  });

  it('should be success create collection links', async () => {
    const listEntries = [
      Generator.fakeEntity(OBJ_TYPE.EMAIL),
      Generator.fakeEntity(OBJ_TYPE.CSFILE),
      Generator.fakeEntity(OBJ_TYPE.VTODO),
      Generator.fakeEntity(OBJ_TYPE.VCARD),
      Generator.fakeEntity(OBJ_TYPE.VJOURNAL),
      Generator.fakeEntity(OBJ_TYPE.VEVENT),
      Generator.fakeEntity(OBJ_TYPE.URL),
      Generator.fakeEntity(OBJ_TYPE.GMAIL),
      Generator.fakeEntity(OBJ_TYPE.EMAIL365)
    ];
    CryptoUtil.aes256DecryptBuffer = jest.fn()
      .mockReturnValue(listEntries[7].object_uid.toString());
    CryptoUtil.aes256EncryptBuffer = jest.fn()
      .mockReturnValue(listEntries[7].object_uid.toString());

    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));
    collectionService.findByIds = jest.fn().mockResolvedValue(
      createDtos.map((e) => {
        return { id: e.collection_id };
      }),
    );

    const { created } = await service.createBatchLinks(createDtos, fakeReq);
    createDtos.forEach((createDto, index) => {
      repo.create.mockReturnValue(listEntries[index]);
      thirdPartyAccountService.isExist = jest.fn().mockResolvedValue(1);
      expect(created[index].collection_id).toEqual(createDto.collection_id);
      if (isString(created[index].object_uid)) {
        expect(created[index].object_uid).toEqual(createDto.object_uid.getPlain());
      } else {
        expect(created[index].object_uid).toMatchObject(createDto.object_uid.getPlain());
      }
      expect(created[index].object_type).toEqual(createDto.object_type);
      expect(created[index].account_id).toEqual(createDto.account_id);
      expect(created[index].object_href).toEqual(createDto.object_href);
    });
    expect(repo.create).toBeCalledTimes(createDtos.length);
    expect(repo.save).toBeCalledTimes(createDtos.length);
  });
  it('should be error collection not exist', async () => {
    const listEntries = [
      Generator.fakeEntity(OBJ_TYPE.EMAIL),
      Generator.fakeEntity(OBJ_TYPE.CSFILE),
      Generator.fakeEntity(OBJ_TYPE.VTODO),
      Generator.fakeEntity(OBJ_TYPE.VCARD),
      Generator.fakeEntity(OBJ_TYPE.VJOURNAL),
      Generator.fakeEntity(OBJ_TYPE.VEVENT),
      Generator.fakeEntity(OBJ_TYPE.URL),
    ];
    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));
    collectionService.findByIds = jest.fn().mockResolvedValue([]);
    const { errors } = await service.createBatchLinks(createDtos, fakeReq);
    errors.forEach((err) => {
      expect(err).toBeInstanceOf(LinkedCollectionParamError);
    });
  });
  it('should return links with account id exist', async () => {
    const listEntries = [
      Generator.fakeEntity(OBJ_TYPE.EMAIL),
      Generator.fakeEntity(OBJ_TYPE.CSFILE),
    ];
    listEntries[0].account_id = 0;
    listEntries[1].account_id = 0;
    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));
    collectionService.findByIds = jest.fn().mockResolvedValue(
      createDtos.map((e) => {
        return { id: e.collection_id };
      }),
    );

    const { created } = await service.createBatchLinks(createDtos, fakeReq);
    createDtos.forEach((createDto, index) => {
      repo.create.mockReturnValue(listEntries[index]);
      expect(created[index].collection_id).toEqual(createDto.collection_id);
      if (isString(created[index].object_uid)) {
        expect(created[index].object_uid).toEqual(createDto.object_uid.getPlain());
      } else {
        expect(created[index].object_uid).toMatchObject(createDto.object_uid.getPlain());
      }
      expect(created[index].object_type).toEqual(createDto.object_type);
      expect(created[index].account_id).toEqual(createDto.account_id);
      expect(created[index].object_href).toEqual(createDto.object_href);
    });
    expect(repo.create).toBeCalledTimes(createDtos.length);
    expect(repo.save).toBeCalledTimes(createDtos.length);

  });
  it('should be error account id not exist', async () => {
    const listEntries = [
      Generator.fakeEntity(OBJ_TYPE.EMAIL),
      Generator.fakeEntity(OBJ_TYPE.CSFILE),
    ];
    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));
    collectionService.findByIds = jest.fn().mockResolvedValue(
      createDtos.map((e) => {
        return { id: e.collection_id };
      }),
    );
    jest.spyOn(thirdPartyAccountService, 'isExist')
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    const { errors } = await service.createBatchLinks(createDtos, fakeReq);
    errors.forEach((err) => {
      expect(err).toBeInstanceOf(LinkedCollectionParamError);
    });
  });
  it('should be success created collection link with DavObject', async () => {
    const mockEntity = Generator.fakeEntity(OBJ_TYPE.VCARD);
    const createDto = Generator.fakeCreatedDTO(mockEntity);
    collectionService.findByIds = jest.fn().mockResolvedValue([{ id: createDto.collection_id }]);
    repo.create.mockReturnValue(mockEntity);
    thirdPartyAccountService.isExist = jest.fn().mockResolvedValue(1);
    const { created } = await service.createBatchLinks([{ ...createDto }], fakeReq);
    expect(repo.save).toBeCalledTimes(1);
    expect(created[0].collection_id).toEqual(createDto.collection_id);
    if (isString(created[0].object_uid)) {
      expect(created[0].object_uid).toEqual(createDto.object_uid.getPlain());
    } else {
      expect(created[0].object_uid).toMatchObject(createDto.object_uid.getPlain());
    }
    expect(created[0].object_type).toEqual(createDto.object_type);
    expect(created[0].account_id).toEqual(createDto.account_id);
    expect(created[0].object_href).toEqual(createDto.object_href);
  });

  it('should be QUERY error when create link', async () => {
    const listEntries = [Generator.fakeEntity(OBJ_TYPE.EMAIL)];
    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));
    collectionService.findByIds = jest.fn().mockResolvedValue(
      createDtos.map((e) => {
        return { id: e.collection_id };
      }),
    );
    jest.spyOn(thirdPartyAccountService, 'isExist')
      .mockResolvedValueOnce(1);

    jest.spyOn(service, 'create')
      .mockImplementationOnce(() => {
        throw new QueryFailedError('QUERY ERROR', undefined, new Error());
      });
    const { errors } = await service.createBatchLinks(createDtos, fakeReq);
    expect(errors[0]).toBeInstanceOf(LinkedCollectionParamError);
  });

  it('should be SERVER error when create link', async () => {
    const listEntries = [Generator.fakeEntity(OBJ_TYPE.EMAIL)];
    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));
    collectionService.findByIds = jest.fn().mockResolvedValue(
      createDtos.map((e) => {
        return { id: e.collection_id };
      }),
    );
    jest.spyOn(thirdPartyAccountService, 'isExist')
      .mockResolvedValueOnce(1);

    const createError = new Error('SERVER ERROR');
    jest.spyOn(service, 'create')
      .mockImplementationOnce(() => {
        throw createError;
      });
    try {
      await service.createBatchLinks(createDtos, fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err).toEqual(createError);
    }
  });

  it('should delete one link', async () => {
    const link = Generator.fakeEntity(OBJ_TYPE.EMAIL);
    service.findOne = jest.fn().mockResolvedValueOnce(link);

    const deletedItem = new DeletedItem();
    deletedItem.id = link.id;
    const insertResult = new InsertResult();
    jest.spyOn(deletedItemService, 'createMultiple').mockResolvedValueOnce(insertResult);

    createQueryBuilder.execute.mockReturnValue([{ "lcoID": link.id }])
    const { itemPass } = await service.deleteBatchLinks([{ id: link.id }], fakeReq);
    expect(itemPass).not.toBeNull();
    expect(itemPass[0].id).toEqual(link.id);
  });

  it('should delete list links', async () => {
    const links = [Generator.fakeEntity(OBJ_TYPE.EMAIL), Generator.fakeEntity(OBJ_TYPE.EMAIL)];
    const kanbanCards = [{ id: 1678 }, { id: 1679 }];

    databaseService.findByIds = jest.fn().mockResolvedValue(
      links.map((e) => {
        return { id: e.id };
      }),
    );

    // declare delete data of link object collection
    const deletedItems = links.map(link => {
      const deletedItem = new DeletedItem();
      deletedItem.id = link.id;
      return deletedItem;
    });
    const insertResult = new InsertResult();
    jest.spyOn(deletedItemService, 'createMultiple').mockResolvedValueOnce(insertResult);

    // declare delete data of kanban card
    const deletedKanbanCardItems = kanbanCards.map(item => {
      const deletedItem = new DeletedItem();
      deletedItem.id = item.id;
      return deletedItem;
    });
    jest.spyOn(deletedItemService, 'createMultiple').mockResolvedValueOnce(insertResult);

    createQueryBuilder.execute
      .mockResolvedValueOnce([{ "lcoID": links[0].id, "kanbanCardId": kanbanCards[0].id }])
      .mockResolvedValueOnce([{ "lcoID": links[1].id, "kanbanCardId": kanbanCards[1].id }]);

    const { itemPass } = await service.deleteBatchLinks(links.map(link => {
      return { id: link.id };
    }), fakeReq);

    itemPass.forEach((item, index) => {
      expect(item.id).toEqual(links[index].id);
    });
  });

  it('should handle error when delete list links', async () => {
    const links = [Generator.fakeEntity(OBJ_TYPE.EMAIL), Generator.fakeEntity(OBJ_TYPE.EMAIL)];
    const kanbanCards = [{ id: 1678 }, { id: 1679 }];

    databaseService.findByIds = jest.fn().mockResolvedValue(
      links.map((e) => {
        return { id: e.id };
      }),
    );

    // declare delete data of link object collection
    const deletedItems = links.map(link => {
      const deletedItem = new DeletedItem();
      deletedItem.id = link.id;
      return deletedItem;
    });
    jest.spyOn(deletedItemService, 'create')
      .mockResolvedValueOnce(deletedItems[0])
      .mockResolvedValueOnce(deletedItems[1]);

    // declare delete data of kanban card
    const deletedKanbanCardItems = kanbanCards.map(item => {
      const deletedItem = new DeletedItem();
      deletedItem.id = item.id;
      return deletedItem;
    });
    jest.spyOn(deletedItemService, 'create')
      .mockResolvedValueOnce(deletedKanbanCardItems[0])
      .mockResolvedValueOnce(deletedKanbanCardItems[1]);

    createQueryBuilder.execute
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ "lcoID": links[1].id, "kanbanCardId": kanbanCards[1].id }]);
    repo.delete.mockReturnValue({ affected: 0 });
    const { itemFail } = await service.deleteBatchLinks(links.map(link => {
      return { id: link.id };
    }), fakeReq);
    itemFail.forEach((item, index) => {
      expect(item.message).toEqual(MSG_ERR_LINK.LINK_NOT_EXIST);
    });
  });

  it('should SERVER error when delete list links', async () => {
    const links = [Generator.fakeEntity(OBJ_TYPE.EMAIL)];
    databaseService.findByIds = jest.fn().mockResolvedValue([{ id: links[0].id }]);
    const createError = new Error('SERVER ERROR');
    jest.spyOn(deletedItemService, 'create')
      .mockImplementationOnce(() => {
        throw createError;
      });
    jest.spyOn(service, 'create')
      .mockImplementationOnce(() => {
        throw createError;
      });
    try {
      await service.deleteBatchLinks(
        links.map(link => {
          return { id: link.id };
        }), fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err).toEqual(createError);
    }
  });

  it('should return links when find by UIDs', async () => {
    const link = Generator.fakeEntity(OBJ_TYPE.VCARD);
    jest.spyOn(repo, 'find').mockImplementationOnce(() => {
      return [{ ...link }];
    });
    const linkFound = await service.findByObjectUids(
      user.userId,
      [link.object_uid.toString()],
      OBJ_TYPE.VCARD
    );
    expect(linkFound[0].object_uid).toEqual(link.object_uid);
    expect(linkFound[0].collection_id).toEqual(link.collection_id);
  });
  it('should return one link when find one by UID without option', async () => {
    const link = Generator.fakeEntity(OBJ_TYPE.EMAIL);
    jest.spyOn(repo, 'findOne').mockImplementationOnce(() => {
      return { ...link };
    });
    const linkFound = await service.findOneByObjectUidAndCollectionId(
      link.object_uid,
      link.collection_id);
    expect(linkFound.object_uid).toEqual(link.object_uid);
    expect(linkFound.collection_id).toEqual(link.collection_id);
  });

  it('should return one link when find one by UID', async () => {
    const link = Generator.fakeEntity(OBJ_TYPE.EMAIL);
    jest.spyOn(repo, 'findOne').mockImplementationOnce(() => {
      return { ...link };
    });
    const linkFound = await service.findOneByObjectUidAndCollectionId(
      link.object_uid,
      link.collection_id,
      { fields: ['object_uid', 'collection_id'] });
    expect(linkFound.object_uid).toEqual(link.object_uid);
    expect(linkFound.collection_id).toEqual(link.collection_id);
  });

  afterAll(async () => {
    await app.close();
  });
});
