import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { isString } from 'class-validator';
import { QueryFailedError, Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../../test';
import { DELETED_ITEM_TYPE, OBJ_TYPE, SHARE_STATUS } from '../../../../common/constants/common';
import { ErrorCode } from '../../../../common/constants/error-code';
import { MSG_ERR_LINK } from '../../../../common/constants/message.constant';
import { DeletedItem } from '../../../../common/entities/deleted-item.entity';
import { KanbanCard } from '../../../../common/entities/kanban-card.entity';
import { LinkedCollectionObject } from '../../../../common/entities/linked-collection-object.entity';
import { IUser } from '../../../../common/interfaces';
import { LoggerService } from '../../../../common/logger/logger.service';
import { CollectionActivityRepository } from '../../../../common/repositories/collection-activity.repository';
import { CryptoUtil } from '../../../../common/utils/crypto.util';
import { GlobalSettingService } from '../../../../modules/setting/setting.service';
import { ApiLastModifiedQueueService } from '../../../bullmq-queue/api-last-modified-queue.service';
import { DeletedItemService } from '../../../deleted-item/deleted-item.service';
import { ShareMemberService } from '../../../share-member/share-member.service';
import { ThirdPartyAccountService } from '../../../third-party-account/third-party-account.service';
import { LinkHelper } from '../../helper/link.helper';
import { LinkedCollectionParamError, LinkedCollectionRequestParamError } from '../dtos/error.dto';
import { LinkedCollectionObjectMemberService } from '../linked-collection-object-member.service';
import * as Generator from './faker';

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
  findBy: jest.fn((entity) => entity),
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

const repoMockKanbanCardFactory: () => MockType<Repository<KanbanCard>> = jest.fn(() => ({
  delete: jest.fn((entity) => {
    return { ...entity, affected: true };
  })
}));
const apiLastModifiedServiceMockFactory: () =>
  MockType<ApiLastModifiedQueueService> = jest.fn(() => ({}));

describe('LinkedCollectionObjectMemberService', () => {
  let createQueryBuilder: any;
  let app: INestApplication;
  let service: LinkedCollectionObjectMemberService;
  let repo: MockType<Repository<LinkedCollectionObject>>;
  let deletedItemService: DeletedItemService;
  let shareMemberService: ShareMemberService;
  let logger: LoggerService;
  const fakeDeletedDate = 1;
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
        LinkedCollectionObjectMemberService,
        DeletedItemService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(LinkedCollectionObject),
          useFactory: repoMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockFactory,
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
          },
        },
        LoggerService,
        {
          provide: ShareMemberService,
          useValue: {
            getShareMembers: jest.fn((e) => e),
            getShareMembersWithCollectionInfo: jest.fn((e) => e),
          },
        },
        {
          provide: GlobalSettingService,
          useValue: {
            findOneByUserId: jest.fn((e) => 1),
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

    service = module.get<LinkedCollectionObjectMemberService>(LinkedCollectionObjectMemberService);
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    repo = module.get(getRepositoryToken(LinkedCollectionObject));
    shareMemberService = module.get<ShareMemberService>(ShareMemberService);
    logger = module.get<LoggerService>(LoggerService);
    logger.logError = jest.fn();


    createQueryBuilder = {
      select: jest.fn(entity => createQueryBuilder),
      addSelect: jest.fn(entity => createQueryBuilder),
      leftJoin: jest.fn(entity => createQueryBuilder),
      innerJoin: jest.fn(entity => createQueryBuilder),
      innerJoinAndSelect: jest.fn(entity => createQueryBuilder),
      where: jest.fn(entity => createQueryBuilder),
      whereInIds: jest.fn(entity => createQueryBuilder),
      andWhere: jest.fn(entity => createQueryBuilder),
      addOrderBy: jest.fn(entity => createQueryBuilder),
      execute: jest.fn(entity => createQueryBuilder),
      limit: jest.fn(entity => createQueryBuilder),
      getMany: jest.fn(entity => createQueryBuilder),
    };
    repo.createQueryBuilder = jest.fn(() => createQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(shareMemberService).toBeDefined();
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
    fakeFilter.min_id = 0;
    fakeFilter.modified_gte = 0;
    fakeFilter.modified_lt = 0;
    fakeFilter.remove_deleted = true;
    createQueryBuilder.getRawMany = jest.fn().mockResolvedValue(mockResults);
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
    createQueryBuilder.getRawMany = jest.fn().mockResolvedValue([]);
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
    const linkCreated = await service.create(user.userId, { ...createDto }, 123);
    const linkCreatedUid = LinkHelper.getObjectUid(linkCreated.object_uid, linkCreated.object_type);
    expect(repo.save).toBeCalledTimes(1);
    if (isString(linkCreatedUid)) {
      expect(linkCreated.object_uid).toEqual(createDto.object_uid.getPlain());
    } else {
      expect(linkCreatedUid).toMatchObject(createDto.object_uid.getPlain());
    }
    expect(linkCreated.object_type).toEqual(createDto.object_type);
    // expect(linkCreated.account_id).toEqual(createDto.account_id);
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
      Generator.fakeEntity(OBJ_TYPE.GMAIL)
    ];
    CryptoUtil.aes256DecryptBuffer = jest.fn()
      .mockReturnValue(listEntries[7].object_uid.toString());
    CryptoUtil.aes256EncryptBuffer = jest.fn()
      .mockReturnValue(listEntries[7].object_uid.toString());

    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));
    shareMemberService.getShareMembers = jest.fn().mockResolvedValue(createDtos.map(dto => {
      return {
        id: 1,
        user_id: 1, // owner
        collection_id: dto.collection_id,
        shared_status: 1,
        access: 2
      }
    }));
    shareMemberService.getShareMembersWithCollectionInfo = jest.fn().mockResolvedValue(createDtos.map(dto => {
      return {
        id: 1,
        user_id: 1, // owner
        collection_id: dto.collection_id,
        shared_status: 1,
        access: 2
      }
    }));
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
      // expect(created[index].account_id).toEqual(createDto.account_id);
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
    shareMemberService.getShareMembers = jest.fn().mockResolvedValue(createDtos.map(dto => {
      return {
        id: 1,
        user_id: user.userId, // owner
        collection_id: listEntries[0].collection_id,
        shared_status: 1,
        access: 2
      }
    }));
    shareMemberService.getShareMembersWithCollectionInfo = jest.fn().mockResolvedValue([
      {
        id: 1,
        user_id: user.userId, // owner
        collection_id: listEntries[0].collection_id,
        shared_status: 1,
        access: 2
      },
      {
        id: 1,
        user_id: user.userId, // owner
        collection_id: listEntries[1].collection_id,
        shared_status: 1,
        access: 1
      }
    ]);

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
    shareMemberService.getShareMembers = jest.fn().mockResolvedValue(
      createDtos.map((dto) => {
        return {
          id: 1,
          user_id: 1, // owner
          collection_id: dto.collection_id,
          shared_status: 1,
          access: 2
        };
      }),
    );
    shareMemberService.getShareMembersWithCollectionInfo = jest.fn().mockResolvedValue(
      createDtos.map((dto) => {
        return {
          id: 1,
          user_id: 1, // owner
          collection_id: dto.collection_id,
          shared_status: 1,
          access: 2
        };
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
      // expect(created[index].account_id).toEqual(createDto.account_id);
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
    shareMemberService.getShareMembersWithCollectionInfo = jest.fn().mockResolvedValue(
      createDtos.map((dto) => {
        return {
          id: 1,
          user_id: 1, // owner
          collection_id: dto.collection_id,
          shared_status: 1,
          access: 2
        };
      }),
    );
    shareMemberService.getShareMembers = jest.fn().mockResolvedValue(
      createDtos.map((dto) => {
        return {
          id: 1,
          user_id: 1, // owner
          collection_id: dto.collection_id,
          shared_status: 1,
          access: 2
        };
      }),
    );
    const { errors } = await service.createBatchLinks(createDtos, fakeReq);
    errors.forEach((err) => {
      expect(err).toBeInstanceOf(LinkedCollectionParamError);
    });
  });
  it('should be success created collection link with DavObject', async () => {
    const mockEntity = Generator.fakeEntity(OBJ_TYPE.VCARD);
    const createDto = Generator.fakeCreatedDTO(mockEntity);
    shareMemberService.getShareMembers = jest.fn().mockResolvedValue([
      {
        id: 1,
        user_id: 1, // owner
        collection_id: createDto.collection_id,
        shared_status: 1,
        access: 2
      }
    ]);
    shareMemberService.getShareMembersWithCollectionInfo = jest.fn().mockResolvedValue([
      {
        id: 1,
        user_id: 1, // owner
        collection_id: createDto.collection_id,
        shared_status: 1,
        access: 2
      }
    ]);

    repo.create.mockReturnValue(mockEntity);
    const { created } = await service.createBatchLinks([{ ...createDto }], fakeReq);
    expect(repo.save).toBeCalledTimes(1);
    expect(created[0].collection_id).toEqual(createDto.collection_id);
    if (isString(created[0].object_uid)) {
      expect(created[0].object_uid).toEqual(createDto.object_uid.getPlain());
    } else {
      expect(created[0].object_uid).toMatchObject(createDto.object_uid.getPlain());
    }
    expect(created[0].object_type).toEqual(createDto.object_type);
    // expect(created[0].account_id).toEqual(createDto.account_id);
    expect(created[0].object_href).toEqual(createDto.object_href);
  });

  it('should be QUERY error when create link', async () => {
    const listEntries = [Generator.fakeEntity(OBJ_TYPE.EMAIL)];
    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));
    shareMemberService.getShareMembersWithCollectionInfo = jest.fn().mockResolvedValue(
      createDtos.map((e) => {
        return { id: e.collection_id };
      }),
    );

    jest.spyOn(service, 'create')
      .mockImplementationOnce(() => {
        throw new QueryFailedError('QUERY ERROR', undefined, new Error());
      });
    const { errors } = await service.createBatchLinks(createDtos, fakeReq);
    expect(errors[0]).toBeInstanceOf(LinkedCollectionParamError);
  });

  it('should be SERVER error when create link', async () => {
    const listEntries = [Generator.fakeEntity(OBJ_TYPE.EMAIL)
      , Generator.fakeEntity(OBJ_TYPE.EMAIL)
      , Generator.fakeEntity(OBJ_TYPE.EMAIL)];
    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));
    shareMemberService.getShareMembersWithCollectionInfo = jest.fn().mockResolvedValue(
      createDtos.map((e) => {
        return {
          id: 1,
          user_id: 1, // owner
          collection_id: e.collection_id,
          shared_status: 1,
          access: 2
        };
      }),
    );
    QueryFailedError
    const createError = new Error('SERVER ERROR');
    jest.spyOn(service, 'create')
      .mockImplementationOnce(() => {
        throw createError;
      })
      .mockImplementationOnce(() => {
        throw new QueryFailedError('QUERY ERROR', undefined, new Error());
      })
      .mockImplementationOnce(() => {
        throw new LinkedCollectionParamError({
          attributes: { id: 123 },
          code: ErrorCode.BAD_REQUEST,
          message: "Error"
        });
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
    jest.spyOn(deletedItemService, 'createMultiple').mockResolvedValueOnce({ identifiers: [], generatedMaps: [], raw: 1 });

    createQueryBuilder.execute.mockReturnValue([{ "lcoID": link.id, access: 2 }]);
    createQueryBuilder.getMany.mockReturnValue([
      { id: link.collection_id, user_id: link.user_id, "link_id": link.id, access: 2 }
    ]);
    shareMemberService.getShareMembers = jest.fn().mockResolvedValue([
      { id: 1, user_id: link.user_id, collection_id: link.collection_id, shared_status: 1, access: 2 }
    ]);
    repo.findBy = jest.fn().mockResolvedValue([
      { id: link.id, user_id: link.user_id, collection_id: link.collection_id }
    ]);

    const { itemPass } = await service.deleteBatchLinks([{ id: link.id }], fakeReq);
    expect(itemPass).not.toBeNull();
    expect(itemPass[0].id).toEqual(link.id);
  });

  it('should delete list links', async () => {
    const links = [Generator.fakeEntity(OBJ_TYPE.EMAIL), Generator.fakeEntity(OBJ_TYPE.EMAIL)];
    const kanbanCards = [{ id: 1678 }, { id: 1679 }];

    // declare delete data of link object collection
    const deletedItems = links.map(link => {
      const deletedItem = new DeletedItem();
      deletedItem.id = link.id;
      return deletedItem;
    });
    shareMemberService.getShareMembers = jest.fn().mockResolvedValue(links.map(link => {
      return {
        id: link.id, user_id: link.user_id, collection_id: link.collection_id
        , access: 2, shared_status: SHARE_STATUS.JOINED
      }
    }));
    repo.findBy = jest.fn().mockResolvedValue(links.map(link => {
      return { id: link.id, user_id: link.user_id, collection_id: link.collection_id }
    }));
    repo.delete = jest.fn().mockResolvedValueOnce(deletedItems[0]).mockResolvedValueOnce(undefined);
    // declare delete data of kanban card
    const deletedKanbanCardItems = kanbanCards.map(item => {
      const deletedItem = new DeletedItem();
      deletedItem.id = item.id;
      return deletedItem;
    });
    jest.spyOn(deletedItemService, 'createMultiple')
      .mockResolvedValueOnce({ identifiers: [], generatedMaps: [], raw: 1 });
    jest.spyOn(deletedItemService, 'createMultiple')
      .mockResolvedValueOnce({ identifiers: [], generatedMaps: [], raw: 1 });

    createQueryBuilder.execute
      .mockResolvedValueOnce([{ "lcoID": links[0].id, "kanbanCardId": kanbanCards[0].id }])
      .mockResolvedValueOnce([{ "lcoID": links[1].id, "kanbanCardId": kanbanCards[1].id }]);
    createQueryBuilder.getMany.mockReturnValue(
      links.map(link =>
        ({ id: link.collection_id, user_id: link.user_id, "link_id": link.id, shared_status: 1, access: 2 }))
    );

    const { itemPass, itemFail } = await service.deleteBatchLinks(links.map(link => {
      return { id: link.id };
    }), fakeReq);

    expect(itemPass[0].id).toEqual(links[0].id);
    expect(itemFail.length).toEqual(1);
  });

  it('should handle error when delete list links', async () => {
    const links = [Generator.fakeEntity(OBJ_TYPE.EMAIL), Generator.fakeEntity(OBJ_TYPE.EMAIL)];
    const kanbanCards = [{ id: 1678 }, { id: 1679 }];

    // declare delete data of link object collection
    const deletedItems = links.map(link => {
      const deletedItem = new DeletedItem();
      deletedItem.id = link.id;
      return deletedItem;
    });
    shareMemberService.getShareMembers = jest.fn().mockResolvedValue([
      { id: links[0].id, user_id: links[0].user_id, collection_id: links[0].collection_id, shared_status: 0, access: 2 },
      { id: links[1].id, user_id: links[1].user_id, collection_id: links[1].collection_id, shared_status: 1, access: 2 }
    ]);
    repo.findBy = jest.fn().mockResolvedValue(links.map(link => {
      return { id: link.id, user_id: link.user_id, collection_id: link.collection_id }
    }));

    // declare delete data of kanban card
    const deletedKanbanCardItems = kanbanCards.map(item => {
      const deletedItem = new DeletedItem();
      deletedItem.id = item.id;
      return deletedItem;
    });
    jest.spyOn(deletedItemService, 'create')
      .mockResolvedValueOnce(deletedKanbanCardItems[0])
      .mockResolvedValueOnce(deletedKanbanCardItems[1]);

    createQueryBuilder.execute.mockReturnValue([]);
    createQueryBuilder.getMany.mockReturnValue(
      links.map(link =>
        ({ id: link.collection_id, user_id: link.user_id, "link_id": link.id, access: 2 }))
    );
    const { itemFail } = await service.deleteBatchLinks(links.map(link => {
      return { id: link.id };
    }), fakeReq);
    expect(itemFail[0].message).toEqual(MSG_ERR_LINK.COLLECTION_NOT_JOIN);
    expect(itemFail[1].message).toEqual(MSG_ERR_LINK.LINK_NOT_EXIST);

  });

  it('should SERVER error when delete list links', async () => {
    const links = [Generator.fakeEntity(OBJ_TYPE.EMAIL)];
    const createError = new Error('SERVER ERROR');
    jest.spyOn(deletedItemService, 'create')
      .mockImplementationOnce(() => {
        throw createError;
      });
    jest.spyOn(service, 'create')
      .mockImplementationOnce(() => {
        throw createError;
      });
    shareMemberService.getShareMembers = jest.fn().mockResolvedValue(links.map(link => {
      return { id: link.id, user_id: link.user_id, collection_id: link.collection_id, shared_status: 1, access: 2 }
    }));
    repo.findBy = jest.fn().mockResolvedValue(links.map(link => {
      return { id: link.id, user_id: link.user_id, collection_id: link.collection_id }
    }));
    createQueryBuilder.getMany.mockReturnValue(
      links.map(link =>
        ({ id: link.collection_id, user_id: link.user_id, "link_id": link.id, access: 2 }))
    );
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


  afterAll(async () => {
    await app.close();
  });
});
