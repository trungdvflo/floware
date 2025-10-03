import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { OBJECT_SHARE_ABLE } from '../../../common/constants';
import { BaseGetDTO } from '../../../common/dtos/base-get.dto';
import { GeneralObjectId } from '../../../common/dtos/object-uid';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { CollectionHistoryRepository } from '../../../common/repositories/collection-history.repository';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { CreateHistoryDto } from '../dtos/history.create.dto';
import { DeleteHistoryDto } from '../dtos/history.delete.dto';
import { HistoryService } from '../history.service';
import { fakeHistory } from './fakeData';

const historyReposMockFactory: () => MockType<CollectionHistoryRepository> = jest.fn(() => ({
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
const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({}));

const apiLastModifiedServiceMockFactory: (
) => MockType<ApiLastModifiedQueueService> = jest.fn(() => ({
  addJob: jest.fn(entity => entity),
  addJobCollection: jest.fn(entity => entity),
  sendLastModifiedByCollectionId: jest.fn(entity => entity),
}));

describe('HistoryService', () => {
  let app: INestApplication;
  let service: HistoryService;
  let historyRepo: MockType<CollectionHistoryRepository>;
  let deletedItemService: DeletedItemService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        DeletedItemService,
        DatabaseUtilitiesService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory
        },
        {
          provide: CollectionHistoryRepository,
          useFactory: historyReposMockFactory
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory
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
    deletedItemService = module.get<any>(DeletedItemService);
    service = module.get<HistoryService>(HistoryService);
    historyRepo = module.get(CollectionHistoryRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(historyRepo).toBeDefined();
  });

  describe('Get history', () => {
    fakeReq.user = {
      id: 1, token: '', userId: 1, userAgent: '', email: 'anph@abc.com', appId: '', deviceUid: ''
    };
    it('should be return error', async () => {
      try {
        const query = {
          page_size: 10,
          has_del: 1,
          modified_gte: 1247872251.212,
          modified_lt: 1247872251.212,
          ids: []
        } as BaseGetDTO;
        deletedItemService.findAll = jest.fn().mockReturnValue([]);
        historyRepo.getAllHistory = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.getAllHistories(query, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be get history', async () => {
      const req = {
        page_size: 10,
        has_del: 1,
        modified_gte: 1247872251.212,
        modified_lt: 1247872251.212,
        ids: []
      } as BaseGetDTO;
      deletedItemService.findAll = jest.fn().mockReturnValue([]);
      historyRepo.getAllHistory = jest.fn().mockReturnValue(fakeHistory);
      const result = await service.getAllHistories(req, fakeReq);
      expect(result.data[0]).toEqual(fakeHistory[0]);
    });
  });

  describe('Created history', () => {
    it('should be return valid history', async () => {
      const dtoHistory: CreateHistoryDto[] = [{
        "collection_id": 123,
        "object_uid": new GeneralObjectId({ uid: "d5a68e33-ba04-11eb-a32e-5bed2a93fc42" }),
        "object_type": OBJECT_SHARE_ABLE.VTODO,
        "action_time": 12345.345,
        "content": "created new item",
        parent_id: 0,
        action: 1,
        assignees: [],
        updated_date: Date.now() / 1000,
        created_date: Date.now() / 1000,
        ref: "1"
      }];
      historyRepo.insertHistory = jest.fn().mockResolvedValueOnce({ ...dtoHistory[0], object_uid: dtoHistory[0].object_uid.getPlain() });
      historyRepo.createNotification = jest.fn().mockResolvedValueOnce({ ...dtoHistory[0], object_uid: dtoHistory[0].object_uid.getPlain() });
      const result = await service.createBatchHistory(dtoHistory, fakeReq);
      expect(result.itemPass[0]).toEqual({
        ...dtoHistory[0],
        object_uid: dtoHistory[0].object_uid.getPlain()
      });
    });

    it('should be return error 1', async () => {
      try {
        const dtoHistory: CreateHistoryDto[] = [{
          "collection_id": 123,
          "object_uid": new GeneralObjectId({ uid: "d5a68e33-ba04-11eb-a32e-5bed2a93fc42" }),
          "object_type": OBJECT_SHARE_ABLE.VTODO,
          "action_time": 12345.345,
          "content": "created new item",
          parent_id: 0,
          action: 1,
          updated_date: Date.now() / 1000,
          created_date: Date.now() / 1000,
          ref: "1"
        }];
        historyRepo.insertHistory = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.createBatchHistory(dtoHistory, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 2', async () => {
      try {
        const dtoHistory: CreateHistoryDto[] = [{
          "collection_id": 123,
          "object_uid": new GeneralObjectId({ uid: "d5a68e33-ba04-11eb-a32e-5bed2a93fc42" }),
          "object_type": OBJECT_SHARE_ABLE.VTODO,
          "action_time": 12345.345,
          "content": "created new item",
          action: 1,
          parent_id: 0,
          updated_date: Date.now() / 1000,
          created_date: Date.now() / 1000,
        }];
        historyRepo.insertHistory = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.createBatchHistory(dtoHistory, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Delete history', () => {
    it('should be return valid history', async () => {
      const dtoHistory: DeleteHistoryDto[] = [{
        'id': 1,
        updated_date: Date.now() / 1000
      }];
      historyRepo.deleteHistory = jest.fn().mockReturnValue(dtoHistory[0]);
      const result = await service
        .deleteBatchHistory(dtoHistory, fakeReq);

      expect(result.itemPass[0].id).toEqual(dtoHistory[0].id);
    });

    it('should be return error 1', async () => {
      try {
        const dtoHistory: DeleteHistoryDto[] = [{
          id: 1,
          "updated_date": new Date().getTime() / 1000,
        }];
        historyRepo.deleteHistory = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.deleteBatchHistory(dtoHistory, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 2', async () => {
      try {
        const dtoHistory: DeleteHistoryDto[] = [{
          id: 1,
          updated_date: Date.now() / 1000
        }];
        historyRepo.deleteHistory = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.deleteBatchHistory(dtoHistory, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 3', async () => {
      try {
        const dtoHistory: DeleteHistoryDto[] = [{
          id: 1,
          updated_date: Date.now() / 1000
        },
        {
          id: 1,
          updated_date: Date.now() / 1000
        }];
        historyRepo.deleteHistory = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.deleteBatchHistory(dtoHistory, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should not send last modify', async () => {
      try {
        const dtoHistory: DeleteHistoryDto[] = [];
        historyRepo.deleteHistory = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.deleteBatchHistory(dtoHistory, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
