import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { OBJ_TYPE } from '../../../common/constants/common';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_TERMINATE_ACC_NOT_EXIST } from '../../../common/constants/message.constant';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { RecentObject } from '../../../common/entities/recent-object.entity';
import { ThirdPartyAccount } from '../../../common/entities/third-party-account.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import { RecentObjectRepository } from '../../../common/repositories/recent-object.repository';
import { ApiLastModifiedQueueService } from '../../../modules/bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { GetRecentObjectDto } from '../dto/get-recent-object.dto';
import { RecentObjectService } from '../recent-object.service';
import * as faker from './faker';

const repositoryMockFactory: () => MockType<RecentObjectRepository> = jest.fn(() => ({
  get: jest.fn(entity => entity),
  batchUpsert: jest.fn(entity => entity),
  find: jest.fn(entity => entity)
}));

const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({}));

const apiLastModifiedServiceMockFactory: (
) => MockType<ApiLastModifiedQueueService> = jest.fn(() => ({
  addJob: jest.fn(entity => entity)
}));

describe('RecentObjectService', () => {
  let app: INestApplication;

  let repository: MockType<RecentObjectRepository>;
  let tpaRepository: MockType<Repository<ThirdPartyAccount>>;
  let loggerService: LoggerService;
  let service: RecentObjectService;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let deletedItemService: DeletedItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecentObjectService,
        DatabaseUtilitiesService,
        DeletedItemService,
        LoggerService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(RecentObjectRepository),
          useFactory: repositoryMockFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: DatabaseUtilitiesService,
          useValue: {
            getAll: jest.fn((e) => e),
          },
        },
        {
          provide: getRepositoryToken(ThirdPartyAccount),
          useFactory: repositoryMockFactory
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory
        }
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();

    repository = module.get(getRepositoryToken(RecentObjectRepository));
    tpaRepository = module.get(getRepositoryToken(ThirdPartyAccount));
    service = module.get(RecentObjectService);
    deletedItemService = module.get(DeletedItemService);
    databaseUtilitiesService = module.get(DatabaseUtilitiesService);
    loggerService = module.get<LoggerService>(LoggerService);
    loggerService.logError = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return recent objects list without option params', async () => {
    databaseUtilitiesService.getAll = jest.fn().mockResolvedValueOnce(faker.recentObjectsListData);
    const result: any = await service.findAll({ page_size: 50 } as GetRecentObjectDto, 0);
    expect(result).not.toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).not.toBeNull();
    expect(result.data[0].object_uid).not.toBeNull();
    expect(result.data[0].account_id).not.toBeNull();
    expect(result.data[0].object_type).toEqual(OBJ_TYPE.VCARD);
  });

  it('should return recent objects list with option params', async () => {
    const data = faker.recentObjectsListData;
    databaseUtilitiesService.getAll = jest.fn().mockResolvedValueOnce(data);


    const result: any = await service.findAll({ page_size: 50, min_id: 1 } as GetRecentObjectDto, 0);
    expect(result.data).toEqual(data);
    expect(result.data[0].object_type).toEqual(OBJ_TYPE.VCARD);
  });

  it('should return empty list', async () => {
    tpaRepository.find.mockReturnValue([{ id: 1 }]);
    databaseUtilitiesService.getAll = jest.fn().mockResolvedValueOnce([]);

    const result = await service.findAll({ page_size: 50, ids: [123131313] } as GetRecentObjectDto, 0);
    expect(result.data).toEqual([]);
  });

  it('should delete recent obj ', async () => {
    const data = [{ "id": 1 }, { "id": 2 }, { "id": 3 }, { "id": 4 }];
    repository.findOne = jest.fn().mockReturnValueOnce(null)
      .mockReturnValueOnce({ id: 2 }).
      mockReturnValueOnce(true).mockRejectedValueOnce({ message: 'fail' });
    deletedItemService.create = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
    repository.delete = jest.fn().mockReturnValueOnce(true);
    const result = await service.deleteRecentObjs(data, fakeReq);
    expect(repository.findOne).toBeCalledTimes(4);
    expect(deletedItemService.create).toBeCalledTimes(2);
    expect(result.itemFail.length).toEqual(3);
    expect(result.itemPass.length).toEqual(1);
    expect(result.itemPass[0].id).toEqual(2);
  });

  it('should return error with invalid account id', async () => {
    tpaRepository.find.mockReturnValue([{ id: 1 }]);

    const result = await service.create(faker.recentObjectsListData as RecentObject[], fakeReq);
    expect(result.errors).not.toBeNull();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toEqual(ErrorCode.INVALID_DATA);
    expect(result.errors[0].message).toEqual(MSG_TERMINATE_ACC_NOT_EXIST);
  });

  it('should create new recent object', async () => {
    tpaRepository.find.mockReturnValue([{ id: 1 }]);
    const fakedData = faker.createdRecentObjectListInput;
    const createdData = faker.getCreatedRecentObjectList(fakedData);
    repository.batchUpsert.mockReturnValue(createdData);

    const result = await service.create(fakedData as RecentObject[], fakeReq);
    expect(result.data).not.toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data).toEqual(createdData);
  });

  it('should update recent object exists', async () => {
    tpaRepository.find = jest.fn().mockResolvedValueOnce([{ id: 1 }]);
    const createdData = faker.getCreatedRecentObjectList(faker.createdRecentObjectListInput);
    repository.batchUpsert.mockReturnValue(createdData);

    const result = await service.create(createdData as RecentObject[], fakeReq);
    expect(result.data).not.toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data).toEqual(createdData);
  });

  afterAll(async () => {
    await app.close();
  });
});
