import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { TRACKING_STATUS } from '../../../common/constants';
import { ErrorCode } from '../../../common/constants/error-code';
import {
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_NOT_EXIST
} from '../../../common/constants/message.constant';
import { ErrorDTO } from '../../../common/dtos/error.dto';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { ThirdPartyAccount } from '../../../common/entities/third-party-account.entity';
import { Tracking } from '../../../common/entities/tracking.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import { DatabaseUtilitiesService } from '../../../modules/database/database-utilities.service';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { TrackingService } from '../tracking.service';
import * as Generator from './generator';

const repoMockFactory = jest.fn(() => ({
  save: jest.fn((entity) => {
    entity.id = 1;
    return entity;
  }),
  insert: jest.fn((entity) => {
    entity.id = 1;
    entity.raw = { insertId: 1 };
    return entity;
  }),
  find: jest.fn((entity) => entity),
  findOne: jest.fn((entity) => entity),
  create: jest.fn((entity) => entity),
  update: jest.fn((entity) => entity),
  delete: jest.fn((entity) => entity),
  metadata: {
    ownColumns: [
      {
        databaseName: 'id',
      },
      {
        databaseName: 'user_id',
      },
      {
        databaseName: 'account_id',
      },
      {
        databaseName: 'message_id',
      },
      {
        databaseName: 'emails',
      },
      {
        databaseName: 'object_uid',
      },
      {
        databaseName: 'status',
      },
      {
        databaseName: 'subject',
      },
      {
        databaseName: 'created_date',
      },
      {
        databaseName: 'replied_time',
      },
      {
        databaseName: 'time_send',
      },
      {
        databaseName: 'time_tracking',
      },
      {
        databaseName: 'updated_date',
      },
    ],
  },
}));

const repoMockThirdPartyAccountFactory = jest.fn(() => ({
  find: jest.fn((entity) => entity),
}));

const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({
  create: jest.fn((entity) => entity),
  save: jest.fn((entity) => entity),
}));

const apiLastModifiedQueueServiceMockFactory: () => MockType<ApiLastModifiedQueueService> = jest.fn(
  () => ({
    addJob: jest.fn((entity) => entity),
  }),
);

const deletedItemServiceMockFactory: () => MockType<DeletedItemService> = jest.fn(() => ({
  findAll: jest.fn((e) => e),
  create: jest.fn((e) => e),
}));

