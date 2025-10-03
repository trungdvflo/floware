import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../test';
import { HAS_DEL, IS_TRASHED, TRASH_TYPE } from '../../common/constants/common';
import { MSG_ERR_NOT_EXIST } from '../../common/constants/message.constant';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { EmailObjectId, GeneralObjectId } from '../../common/dtos/object-uid';
import { Cloud } from '../../common/entities/cloud.entity';
import { DeletedItem } from '../../common/entities/deleted-item.entity';
import { TrashEntity } from '../../common/entities/trash.entity';
import { Url } from '../../common/entities/urls.entity';
import { LoggerService } from '../../common/logger/logger.service';
import { CollectionNotificationRepository } from '../../common/repositories/collection-notification.repository';
import { RuleRepository } from '../../common/repositories/rule.repository';
import { TrashRepository } from '../../common/repositories/trash.repository';
import { UrlRepository } from '../../common/repositories/url.repository';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { TrashQueueService } from '../bullmq-queue/trash-queue.service';
import { CollectionService } from '../collection/collection.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { SieveEmailService } from '../manual-rule/sieve.email';
import { TrashCreateDto } from './dtos/trash.create.dto';
import { TrashDeleteDto } from './dtos/trash.delete.dto';
import { TrashRecoverDto } from './dtos/trash.recover.dto';
import { TrashUpdateDto } from './dtos/trash.update.dto';
import { TrashService } from './trash.service';

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

const repositoryMockFactory: () => MockType<Repository<TrashEntity>> = jest.fn(() => ({
  findByObjUid: jest.fn((entity) => entity),
  find: jest.fn((where) => {
    const trash = new TrashEntity();
    trash.id = 372451;
    trash.user_id = 424214;
    trash.object_id = null;
    trash.object_uid = Buffer.from("qwerqwer-qwerdfas-dffdgsdfg-34534");
    trash.object_type = 'EMAIL';
    trash.object_href = null;
    trash.created_date = 1664810470.31;
    trash.updated_date = 1664810470.3;
    trash.object_type = TRASH_TYPE.VCARD;
    trash.object_uid = new GeneralObjectId({
      uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
    }).objectUid;
    return [trash];
  }),
  findOne: jest.fn((entity) => {
    return {
      ...entity,
      id: 1,
      user_id: 1,
      object_type: TRASH_TYPE.URL
    }
  }),
  save: jest.fn((entity) => entity),
  update: jest.fn((entity) => {
    return {
      ...entity,
      id: 1,
      affected: 1
    }
  }),
  insert: jest.fn((entity) => {
    entity.id = 1;
    entity.raw = { insertId: 1 };
    return entity;
  }),
  create: jest.fn((entity) => entity),
  remove: jest.fn((entity) => entity),
  delete: jest.fn((entity) => entity),
  query: jest.fn((entity) => entity),
  createNotiAfterDelete: jest.fn((entity) => 1),
  findByCollection: jest.fn((entity) => entity),
}));
const repositoryDeletedItemMockFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({
  save: jest.fn((entity) => entity),
  find: jest.fn((entity) => entity),
  insert: jest.fn((entity) => entity),
}));
const repositoryMockFactoryQueue: () => MockType<TrashQueueService> = jest.fn(() => ({
  afterCreated: jest.fn((entity) => entity),
  afterDeleted: jest.fn((entity) => entity),
  afterRecovered: jest.fn((entity) => entity),
}));
const repositoryLastApiMockFactory: () => MockType<ApiLastModifiedQueueService> = jest.fn(() => ({
  addJob: jest.fn((entity) => entity),
  addJobCollection: jest.fn((entity) => entity),
  sendLastModifiedByCollectionId: jest.fn(entity => entity),
}));
const repositoryCollectionService: () => MockType<CollectionService> = jest.fn(() => ({
  findOneById: jest.fn((entity) => true),
  getAll: jest.fn((entity) => [entity]),
  findAll: jest.fn((entity) => [entity]),
}));
const repositoryUrl: () => MockType<Repository<Url>> = jest.fn(() => ({
  findOne: jest.fn((entity) => {
    return { id: 1 }
  }),
}));

