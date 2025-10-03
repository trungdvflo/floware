import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { DeletedItem, ShareMember } from '../../../common/entities';
import { IUser } from '../../../common/interfaces';
import { CollectionNotificationRepository } from '../../../common/repositories';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { CollectionNotificationService } from '../collection-notification.service';
import { DeleteNotificationDto } from '../dtos';
import { UpdateNotificationDto } from '../dtos/notification.update.dto';
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
  getNotification: jest.fn((entity) => entity),
  getNotifications: jest.fn(entity => [entity]),
  move: jest.fn((entity) => entity),
  getMoveRoleAndCalUri: jest.fn((entity) => entity),
}));
const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({}));
const apiLastModifiedServiceMockFactory: () =>
  MockType<ApiLastModifiedQueueService> = jest.fn(() => ({}));

describe('CollectionNotificationService', () => {
  let createQueryBuilder: any;
  let app: INestApplication;
  let service: CollectionNotificationService;
  let notiRepo: MockType<CollectionNotificationRepository>;
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
        CollectionNotificationService,
        DeletedItemService,
        {
          provide: getRepositoryToken(ShareMember),
          useFactory: repoMockFactory,
        },
        {
          provide: CollectionNotificationRepository,
          useFactory: repoMockFactory,
        },
        {
          provide: CollectionNotificationRepository,
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
            sendLastModified: jest.fn(entity => entity),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<CollectionNotificationService>(CollectionNotificationService);
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    notiRepo = module.get(CollectionNotificationRepository);
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(apiLastModifiedQueueService).toBeDefined();
  });

  describe('Should get notification', () => {
    it('should get collection instance list return empty array', async () => {
      const query = {
        page_size: 1100
      };
      notiRepo.getNotifications = jest.fn().mockReturnValue([]);
      const result = await service.getNotifications(query, fakeReq);
      expect(notiRepo.getNotifications).toBeCalledTimes(1);
      expect(result.data).not.toBeNull();
      expect(result.data).toHaveLength(0);
    });

    it('should get collection instance list', async () => {
      const entity1 = FakeData.fakeEntity();
      const entity2 = FakeData.fakeEntity();
      const query = {
        page_size: 50,
        has_del: 1
      };
      notiRepo.getNotifications = jest.fn().mockResolvedValue([entity1, entity2]);
      deletedItemService.findAll = jest.fn().mockReturnValue([]);

      const result = await service.getNotifications(query, fakeReq);
      expect(notiRepo.getNotifications).toHaveBeenCalledWith({
        filter: query,
        user: fakeReq.user
      });
      expect(notiRepo.getNotifications).toBeCalledTimes(1);
      expect(result).toMatchObject({
        data: [entity1, entity2],
        data_del: []
      });
      expect(result.data).toHaveLength(2);
      expect(result.data[0].collection_id).toEqual(entity1.collection_id);
    });

    it('should get collection instance list with collection_id', async () => {
      const entity1 = FakeData.fakeEntity();
      const entity2 = FakeData.fakeEntity();
      const query = {
        page_size: 50,
        collection_id: entity1.collection_id
      };
      notiRepo.getNotifications = jest.fn().mockResolvedValue([entity1, entity2]);
      deletedItemService.findAll = jest.fn().mockReturnValue([]);

      const result = await service.getNotifications(query, fakeReq);

      expect(notiRepo.getNotifications).toHaveBeenCalledWith({
        filter: query,
        user:fakeReq.user
      });
      expect(notiRepo.getNotifications).toBeCalledTimes(1);
      expect(result.data[0]).toEqual(entity1);
      expect(result.data[0].collection_id).toEqual(entity1.collection_id);
    });
  });

  describe('Should update  notification status', () => {

    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };
    it('should be return duplicate notification', async () => {
      const dtoNotification: UpdateNotificationDto[] = [{
        id: 1,
        status: 1,
        action_time: Date.now() / 1000
      }];
      const notificationUpdated = {
        ...dtoNotification[0]
      };
      notiRepo.updateNotificationStatus = jest.fn().mockReturnValue(notificationUpdated);
      const result = await service
        .updateNotificationStatus([notificationUpdated, notificationUpdated], fakeReq);
      expect(result.itemPass.length).toEqual(1);
      expect(result.itemFail.length).toEqual(1);
    });
    it('should be return error notification', async () => {
      notiRepo.updateNotificationStatus = jest.fn().mockReturnValue({});
      const result = await service
        .updateNotificationStatus([], fakeReq);
      expect(result.itemPass.length).toEqual(0);
      expect(result.itemFail.length).toEqual(0);
    });
    it('should be return valid notification', async () => {
      const dtoNotification: UpdateNotificationDto[] = [{
        "id": 1,
        status: 0,
        action_time: Date.now() / 1000,
        updated_date: Date.now() / 1000,
      }];
      const notificationUpdated = {
        ...dtoNotification[0]
      };
      notiRepo.updateNotificationStatus = jest.fn().mockReturnValue(notificationUpdated);

      const result = await service.updateNotificationStatus(dtoNotification, fakeReq);
      expect(result.itemPass[0]).toEqual(notificationUpdated);
    });
    it('should be return valid notification with mention', async () => {
      const dtoNotification: UpdateNotificationDto[] = [{
        "id": 1,
        status: 0,
        action_time: Date.now() / 1000,
        updated_date: Date.now() / 1000,
      }];
      const notificationUpdated = {
        ...dtoNotification[0]
      };
      notiRepo.updateNotificationStatus = jest.fn().mockReturnValue(notificationUpdated);
      const result = await service.updateNotificationStatus(dtoNotification, fakeReq);
      expect(result.itemPass[0]).toEqual(notificationUpdated);
    });

    it('should be return error 1', async () => {
      try {
        const dtoNotification: UpdateNotificationDto[] = [{
          "id": 1,
          status: 0,
          action_time: Date.now() / 1000,
          updated_date: Date.now() / 1000,

        }];
        notiRepo.updateNotificationStatus = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.updateNotificationStatus(dtoNotification, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 2', async () => {
      try {
        const dtoNotification: UpdateNotificationDto[] = [{
          "id": 1,
          status: 0,
          action_time: Date.now() / 1000,
          updated_date: Date.now() / 1000,
        }];
        notiRepo.updateNotificationStatus = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.updateNotificationStatus(dtoNotification, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Delete notification', () => {
    it('should be return valid notification', async () => {
      const dtoNotification: DeleteNotificationDto[] = [{
        'id': 1,
        deleted_date: Date.now() / 1000
      }];
      notiRepo.deleteNotification = jest.fn().mockReturnValue({
        'id': 1,
        collection_id: 1
      });
      const result = await service
        .deleteBatchNotification(dtoNotification, fakeReq);
      expect(result.itemPass[0].id).toEqual(dtoNotification[0].id);
    });

    it('should be return error 1', async () => {
      try {
        const dtoNotification: DeleteNotificationDto[] = [{
          id: 1,
          "deleted_date": new Date().getTime() / 1000,
        }];
        notiRepo.deleteNotification = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.deleteBatchNotification(dtoNotification, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 2', async () => {
      try {
        const dtoNotification: DeleteNotificationDto[] = [{
          id: 1,
          deleted_date: Date.now() / 1000
        }];
        notiRepo.deleteNotification = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.deleteBatchNotification(dtoNotification, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 3', async () => {
      try {
        const dtoNotification: DeleteNotificationDto[] = [{
          id: 1,
          deleted_date: Date.now() / 1000
        },
        {
          id: 1,
          deleted_date: Date.now() / 1000
        }];
        notiRepo.deleteNotification = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.deleteBatchNotification(dtoNotification, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should not send last modify', async () => {
      try {
        const dtoNotification: DeleteNotificationDto[] = [];
        notiRepo.deleteNotification = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.deleteBatchNotification(dtoNotification, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