describe('TrackingService', () => {
  let app: INestApplication;
  let service: TrackingService;
  let repo: MockType<Repository<Tracking>>;
  let thirdPartyAccountRepo: MockType<Repository<ThirdPartyAccount>>;
  let deletedItemService: MockType<DeletedItemService>;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let apiLastModifiedQueueService: ApiLastModifiedQueueService;
  const userId = 1;
  let createQueryBuilder: any;
  const fakeDeletedDate = 1;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        TrackingService,
        DatabaseUtilitiesService,
        DeletedItemService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(Tracking),
          useFactory: repoMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(ThirdPartyAccount),
          useFactory: repoMockThirdPartyAccountFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedQueueServiceMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: DeletedItemService,
          useFactory: deletedItemServiceMockFactory,
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn((e) => e),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<TrackingService>(TrackingService);
    repo = module.get(getRepositoryToken(Tracking));
    thirdPartyAccountRepo = module.get(getRepositoryToken(ThirdPartyAccount));
    deletedItemService = module.get(DeletedItemService);
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    databaseUtilitiesService = module.get<any>(DatabaseUtilitiesService);
    createQueryBuilder = {
      select: jest.fn((entity) => createQueryBuilder),
      addSelect: jest.fn((entity) => createQueryBuilder),
      where: jest.fn((entity) => createQueryBuilder),
      andWhere: jest.fn((entity) => createQueryBuilder),
      getMany: jest.fn((entity) => entity),
      getRawMany: jest.fn((entity) => entity),
      execute: jest.fn().mockResolvedValue([]),
      limit: jest.fn((entity) => createQueryBuilder),
      innerJoin: jest.fn((entity) => createQueryBuilder),
    };
    thirdPartyAccountRepo.createQueryBuilder = jest.fn(() => createQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find and return the tracking', async () => {
    const obj = Generator.fakeTracking();
    repo.findOne.mockReturnValue(obj);
    const dto = await service.findOne(userId, obj.id);
    expect(dto).toEqual(obj);
  });

  it('should throw logger error when find tracking', async () => {
    const obj = Generator.fakeTracking();
    const error = new Error('UNKNOWN ERROR');
    let thrownError;
    jest.spyOn(repo, 'findOne').mockImplementationOnce(() => {
      throw error;
    });

    try {
      await service.findOne(userId, obj.id);
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).toEqual(error);
  });

  it('should find and return list of trackings', async () => {
    const obj1 = Generator.fakeTracking();
    const obj2 = Generator.fakeTracking();
    const mockResults = [obj1, obj2];
    databaseUtilitiesService.getAll = jest.fn().mockResolvedValue(mockResults);

    const fakeFilter = Generator.fakeFilter();
    fakeFilter.ids = [obj1.id, obj2.id];
    const trackings = await service.findAll(fakeFilter, fakeReq);
    const { data } = trackings;
    expect(data[0].account_id).toEqual(mockResults[0].account_id);
    expect(data[0].subject).toEqual(mockResults[0].subject);
    expect(data[0].emails.length).toEqual(mockResults[0].emails.length);
    expect(data[0].replied_time).toEqual(mockResults[0].replied_time);
    expect(data[0].status).toEqual(mockResults[0].status);
    expect(data[0].time_send).toEqual(mockResults[0].time_send);
    expect(data[0].time_tracking).toEqual(mockResults[0].time_tracking);
  });

  it('should throw logger error when find list of trackings', async () => {
    const error = new Error('UNKNOWN ERROR');
    let thrownError;
    databaseUtilitiesService.getAll = jest.fn().mockImplementationOnce(() => {
      throw error;
    });
    try {
      const fakeFilter = Generator.fakeFilter();
      await service.findAll(fakeFilter, fakeReq);
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).toEqual(error);
  });

  it('should find and return list of trackings and deleted trackings', async () => {
    const obj1 = Generator.fakeTracking();
    const obj2 = Generator.fakeTracking();
    const mockResults = [obj1, obj2];
    databaseUtilitiesService.getAll = jest.fn().mockResolvedValue(mockResults);
    const mockDeletedItem = {
      item_id: 1,
      is_recovery: 0,
    };
    deletedItemService.findAll.mockReturnValue([mockDeletedItem]);

    const fakeFilter = Generator.fakeFilter();
    fakeFilter.ids = [obj1.id, obj2.id];
    const trackings = await service.findAll({ ...fakeFilter, has_del: 1 }, fakeReq);
    const { data, data_del } = trackings;
    expect(data[0].account_id).toEqual(mockResults[0].account_id);
    expect(data[0].subject).toEqual(mockResults[0].subject);
    expect(data[0].emails.length).toEqual(mockResults[0].emails.length);
    expect(data[0].replied_time).toEqual(mockResults[0].replied_time);
    expect(data[0].status).toEqual(mockResults[0].status);
    expect(data[0].time_send).toEqual(mockResults[0].time_send);
    expect(data[0].time_tracking).toEqual(mockResults[0].time_tracking);

    expect(data_del[0].item_id).toEqual(mockDeletedItem.item_id);
    expect(data_del[0].is_recovery).toEqual(mockDeletedItem.is_recovery);
  });

  it('should be success created tracking', async () => {
    const createDto = Generator.fakeCreatedTracking();
    const created = await service.create(userId, createDto, 1);
    expect(created.account_id).toEqual(createDto.account_id);
    expect(created.subject).toEqual(createDto.subject);
    expect(created.replied_time).toEqual(createDto.replied_time);
    expect(created.status).toEqual(createDto.status);
    expect(created.time_send).toEqual(createDto.time_send);
    expect(created.time_tracking).toEqual(createDto.time_tracking);
  });

  it('should be success created tracking with correct data', async () => {
    const createDto = Generator.fakeCreatedTracking();
    delete createDto.object_uid;
    delete createDto.status;
    const created = await service.create(userId, createDto, 1);
    expect(created.account_id).toEqual(createDto.account_id);
    expect(created.subject).toEqual(createDto.subject);
    expect(created.replied_time).toEqual(createDto.replied_time);
    expect(created.time_send).toEqual(createDto.time_send);
    expect(created.time_tracking).toEqual(createDto.time_tracking);
    expect(created.object_uid).toBeUndefined();
    expect(created.status).toEqual(TRACKING_STATUS.WAITING);
  });

  // it('should throw logger error when create tracking failed', async () => {
  //   const error = new Error('UNKNOWN ERROR');
  //   let thrownError;
  //   jest.spyOn(repo, 'create').mockImplementationOnce(() => {
  //     throw error;
  //   });

  //   try {
  //     const createDto = Generator.fakeCreatedTracking();
  //     await service.create(userId, createDto, 1);
  //   } catch (err) {
  //     thrownError = err;
  //   }
  //   expect(thrownError).toEqual(error);
  // });

  it('should throw typeorm error when create tracking failed', async () => {
    const createDto = Generator.fakeCreatedTracking();
    const error = {
      code: 'ER_DUP_ENTRY',
      errno: 1062,
      index: 0,
      message: `ER_DUP_ENTRY: Duplicate entry '0-\\x00\\x00\\x00{\\x00\\x00\\x00\\x00INBOX' for key 'uniq_on_account_id_and_object_uid'`,
      name: 'QueryFailedError',
    };
    repo.create.mockReturnValue(createDto);
    jest.spyOn(repo, 'insert').mockImplementationOnce(() => {
      throw error;
    });
    let thrownError;
    try {
      await service.create(userId, createDto, 1);
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError.code).toEqual(ErrorCode.DUPLICATE_ENTRY);
    expect(thrownError.message).toEqual(MSG_ERR_DUPLICATE_ENTRY);
  });

  it('should be success created multipe trackings', async () => {
    const createDto1 = Generator.fakeCreatedTracking();
    const createDto2 = Generator.fakeCreatedTracking();
    createQueryBuilder.execute = jest
      .fn()
      .mockResolvedValueOnce([{ id: createDto1.account_id }, { id: createDto2.account_id }]);
    const { created, errors } = await service.createMultiple([createDto1, createDto2], fakeReq);
    expect(created.length).toEqual(2);
    expect(errors.length).toEqual(0);
    expect(created[0].account_id).toEqual(createDto1.account_id);
    expect(created[0].subject).toEqual(createDto1.subject);
    expect(created[0].replied_time).toEqual(createDto1.replied_time);
    expect(created[0].status).toEqual(createDto1.status);
    expect(created[0].time_send).toEqual(createDto1.time_send);
    expect(created[0].time_tracking).toEqual(createDto1.time_tracking);

    expect(created[1].account_id).toEqual(createDto2.account_id);
    expect(created[1].subject).toEqual(createDto2.subject);
    expect(created[1].replied_time).toEqual(createDto2.replied_time);
    expect(created[1].status).toEqual(createDto2.status);
    expect(created[1].time_send).toEqual(createDto2.time_send);
    expect(created[1].time_tracking).toEqual(createDto2.time_tracking);
  });

  it('should add job after created multipe trackings', async () => {
    const createDto1 = Generator.fakeCreatedTracking();
    const createDto2 = Generator.fakeCreatedTracking();
    thirdPartyAccountRepo.find.mockReturnValue([
      { id: createDto1.account_id },
      { id: createDto2.account_id },
    ]);
    createQueryBuilder.execute = jest
      .fn()
      .mockResolvedValueOnce([{ id: createDto1.account_id }, { id: createDto2.account_id }]);
    await service.createMultiple([createDto1, createDto2], fakeReq);

    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
  });

  it('should return error when create multiple trackings failed', async () => {
    const createDto1 = Generator.fakeCreatedTracking();
    const createDto2 = Generator.fakeCreatedTracking();
    thirdPartyAccountRepo.find.mockReturnValue([
      { id: createDto1.account_id },
      { id: createDto2.account_id },
    ]);
    createQueryBuilder.execute = jest
      .fn()
      .mockResolvedValueOnce([{ id: createDto1.account_id }, { id: createDto2.account_id }]);
    const error = new Error();
    jest.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw error;
    });
    const { errors } = await service.createMultiple([createDto1, createDto2], fakeReq);
    expect(errors.length).toEqual(1);
  });

  it('should not calling add job when create multiple trackings failed', async () => {
    const createDto1 = Generator.fakeCreatedTracking();
    thirdPartyAccountRepo.find.mockReturnValue([{ id: createDto1.account_id }]);
    const error = new Error();
    jest.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw error;
    });
    const { errors } = await service.createMultiple([createDto1], fakeReq);
    expect(errors.length).toEqual(1);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
  });

  it('should be success update tracking', async () => {
    const updateDto = Generator.fakedUpdateEntity();
    repo.update.mockReturnValue({
      data: updateDto,
      affected: 1,
    });
    repo.findOne.mockReturnValue(updateDto);
    const updated = await service.update(userId, updateDto, 0);
    expect(updated.message_id).toEqual(updateDto.message_id);
    expect(updated.object_type).toEqual(updateDto.object_type);
  });

  it('should be success update tracking with correct data', async () => {
    const updateDto = Generator.fakedUpdateEntity();
    delete updateDto.object_uid;
    repo.update.mockReturnValue({
      data: updateDto,
      affected: 1,
    });
    repo.findOne.mockReturnValue(updateDto);
    const updated = await service.update(userId, updateDto, 100);
    expect(updated.message_id).toEqual(updateDto.message_id);
  });

  it('should be throw error when update tracking failed', async () => {
    const updateDto = Generator.fakedUpdateEntity();
    repo.update.mockReturnValue(null);
    repo.findOne.mockReturnValue(updateDto);
    let error;
    try {
      await service.update(userId, updateDto, 0);
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();
  });

  it('should throw logger error when update tracking failed', async () => {
    const error = new Error();
    let thrownError;
    jest.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw error;
    });

    try {
      const updateDto = Generator.fakedUpdateEntity();
      await service.update(userId, updateDto, 0);
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).toBeInstanceOf(ErrorDTO);
  });

  it('should be success updated multiple trackings', async () => {
    const updateDto1 = Generator.fakedUpdateEntity();
    const updateDto2 = Generator.fakedUpdateEntity();
    repo.update
      .mockReturnValueOnce({
        data: updateDto1,
        affected: 1,
      })
      .mockReturnValueOnce({
        data: updateDto2,
        affected: 1,
      });
    createQueryBuilder.execute = jest
      .fn()
      .mockResolvedValueOnce([{ id: updateDto1.account_id }, { id: updateDto2.account_id }]);
    repo.findOne.mockReturnValueOnce(updateDto1).mockReturnValueOnce(updateDto2);
    const { updated, errors } = await service.updateMultiple([updateDto1, updateDto2], fakeReq);
    expect(updated.length).toEqual(2);
    expect(errors.length).toEqual(0);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    expect(updated[0].account_id).toEqual(updateDto1.account_id);
    expect(updated[0].subject).toEqual(updateDto1.subject);
    expect(updated[0].replied_time).toEqual(updateDto1.replied_time);
    expect(updated[0].status).toEqual(updateDto1.status);
    expect(updated[0].time_send).toEqual(updateDto1.time_send);
    expect(updated[0].time_tracking).toEqual(updateDto1.time_tracking);

    expect(updated[1].account_id).toEqual(updateDto2.account_id);
    expect(updated[1].subject).toEqual(updateDto2.subject);
    expect(updated[1].replied_time).toEqual(updateDto2.replied_time);
    expect(updated[1].status).toEqual(updateDto2.status);
    expect(updated[1].time_send).toEqual(updateDto2.time_send);
    expect(updated[1].time_tracking).toEqual(updateDto2.time_tracking);
  });

  it('should return error when update multiple trackings failed', async () => {
    const updateDto1 = Generator.fakedUpdateEntity();
    const updateDto2 = Generator.fakedUpdateEntity();

    createQueryBuilder.execute = jest
      .fn()
      .mockResolvedValueOnce([{ id: updateDto1.account_id }, { id: updateDto2.account_id }]);
    repo.update
      .mockReturnValue('fail');
    const { errors } = await service.updateMultiple([updateDto1, updateDto2], fakeReq);
    expect(errors.length).toEqual(2);
  });

  it('should not calling add job when update multiple trackings failed', async () => {
    const updateDto1 = Generator.fakedUpdateEntity();
    repo.update.mockReturnValueOnce({
      data: updateDto1,
      affected: 1,
    });
    thirdPartyAccountRepo.find.mockReturnValue([{ id: updateDto1.account_id }]);
    const error = new Error('UNKNOWN ERROR');
    jest.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw error;
    });
    const { errors } = await service.updateMultiple([updateDto1], fakeReq);
    expect(errors.length).toEqual(1);
  });

  it('should be success deleted tracking', async () => {
    const createDto = Generator.fakeCreatedTracking();
    const created = await service.create(userId, createDto, 1);
    repo.delete.mockReturnValue({
      data: createDto,
      affected: 1,
    });
    const deleted = await service.remove(userId, created.id, fakeDeletedDate);
    expect(deleted.id).toEqual(created.id);
  });

  it('should throw logger error when delete tracking failed', async () => {
    const error = new Error('UNKNOWN ERROR');
    let thrownError;
    jest.spyOn(repo, 'delete').mockImplementationOnce(() => {
      throw error;
    });

    try {
      const updateDto = Generator.fakedUpdateEntity();
      await service.remove(userId, updateDto.id, fakeDeletedDate);
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).toBeInstanceOf(Error);
  });

  it('should throw logger error when delete tracking failed since entity is not found', async () => {
    let thrownError;
    repo.findOne.mockReturnValue(null);
    try {
      const updateDto = Generator.fakedUpdateEntity();
      await service.remove(userId, updateDto.id, fakeDeletedDate);
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).not.toBeNull();
    expect(thrownError.code).toEqual(ErrorCode.TRACKING_DOES_NOT_EXIST);
    expect(thrownError.message).toEqual(MSG_ERR_NOT_EXIST);
  });

  it('should be success deleted multiple trackings', async () => {
    const createDto1 = Generator.fakeCreatedTracking();
    const created1 = await service.create(userId, createDto1, 1);

    const createDto2 = Generator.fakeCreatedTracking();
    const created2 = await service.create(userId, createDto2, 2);
    repo.delete
      .mockReturnValueOnce({
        data: createDto1,
        affected: 1,
      })
      .mockReturnValueOnce({
        data: createDto2,
        affected: 1,
      });

    const { removed } = await service.removeMultiple([
      { id: created1.id },
      { id: created2.id },
    ], fakeReq);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
    expect(removed[0].id).toEqual(created1.id);
    expect(removed[1].id).toEqual(created2.id);
  });

  it('should be throw error when deleted tracking failed', async () => {
    const createDto = Generator.fakeCreatedTracking();
    const created = await service.create(userId, createDto, 1);
    repo.delete.mockReturnValue(null);
    let error;
    try {
      await service.remove(userId, created.id, fakeDeletedDate);
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();
  });

  it('should return error when delete multiple trackings failed', async () => {
    const updateDto = Generator.fakedUpdateEntity();
    const error = new ErrorDTO({
      attributes: { id: updateDto.id },
      code: ErrorCode.TRACKING_DOES_NOT_EXIST,
      message: MSG_ERR_NOT_EXIST,
    });
    jest.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw error;
    });
    const { errors } = await service.removeMultiple([updateDto], fakeReq);
    expect(errors.length).toEqual(1);
  });

  it('should be throw error when deleted multiple trackings failed', async () => {
    const updateDto = Generator.fakedUpdateEntity();
    let error;
    jest.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw error;
    });
    try {
      await service.removeMultiple([updateDto], fakeReq);
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();
  });

  it('should be throw error when delete tracking failed', async () => {
    const fakeDTO = Generator.fakedUpdateEntity();
    deletedItemService.create.mockReturnValue(null);
    let error;
    try {
      await service.remove(userId, fakeDTO.id, fakeDeletedDate);
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();
  });

  it('should throw logger error when validate account id failed', async () => {
    const error = new Error('UNKNOWN ERROR');
    let thrownError;
    jest.spyOn(thirdPartyAccountRepo, 'find').mockImplementationOnce(() => {
      throw error;
    });
    createQueryBuilder.execute = jest.fn().mockRejectedValueOnce(error);

    try {
      const createDTO = Generator.fakeCreatedTracking();
      await service.validateAccountId(userId, [createDTO]);
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).toEqual(error);
  });

  it('should return false when validate account id failed', async () => {
    jest.spyOn(thirdPartyAccountRepo, 'find').mockReturnValue([]);
    const createDTO = Generator.fakeCreatedTracking();
    const { data, errors } = await service.validateAccountId(userId, [createDTO]);

    expect(data.length).toEqual(0);
    expect(errors.length).toEqual(1);
  });

  afterAll(async () => {
    await app.close();
  });
});
