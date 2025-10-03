import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { isString } from 'class-validator';
import { QueryFailedError, Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../../test';
import { OBJ_TYPE } from '../../../../common/constants/common';
import { ErrorCode } from '../../../../common/constants/error-code';
import { MSG_ERR_WHEN_DELETE } from '../../../../common/constants/message.constant';
import { DeletedItem } from '../../../../common/entities/deleted-item.entity';
import { LinkedObject } from '../../../../common/entities/linked-object.entity';
import { IUser } from '../../../../common/interfaces';
import { LoggerService } from '../../../../common/logger/logger.service';
import { LinkedObjectRepository } from '../../../../common/repositories/linked-object.repository';
import { CryptoUtil } from '../../../../common/utils/crypto.util';
import { ApiLastModifiedQueueService } from '../../../bullmq-queue/api-last-modified-queue.service';
import { CollectionService } from '../../../collection/collection.service';
import { DatabaseUtilitiesService } from '../../../database/database-utilities.service';
import { DeletedItemService } from '../../../deleted-item/deleted-item.service';
import { ThirdPartyAccountService } from '../../../third-party-account/third-party-account.service';
import { TrashService } from '../../../trash/trash.service';
import { LinkHelper } from '../../helper/link.helper';
import { LinkedObjectParamError, LinkedObjectRequestParamError } from '../dtos/error.dto';
import { LinkedObjectService } from '../linked-object.service';
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

const repoMockFactory = jest.fn(() => ({
  save: jest.fn((entity) => {
    entity.id = 1;
    return entity;
  }),
  delete: jest.fn((entity) => {
    return { ...entity, affected: true };
  }),
  find: jest.fn((entity) => entity),
  findOne: jest.fn((entity) => entity),
  create: jest.fn((entity) => entity),
  remove: jest.fn((entity) => entity),
  createQueryBuilder: jest.fn(entity => entity),
  metadata: {
    name: 'LinkedObject',
    ownColumns: [
      {
        databaseName: 'id',
      },
      {
        databaseName: 'user_id',
      },
      {
        databaseName: 'source_object_uid',
      },
      {
        databaseName: 'source_object_type',
      },
      {
        databaseName: 'source_account_id',
      },
      {
        databaseName: 'source_object_href',
      },
      {
        databaseName: 'destination_object_uid',
      },
      {
        databaseName: 'destination_object_type',
      },
      {
        databaseName: 'destination_account_id',
      },
      {
        databaseName: 'destination_object_href',
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
      {
        provide: HttpService,
        useValue: spyHttpClient
      },
    ],
  },
}));

const linkedObjectRepo: () => MockType<LinkedObjectRepository> = jest.fn(() => ({
  findByObjUid: jest.fn(entity => entity),
  find: jest.fn(entity => entity),
  findOne: jest.fn((id: number) => id),
  save: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  insert: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  remove: jest.fn(entity => entity),
  LinkedObjectRepository: jest.fn(entity => ([
    Generator.fakeEntity(OBJ_TYPE.VCARD, OBJ_TYPE.EMAIL),
    Generator.fakeEntity(OBJ_TYPE.VCARD, OBJ_TYPE.EMAIL)
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
}));

const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({}));
const apiLastModifiedServiceMockFactory: () =>
  MockType<ApiLastModifiedQueueService> = jest.fn(() => ({}));

describe('LinkedObjectService', () => {
  let app: INestApplication;
  let service: LinkedObjectService;
  let mockRepository: any;
  let databaseService: DatabaseUtilitiesService;
  let deletedItemService: DeletedItemService;
  let thirdPartyAccountService: ThirdPartyAccountService;
  let trashService: TrashService;
  let logger: LoggerService;
  let createQueryBuilder: any;
  let linkedObjectRepository: MockType<LinkedObjectRepository>;

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
        LinkedObjectService,
        DeletedItemService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(LinkedObject),
          useFactory: repoMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory,
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
          },
        },
        LoggerService,
        {
          // how you provide the injection token in a test instance
          provide: CollectionService,
          useValue: {
            findByIds: jest.fn((e) => e),
          },
        },
        {
          provide: TrashService,
          useValue: {
            getIsTrash: jest.fn((e) => 1),
          },
        },
        {
          provide: LinkedObjectRepository,
          useFactory: linkedObjectRepo
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<LinkedObjectService>(LinkedObjectService);
    mockRepository = module.get(getRepositoryToken(LinkedObject));
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    databaseService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    thirdPartyAccountService = module.get<ThirdPartyAccountService>(ThirdPartyAccountService);
    logger = module.get<LoggerService>(LoggerService);
    trashService = module.get<TrashService>(TrashService);
    linkedObjectRepository = module.get(LinkedObjectRepository);
    createQueryBuilder = {
      select: jest.fn(entity => createQueryBuilder),
      addSelect: jest.fn(entity => createQueryBuilder),
      where: jest.fn(entity => createQueryBuilder),
      andWhere: jest.fn(entity => createQueryBuilder),
      getMany: jest.fn(entity => entity),
      getRawMany: jest.fn(entity => entity),
      getRawAndEntities: jest.fn(entity => {
        return {
          entities: [entity],
          raw: [entity]
        };
      }),
      limit: jest.fn(entity => createQueryBuilder),
      innerJoin: jest.fn(entity => createQueryBuilder),
    };
    mockRepository.createQueryBuilder = jest.fn(() => createQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(databaseService).toBeDefined();
    expect(thirdPartyAccountService).toBeDefined();
    expect(logger).toBeDefined();
    expect(trashService).toBeDefined();
  });

  it('should be LinkedObjectRequestParamError checked', () => {
    const eventDto = new LinkedObjectRequestParamError({
      errors: [new LinkedObjectParamError({
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
    const obj = Generator.fakeEntity(OBJ_TYPE.VCARD, OBJ_TYPE.EMAIL);
    const error = new Error('UNKNOWN ERROR');
    jest.spyOn(mockRepository, 'findOne').mockImplementationOnce(() => {
      throw error;
    });

    try {
      await service.findOne(obj.user_id, obj.id);
    } catch (err) {
      expect(err).toEqual(error);
    }
  });

  it('should return links when find by UIDs', async () => {
    const link = Generator.fakeEntity(OBJ_TYPE.VCARD, OBJ_TYPE.VTODO)
    createQueryBuilder.getRawMany.mockResolvedValue([{ ...link }]);
    const { items: linkFounds } = await service.findByObjectUids(
      user.userId,
      [link.source_object_uid.toString()],
      OBJ_TYPE.VCARD,
      {
        fields: ['id']
      }
    );
    expect(linkFounds[0].source_object_uid).toEqual(link.source_object_uid);
  });

  it('should return list of links', async () => {
    const obj1 = Generator.fakeEntity(OBJ_TYPE.VCARD, OBJ_TYPE.EMAIL);
    const obj2 = Generator.fakeEntity(OBJ_TYPE.VJOURNAL, OBJ_TYPE.VCARD);
    const mockResults = [obj1, obj2];
    mockRepository.find.mockReturnValue(mockResults);
    const fakeFilter = Generator.fakeFilter();
    fakeFilter.has_del = 0;
    fakeFilter.ids = [obj1.id, obj2.id];
    databaseService.getAll = jest.fn().mockResolvedValue(mockResults);
    deletedItemService.findAll = jest.fn().mockResolvedValue([]);
    const allItems = await service.findAll(fakeFilter, fakeReq);
    const { links } = allItems;
    const _mockSrcUid = LinkHelper.getObjectUid(
      mockResults[0].source_object_uid,
      mockResults[0].source_object_type);
    const _mockDesUid = LinkHelper.getObjectUid(
      mockResults[0].destination_object_uid,
      mockResults[0].destination_object_type);
    if (isString(_mockSrcUid)) {
      expect(links[0].source_object_uid)
        .toEqual(_mockSrcUid);
    } else {
      expect(links[0].source_object_uid)
        .toMatchObject(_mockSrcUid);
    }
    expect(links[0].source_object_type).toEqual(mockResults[0].source_object_type);
    expect(links[0].source_account_id).toEqual(mockResults[0].source_account_id);
    expect(links[0].source_object_href).toEqual(mockResults[0].source_object_href);
    if (isString(_mockDesUid)) {
      expect(links[0].destination_object_uid)
        .toEqual(_mockDesUid);
    } else {
      expect(links[0].destination_object_uid)
        .toMatchObject(_mockDesUid);
    }
    expect(links[0].destination_object_type).toEqual(mockResults[0].destination_object_type);
    expect(links[0].destination_account_id).toEqual(mockResults[0].destination_account_id);
    expect(links[0].destination_object_href).toEqual(mockResults[0].destination_object_href);
  });

  it('should return list of links with has_del', async () => {
    const obj1 = Generator.fakeEntity(OBJ_TYPE.VCARD, OBJ_TYPE.EMAIL);
    const obj2 = Generator.fakeEntity(OBJ_TYPE.VJOURNAL, OBJ_TYPE.VCARD);
    const mockResults = [obj1, obj2];
    mockRepository.find.mockReturnValue(mockResults);
    const fakeFilter = Generator.fakeFilter();
    fakeFilter.ids = [obj1.id, obj2.id];
    databaseService.getAll = jest.fn().mockResolvedValue([]);
    deletedItemService.findAll = jest.fn().mockResolvedValue(mockResults.map((e, index) => {
      const delItem = new DeletedItem();
      delItem.id = index;
      delItem.item_id = e.id;
      return delItem;
    }));
    const allItems = await service.findAll(fakeFilter, fakeReq);
    const { deletedItems } = allItems;
    deletedItems.forEach((delItem, index) => {
      expect(delItem.item_id).toEqual(mockResults[index].id);
    });
  });

  it('should be success create a link', async () => {
    const mockEntity = Generator.fakeEntity(OBJ_TYPE.EMAIL, OBJ_TYPE.EMAIL);
    const createDto = Generator.fakeCreatedDTO(mockEntity);
    thirdPartyAccountService.isExist = jest.fn().mockResolvedValue(1);
    const linkCreated = await service.create(user.userId, { ...createDto }, 0);
    const srcUid = LinkHelper.getObjectUid(
      linkCreated.source_object_uid,
      linkCreated.source_object_type);
    const desUid = LinkHelper.getObjectUid(
      linkCreated.destination_object_uid,
      linkCreated.destination_object_type);
    expect(mockRepository.save).toBeCalledTimes(1);
    if (isString(srcUid)) {
      expect(linkCreated.source_object_uid)
        .toEqual(createDto.source_object_uid.getPlain());
    } else {
      expect(srcUid)
        .toMatchObject(createDto.source_object_uid.getPlain());
    }
    if (isString(desUid)) {
      expect(linkCreated.destination_object_uid)
        .toEqual(createDto.destination_object_uid.getPlain());
    } else {
      expect(desUid)
        .toMatchObject(createDto.destination_object_uid.getPlain());
    }
    expect(linkCreated.source_object_type).toEqual(createDto.source_object_type);
    expect(linkCreated.source_account_id).toEqual(createDto.source_account_id);
    expect(linkCreated.source_object_href).toEqual(createDto.source_object_href);
    expect(linkCreated.destination_object_type).toEqual(createDto.destination_object_type);
    expect(linkCreated.destination_account_id).toEqual(createDto.destination_account_id);
    expect(linkCreated.destination_object_href).toEqual(createDto.destination_object_href);
  });
  it('should be success create list links', async () => {
    const listEntries = [
      Generator.fakeEntity(OBJ_TYPE.EMAIL, OBJ_TYPE.VTODO),
      Generator.fakeEntity(OBJ_TYPE.CSFILE, OBJ_TYPE.VTODO),
      Generator.fakeEntity(OBJ_TYPE.VTODO, OBJ_TYPE.VTODO),
      Generator.fakeEntity(OBJ_TYPE.VCARD, OBJ_TYPE.VTODO),
      Generator.fakeEntity(OBJ_TYPE.VJOURNAL, OBJ_TYPE.VTODO),
      Generator.fakeEntity(OBJ_TYPE.VEVENT, OBJ_TYPE.VTODO),
      Generator.fakeEntity(OBJ_TYPE.URL, OBJ_TYPE.VTODO),
      Generator.fakeEntity(OBJ_TYPE.GMAIL, OBJ_TYPE.VTODO),
      Generator.fakeEntity(OBJ_TYPE.EMAIL365, OBJ_TYPE.VTODO)
    ];
    CryptoUtil.aes256DecryptBuffer = jest.fn()
      .mockReturnValue(listEntries[7].source_object_uid.toString());
    CryptoUtil.aes256EncryptBuffer = jest.fn()
      .mockReturnValue(listEntries[7].source_object_uid.toString());
    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));

    const { created } = await service.createBatchLinks(createDtos, fakeReq);
    createDtos.forEach((createDto, index) => {
      mockRepository.create.mockReturnValue(listEntries[index]);
      thirdPartyAccountService.isExist = jest.fn().mockResolvedValue(1);
      if (isString(created[index].source_object_uid)) {
        expect(created[index].source_object_uid)
          .toEqual(createDto.source_object_uid.getPlain());
      } else {
        expect(created[index].source_object_uid)
          .toMatchObject(createDto.source_object_uid.getPlain());
      }
      expect(created[index].source_object_type).toEqual(createDto.source_object_type);
      expect(created[index].source_account_id).toEqual(createDto.source_account_id);
      expect(created[index].source_object_href).toEqual(createDto.source_object_href);
      if (isString(created[index].destination_object_uid)) {
        expect(created[index].destination_object_uid)
          .toEqual(createDto.destination_object_uid.getPlain());
      } else {
        expect(created[index].destination_object_uid)
          .toMatchObject(createDto.destination_object_uid.getPlain());
      }
      expect(created[index].destination_object_type).toEqual(createDto.destination_object_type);
      expect(created[index].destination_account_id).toEqual(createDto.destination_account_id);
      expect(created[index].destination_object_href).toEqual(createDto.destination_object_href);
    });
    expect(mockRepository.create).toBeCalledTimes(createDtos.length);
    expect(mockRepository.save).toBeCalledTimes(createDtos.length);
  });

  it('should be success create link with GMAIL', async () => {
    const listEntries = [Generator.fakeEntity(OBJ_TYPE.VTODO, OBJ_TYPE.GMAIL)];
    CryptoUtil.aes256DecryptBuffer = jest.fn()
      .mockReturnValue(listEntries[0].destination_object_uid.toString());
    CryptoUtil.aes256EncryptBuffer = jest.fn()
      .mockReturnValue(listEntries[0].destination_object_uid.toString());
    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));

    const { created } = await service.createBatchLinks(createDtos, fakeReq);
    createDtos.forEach((createDto, index) => {
      mockRepository.create.mockReturnValue(listEntries[index]);
      thirdPartyAccountService.isExist = jest.fn().mockResolvedValue(1);
      if (isString(created[index].source_object_uid)) {
        expect(created[index].source_object_uid)
          .toEqual(createDto.source_object_uid.getPlain());
      } else {
        expect(created[index].source_object_uid)
          .toMatchObject(createDto.source_object_uid.getPlain());
      }
      expect(created[index].source_object_type).toEqual(createDto.source_object_type);
      expect(created[index].source_account_id).toEqual(createDto.source_account_id);
      expect(created[index].source_object_href).toEqual(createDto.source_object_href);
      if (isString(created[index].destination_object_uid)) {
        expect(created[index].destination_object_uid)
          .toEqual(createDto.destination_object_uid.getPlain());
      } else {
        expect(created[index].destination_object_uid)
          .toMatchObject(createDto.destination_object_uid.getPlain());
      }
      expect(created[index].destination_object_type).toEqual(createDto.destination_object_type);
      expect(created[index].destination_account_id).toEqual(createDto.destination_account_id);
      expect(created[index].destination_object_href).toEqual(createDto.destination_object_href);
    });
    expect(mockRepository.create).toBeCalledTimes(createDtos.length);
    expect(mockRepository.save).toBeCalledTimes(createDtos.length);
  });

  it('should be success create link with EMAIL365', async () => {
    const listEntries = [Generator.fakeEntity(OBJ_TYPE.VTODO, OBJ_TYPE.EMAIL365)];
    CryptoUtil.aes256DecryptBuffer = jest.fn()
      .mockReturnValue(listEntries[0].destination_object_uid.toString());
    CryptoUtil.aes256EncryptBuffer = jest.fn()
      .mockReturnValue(listEntries[0].destination_object_uid.toString());
    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));

    const { created } = await service.createBatchLinks(createDtos, fakeReq);
    createDtos.forEach((createDto, index) => {
      mockRepository.create.mockReturnValue(listEntries[index]);
      thirdPartyAccountService.isExist = jest.fn().mockResolvedValue([{ is_existed: 1 }]);
      if (isString(created[index].source_object_uid)) {
        expect(created[index].source_object_uid)
          .toEqual(createDto.source_object_uid.getPlain());
      } else {
        expect(created[index].source_object_uid)
          .toMatchObject(createDto.source_object_uid.getPlain());
      }
      expect(created[index].source_object_type).toEqual(createDto.source_object_type);
      expect(created[index].source_account_id).toEqual(createDto.source_account_id);
      expect(created[index].source_object_href).toEqual(createDto.source_object_href);
      if (isString(created[index].destination_object_uid)) {
        expect(created[index].destination_object_uid)
          .toEqual(createDto.destination_object_uid.getPlain());
      } else {
        expect(created[index].destination_object_uid)
          .toMatchObject(createDto.destination_object_uid.getPlain());
      }
      expect(created[index].destination_object_type).toEqual(createDto.destination_object_type);
      expect(created[index].destination_account_id).toEqual(createDto.destination_account_id);
      expect(created[index].destination_object_href).toEqual(createDto.destination_object_href);
    });
    expect(mockRepository.create).toBeCalledTimes(createDtos.length);
    expect(mockRepository.save).toBeCalledTimes(createDtos.length);
  });
  it('should be error account id not exist', async () => {
    const listEntries = [
      Generator.fakeEntity(OBJ_TYPE.EMAIL, OBJ_TYPE.VTODO),
      Generator.fakeEntity(OBJ_TYPE.EMAIL, OBJ_TYPE.VTODO),
      Generator.fakeEntity(OBJ_TYPE.EMAIL, OBJ_TYPE.VTODO)
    ];
    listEntries[0].source_account_id = 0;
    listEntries[0].destination_account_id = 0;
    listEntries[1].source_account_id = 1;
    listEntries[1].destination_account_id = 0;
    listEntries[2].source_account_id = 0;
    listEntries[2].destination_account_id = 1;
    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));
    jest.spyOn(thirdPartyAccountService, 'isExist')
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      ;
    const { errors } = await service.createBatchLinks(createDtos, fakeReq);
    errors.forEach((err) => {
      expect(err).toBeInstanceOf(LinkedObjectParamError);
    });
  });

  it('should be QUERY error when create link', async () => {
    const listEntries = [Generator.fakeEntity(OBJ_TYPE.EMAIL, OBJ_TYPE.VTODO)];
    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));
    thirdPartyAccountService.isExist = jest.fn().mockResolvedValue(1);

    jest.spyOn(service, 'create')
      .mockImplementationOnce(() => {
        throw new QueryFailedError('QUERY ERROR', ['testing'], new Error());
      });

    const { errors } = await service.createBatchLinks(createDtos, fakeReq);
    expect(errors[0]).toBeInstanceOf(LinkedObjectParamError);
  });

  it('should be SERVER error when create link', async () => {
    const listEntries = [Generator.fakeEntity(OBJ_TYPE.EMAIL, OBJ_TYPE.VTODO)];
    const createDtos = listEntries.map((mockEntity) => Generator.fakeCreatedDTO(mockEntity));
    thirdPartyAccountService.isExist = jest.fn().mockResolvedValue(1);

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
    const link = Generator.fakeEntity(OBJ_TYPE.VCARD, OBJ_TYPE.EMAIL);
    const deletedItem = new DeletedItem();
    deletedItem.id = link.id;
    service.findOne = jest.fn().mockResolvedValueOnce({ id: link.id });
    jest.spyOn(deletedItemService, 'create').mockResolvedValueOnce(deletedItem);
    const { itemPass } = await service.deleteBatchLinks([{ id: link.id }], fakeReq);
    expect(itemPass).not.toBeNull();
    expect(itemPass[0].id).toEqual(link.id);
  });

  it('should throw error delete link fail', async () => {
    const link = Generator.fakeEntity(OBJ_TYPE.EMAIL, OBJ_TYPE.VTODO);
    const deletedItem = new DeletedItem();
    deletedItem.id = link.id;
    jest.spyOn(deletedItemService, 'create').mockResolvedValueOnce(deletedItem);
    service.findOne = jest.fn().mockResolvedValueOnce({ ...link });
    mockRepository.delete.mockReturnValueOnce({
      data: link,
      affected: 0
    });
    try {
      await service.deleteBatchLinks([{ id: link.id }], fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(LinkedObjectParamError);
    }
  });

  it('should delete list links', async () => {
    const links = [Generator.fakeEntity(OBJ_TYPE.EMAIL, OBJ_TYPE.VTODO),
    Generator.fakeEntity(OBJ_TYPE.EMAIL, OBJ_TYPE.VTODO)];
    databaseService.findByIds = jest.fn().mockResolvedValue(
      links.map((e) => {
        return { id: e.id };
      }),
    );
    const deletedItems = links.map(link => {
      const deletedItem = new DeletedItem();
      deletedItem.id = link.id;
      return deletedItem;
    });
    jest.spyOn(deletedItemService, 'create')
      .mockResolvedValueOnce(deletedItems[0])
      .mockResolvedValueOnce(deletedItems[1]);

    const { itemPass } = await service.deleteBatchLinks(links.map(link => {
      return { id: link.id };
    }), fakeReq);
    itemPass.forEach((item, index) => {
      expect(item.id).toEqual(links[index].id);
    });
  });

  it('should handle error when delete list links', async () => {
    const links = [Generator.fakeEntity(OBJ_TYPE.EMAIL, OBJ_TYPE.VTODO),
    Generator.fakeEntity(OBJ_TYPE.EMAIL, OBJ_TYPE.VTODO),
    Generator.fakeEntity(OBJ_TYPE.EMAIL, OBJ_TYPE.VTODO)];

    jest.spyOn(deletedItemService, 'create')
      .mockResolvedValueOnce(null)
      .mockImplementationOnce(() => {
        throw new QueryFailedError('QUERY ERROR', undefined, new Error('QUERY ERROR'));
      });
    const { itemPass, itemFail } = await service.deleteBatchLinks(links.map(link => {
      return { id: link.id };
    }), fakeReq);
    expect(itemPass).toEqual([]);
    expect(itemFail[0].message).toEqual('QUERY ERROR');
    expect(itemFail[2].message).toEqual(MSG_ERR_WHEN_DELETE);
  });

  it('should SERVER error when delete list links', async () => {
    const links = [Generator.fakeEntity(OBJ_TYPE.EMAIL, OBJ_TYPE.VTODO)];
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
        }),
        fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err).toEqual(createError);
    }
  });

  afterAll(async () => {
    await app.close();
  });
});
