import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_ERR_NOT_EXIST } from '../../../common/constants/message.constant';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { ShareMember } from '../../../common/entities/share-member.entity';
import { IUser } from '../../../common/interfaces';
import { CollectionActivityRepository } from '../../../common/repositories/collection-activity.repository';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { CollectionActivityService } from '../collection-activity.service';
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
  getAll: jest.fn((entity) => entity),
  getNotifications: jest.fn(entity => [entity]),
  move: jest.fn((entity) => entity),
  getMoveRoleAndCalUri: jest.fn((entity) => entity),
}));
const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({}));
const apiLastModifiedServiceMockFactory: () =>
  MockType<ApiLastModifiedQueueService> = jest.fn(() => ({}));

describe('CollectionActivityService', () => {
  let createQueryBuilder: any;
  let app: INestApplication;
  let service: CollectionActivityService;
  let repo: MockType<CollectionActivityRepository>;
  let deletedItemService: DeletedItemService;
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
        CollectionActivityService,
        DeletedItemService,
        {
          provide: getRepositoryToken(ShareMember),
          useFactory: repoMockFactory,
        },
        {
          provide: CollectionActivityRepository,
          useFactory: repoMockFactory,
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
            addJobCollection: jest.fn((e) => e),
            sendLastModifiedByCollectionId: jest.fn(entity => entity),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn()
          }
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<CollectionActivityService>(CollectionActivityService);
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    repo = module.get(CollectionActivityRepository);
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    createQueryBuilder = {
      select: jest.fn(() => createQueryBuilder),
      addSelect: jest.fn(() => createQueryBuilder),
      leftJoin: jest.fn(() => createQueryBuilder),
      innerJoin: jest.fn(() => createQueryBuilder),
      where: jest.fn(() => createQueryBuilder),
      andWhere: jest.fn(() => createQueryBuilder),
      execute: jest.fn(() => createQueryBuilder),
      limit: jest.fn(() => createQueryBuilder),
      getMany: jest.fn(() => createQueryBuilder),
    };
    repo.createQueryBuilder = jest.fn(() => createQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(repo).toBeDefined();
    expect(apiLastModifiedQueueService).toBeDefined();
  });

  it('filterDuplicateItem should be return data error', async () => {
    const dto_1 = FakeData.fakeUpdatedDTO();
    const resData = service.filterDuplicateItem([dto_1, dto_1]);
    expect(resData.dataFilter[0]).toEqual(dto_1);
    expect(resData.dataError[0]).toEqual(dto_1);
  });

  it('filterDuplicateItem should be return data without duplicate', async () => {
    const dto_1 = FakeData.fakeUpdatedDTO();
    const dto_2 = FakeData.fakeUpdatedDTO();
    const resData = service.filterDuplicateItem([dto_1, dto_2]);
    expect(resData.dataFilter).toEqual([dto_1, dto_2]);
    expect(resData.dataError).toHaveLength(0);
  });



  describe('Should move collection activity', () => {
    const item_1 = FakeData.fakeUpdatedDTO();
    const item_2 = FakeData.fakeUpdatedDTO();

    const entity1 = FakeData.fakeEntity();
    const entity2 = FakeData.fakeEntity();
    const dataDto = [item_1, item_2];
    it('should be success move collection activity', async () => {
      entity1.id = item_1.collection_activity_id;
      entity2.id = item_2.collection_activity_id;

      repo['move'] = jest.fn().mockReturnValueOnce(entity1)
        .mockReturnValueOnce({ ...entity2, old_collection_id: item_2.collection_id });

      const result = await service.moveActivity(dataDto, fakeReq);

      expect(result.itemPass).toHaveLength(1);
      expect(apiLastModifiedQueueService.sendLastModifiedByCollectionId).toBeCalledTimes(3);
    });

    it('should be update duplicate items', async () => {
      entity1.id = item_1.collection_activity_id;

      repo['move'] = jest.fn().mockReturnValueOnce({ ...entity1, has_comment: 1 });
      const result = await service.moveActivity([item_1, item_1], fakeReq);

      expect(result.itemFail).toHaveLength(1);
      expect(apiLastModifiedQueueService.sendLastModifiedByCollectionId).toBeCalledTimes(3);
    });

    it('should return item fail with share user not existed', async () => {
      repo['move'] = jest.fn().mockReturnValue(undefined);

      const result = await service.moveActivity(dataDto, fakeReq);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
      expect(result.itemPass).toHaveLength(0);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST);
      expect(result.itemFail[1].message).toEqual(MSG_ERR_NOT_EXIST);
    });

    it('should throw error when having query failed error', async () => {
      const queryFailedError = new QueryFailedError('', [], new Error());
      repo['move'] = jest.fn().mockImplementationOnce(() => {
        throw queryFailedError;
      })

      const result = await service.moveActivity(dataDto, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[1].code).toEqual(ErrorCode.COLLECTION_NOT_FOUND);
    });
  });


  afterAll(async () => {
    await app.close();
  });
});