describe('TrashService', () => {
  let app: INestApplication;
  let service: TrashService;
  let sieveEmailService: SieveEmailService;
  let repository: MockType<TrashRepository>;
  let logger: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrashService,
        SieveEmailService,
        {
          // how you provide the injection token in a test instance
          provide: TrashRepository,
          useFactory: repositoryMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: CollectionNotificationRepository,
          useFactory: repositoryMockFactory,
        },
        {
          provide: RuleRepository,
          useFactory: repositoryMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: UrlRepository,
          useFactory: repositoryMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repositoryDeletedItemMockFactory,
        },
        {
          provide: TrashQueueService,
          useFactory: repositoryMockFactoryQueue,
        },
        LoggerService,
        {
          provide: ApiLastModifiedQueueService,
          useFactory: repositoryLastApiMockFactory,
        },
        {
          provide: CollectionService,
          useFactory: repositoryCollectionService,
        },
        {
          provide: DeletedItemService,
          useFactory: repositoryCollectionService,
        },
        {
          provide: DatabaseUtilitiesService,
          useFactory: repositoryCollectionService,
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(Cloud),
          useFactory: repositoryUrl,
        },
        {
          provide: HttpService,
          useValue: spyHttpClient
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<TrashService>(TrashService);
    sieveEmailService = module.get<SieveEmailService>(SieveEmailService);
    repository = module.get(TrashRepository);
    logger = module.get<LoggerService>(LoggerService);
    logger.logError = jest.fn();

  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be findAll has del', async () => {
    const query = new BaseGetDTO();
    query.page_size = 50;
    query.has_del = HAS_DEL.show;
    const result = await service.findAll(query, fakeReq);
    expect(result).not.toBeNull();
  });

  it('should be create new batch', async () => {
    const trashs = [];
    const trash = new TrashCreateDto();
    trash.object_id = 12;
    trash.object_type = TRASH_TYPE.VCARD;
    trashs.push(trash);
    const result = await service.saveBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be create new batch Folder', async () => {
    const trashs = [];
    const trash = new TrashCreateDto();
    trash.object_id = 12;
    trash.object_type = TRASH_TYPE.FOLDER;
    trashs.push(trash);
    const result = await service.saveBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be create new batch URL', async () => {
    const trashs = [];
    const trash = new TrashCreateDto();
    trash.object_id = 12;
    trash.object_type = TRASH_TYPE.URL;
    trashs.push(trash);
    const result = await service.saveBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be create new batch File', async () => {
    const trashs = [];
    const trash = new TrashCreateDto();
    trash.object_id = 12;
    trash.object_type = TRASH_TYPE.CSFILE;
    trashs.push(trash);
    const result = await service.saveBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be create new batch 2', async () => {
    const trashs = [];
    const trash = new TrashCreateDto();
    trash.object_id = 12;
    trash.object_type = TRASH_TYPE.VCARD;
    trash.trash_time = 123456;
    trash.object_href = 'href';
    trashs.push(trash);
    service.save = jest.fn().mockResolvedValueOnce(false);
    const result = await service.saveBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be create new batch 3', async () => {
    const trashs = [];
    const trash = new TrashCreateDto();
    trash.object_id = 12;
    trash.object_type = TRASH_TYPE.VCARD;
    trashs.push(trash);
    service.save = jest.fn().mockRejectedValue(new Error('test'));
    const result = await service.saveBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be create new batch 4', async () => {
    const trashs = [];
    const trash = new TrashCreateDto();
    trashs.push(trash);
    const result = await service.saveBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be create new', async () => {
    const trash = new TrashEntity();
    trash.object_type = TRASH_TYPE.VCARD;
    trash.object_uid = new GeneralObjectId({
      uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
    }).objectUid;
    const result = await service.save(trash, fakeReq);
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      object_type: 'VCARD',
      object_uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
    });

    trash.object_type = TRASH_TYPE.FOLDER;
    try {
      const result2 = await service.save(trash, {
        userId: 1,
      });
      expect(result2).toThrow(Error);
    } catch (err) { }
  });

  it('should be create new 2', async () => {
    const trash = new TrashEntity();
    trash.object_type = TRASH_TYPE.URL;
    trash.object_uid = new GeneralObjectId({
      uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
    }).objectUid;
    try {
      const result = await service.save(trash, {
        userId: 1,
      });
      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        object_type: 'URL',
        object_uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
      });
    } catch (e) { }
  });

  it('should be create new 3', async () => {
    const trash = new TrashEntity();
    trash.object_type = TRASH_TYPE.CSFILE;
    trash.object_uid = new GeneralObjectId({
      uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
    }).objectUid;
    const result = await service.save(trash, fakeReq);
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      object_type: 'CSFILE',
      object_uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
    });
  });

  it('should be update batch', async () => {
    const trashs = [];
    const trash = new TrashUpdateDto();
    trash.id = 1;
    trash.object_uid = new GeneralObjectId({ uid: '4bab9469-f06c-4508-a857-b7b4df4df42f' });
    trash.object_type = TRASH_TYPE.VCARD;
    trash.trash_time = 123456
    trash.object_href = 'href';
    trashs.push(trash);
    const result = await service.updateBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be update batch 2', async () => {
    const trashs = [];
    const trash = new TrashUpdateDto();
    trash.id = 1;
    trash.object_uid = new EmailObjectId({ uid: 1, path: 'inbox' });
    trash['old_object_uid'] = new EmailObjectId({ uid: 1, path: 'inbox' });
    trash.object_type = TRASH_TYPE.EMAIL;
    trashs.push(trash);
    service.update = jest.fn().mockResolvedValueOnce(false);
    const result = await service.updateBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be update batch 3', async () => {
    const trashs = [];
    const trash = new TrashUpdateDto();
    trash.id = 1;
    trash.object_uid = new GeneralObjectId({ uid: '4bab9469-f06c-4508-a857-b7b4df4df42f' });
    trash.object_type = TRASH_TYPE.VCARD;
    trash.trash_time = 123456;
    trash.object_href = 'href';
    trashs.push(trash);
    const result = await service.updateBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be update', async () => {
    const trash = new TrashEntity();
    trash.id = 1;
    trash.object_type = TRASH_TYPE.VCARD;
    trash.object_uid = new GeneralObjectId({
      uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
    }).objectUid;
    const result = await service.update(trash, fakeReq);
    expect(result).not.toBeNull();
    expect(result).toMatchObject(trash);
  });

  it('should be delete batch', async () => {
    const trashs = [];
    const trash = new TrashDeleteDto();
    trash.id = 1;
    const trash1 = new TrashDeleteDto();
    trash1.id = 1;
    trashs.push(trash);
    trashs.push(trash1);
    const result = await service.deleteBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be delete batch 2', async () => {
    const trashs = [];
    const trash = new TrashDeleteDto();
    trash.id = 1;
    trashs.push(trash);
    service.delete = jest.fn().mockResolvedValueOnce(false);
    const result = await service.deleteBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be delete batch 3', async () => {
    const trashs = [];
    const trash = new TrashDeleteDto();
    trash.id = 1;
    trashs.push(trash);
    const result = await service.deleteBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be delete batch cache ex', async () => {
    const trashs = [];
    const trash = new TrashDeleteDto();
    trash.id = 1;
    trashs.push(trash);
    service.delete = jest.fn().mockRejectedValue({});
    const result = await service.deleteBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.errors).toHaveLength(1);
  });

  it('should be delete not exist', async () => {
    const trash = new TrashEntity();
    trash.id = 1;
    trash.object_type = TRASH_TYPE.VCARD;
    trash.user_id = 1;
    trash.object_uid = new GeneralObjectId({
      uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
    }).objectUid;
    repository.findOne = jest.fn().mockResolvedValueOnce(false);
    const result = await service.delete(
      trash,
      {
        userId: 1, email: '', appId: '', deviceUid: '', token: '', id: 1, userAgent: ''
      },
      fakeReq.headers,
      123456,
    );
    expect(result).not.toBeNull();
    expect(result).toEqual(MSG_ERR_NOT_EXIST);
  });

  it('should be recover batch', async () => {
    const trashs = [];
    const trash = new TrashDeleteDto();
    trash.id = 1;
    trash["new_object_uid"] = "abc";
    const trash1 = new TrashDeleteDto();
    trash1.id = 1;
    trashs.push(trash);
    trashs.push(trash1);
    const result = await service.recoverBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be recover batch 2', async () => {
    const trashs = [];
    const trash = new TrashDeleteDto();
    trash.id = 1;
    trashs.push(trash);
    service.recover = jest.fn().mockResolvedValueOnce(false);
    const result = await service.recoverBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be recover batch 3', async () => {
    const trashs = [];
    const trash = new TrashDeleteDto();
    trash.id = 1;
    trashs.push(trash);
    service.recover = jest.fn().mockRejectedValue(new Error('Async error'));
    const result = await service.recoverBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be recover', async () => {
    const trash = new TrashEntity();
    trash.id = 1;
    trash.object_type = TRASH_TYPE.VCARD;
    trash.user_id = 1;
    trash.object_uid = new GeneralObjectId({
      uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
    }).objectUid;
    const trashRecoveDto = new TrashRecoverDto();
    trashRecoveDto.id = 1;
    repository.findOne = jest.fn().mockResolvedValueOnce(trash);
    repository.delete = jest.fn().mockResolvedValueOnce({ affected: 1 });
    let result = await service.recover(
      trashRecoveDto,
      {
        userId: 1,
      },
      fakeReq.headers,
      1,
    );
    expect(result).not.toBeNull();
    expect(result).toMatchObject(trashRecoveDto);

    repository.findOne = jest.fn().mockResolvedValueOnce(true);
    result = await service.recover(
      trashRecoveDto,
      {
        userId: 1,
      },
      fakeReq.headers,
      1,
    );
    expect(result).not.toBeNull();
    expect(result).toEqual(MSG_ERR_NOT_EXIST);
  });

  it('should be getIsTrash', async () => {
    const result = await service.getIsTrash(0, new GeneralObjectId({
      uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
    }).objectUid, TRASH_TYPE.VCARD
    );
    expect(result).not.toBeNull();
    expect(result).toEqual(0);

    const result2 = await service.getIsTrash(undefined, new GeneralObjectId({
      uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
    }).objectUid, 'abc'
    );
    expect(result).not.toBeNull();
    expect(result).toEqual(0);

    const result3 = await service.getIsTrash(undefined, new GeneralObjectId({
      uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
    }).objectUid, TRASH_TYPE.URL, 'href'
    );
    expect(result).not.toBeNull();
    expect(result).toEqual(IS_TRASHED.NOT_TRASHED);
  });

  afterAll(async () => {
    await app.close();
  });
});
