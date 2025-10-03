import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_ERR_NOT_EXIST, MSG_ORDER_NUMBER_OUT_OF_RANGE, SortObjectResponseMessage } from '../../../common/constants/message.constant';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { Url } from '../../../common/entities/urls.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import { UrlRepository } from '../../../common/repositories/url.repository';
import * as CommonUtil from '../../../common/utils/common';
import { DatabaseUtilitiesService } from '../../../modules/database/database-utilities.service';
import { DeletedItemService } from '../../../modules/deleted-item/deleted-item.service';
import { SORT_OBJECT } from '../../../modules/sort-object/sort-object.constant';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DeleteObjectQueueService } from '../../bullmq-queue/delete-object-queue.service';
import { SortObjectService } from '../../sort-object/sort-object.service';
import { UrlsCreateDto } from '../dtos/urls.create.dto';
import { UrlsUpdateDto } from '../dtos/urls.update.dto';
import { UrlsService } from '../urls.service';
import * as Generator from './faker';

const repositoryMockFactory: () => MockType<UrlRepository> = jest.fn(() => ({
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

const apiLastModifiedServiceMockFactory: (
) => MockType<ApiLastModifiedQueueService> = jest.fn(() => ({
  addJob: jest.fn(entity => entity),
}));
const deleteObjectServiceMockFactory: (
) => MockType<DeleteObjectQueueService> = jest.fn(() => ({
  addJob: jest.fn(entity => entity),
}));

const sortObjectServiceMockFactory: (
) => MockType<SortObjectService> = jest.fn(() => ({
  isResetOrderRunning: jest.fn()
}));

const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({
  create: jest.fn((entity) => entity),
  save: jest.fn((entity) => entity),
}));

describe('UrlsService', () => {
  let app: INestApplication;
  let service: UrlsService;
  let repository: MockType<UrlRepository>;
  let sortObjectService: SortObjectService;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let deletedItemService: DeletedItemService;
  let logger: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlsService,
        DatabaseUtilitiesService,
        DeletedItemService,
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: UrlRepository,
          useFactory: repositoryMockFactory
        },
        {
          provide: SortObjectService,
          useFactory: sortObjectServiceMockFactory,
        },
        LoggerService,
        {
          provide: DeleteObjectQueueService,
          useFactory: deleteObjectServiceMockFactory
        }
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<UrlsService>(UrlsService);
    sortObjectService = module.get(SortObjectService);
    databaseUtilitiesService = module.get(DatabaseUtilitiesService);
    deletedItemService = module.get(DeletedItemService);
    repository = module.get(UrlRepository);
    logger = module.get<LoggerService>(LoggerService);
    logger.logError = jest.fn();
    deletedItemService.createMultiple = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be create new', async () => {
    const url = new Url();
    url.url = "https://www.wsj.com/asia";
    url.title = "The Wall Street Journal";
    const result = await service.save(url, fakeReq);
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      "url": "https://www.wsj.com/asia",
      "title": "The Wall Street Journal",
    });
  });

  it('should be create new batch', async () => {
    const urls = [];
    const url = new UrlsCreateDto();
    url.url = "https://www.wsj.com/asia";
    url.title = "The Wall Street Journal";
    urls.push(url);
    sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
    jest.spyOn(CommonUtil, 'getMinTable').mockResolvedValueOnce(0);
    const result = await service.saveBatch(urls, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be create new batch but having error out of order', async () => {
    const urls = [];
    const url = new UrlsCreateDto();
    url.url = "https://www.wsj.com/asia";
    url.title = "The Wall Street Journal";
    urls.push(url);
    sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
    jest.spyOn(CommonUtil, 'getMinTable').mockResolvedValueOnce(
      SORT_OBJECT.MIN_ORDER_NUMBER - 1);

    let mock: any = new QueryFailedError(ErrorCode.ORDER_NUMBER_OUT_OF_RANGE, [], new Error(ErrorCode.ORDER_NUMBER_OUT_OF_RANGE));
    repository.create = jest.fn().mockRejectedValueOnce(mock);
    const result = await service.saveBatch(urls, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toEqual(MSG_ORDER_NUMBER_OUT_OF_RANGE);
  });

  it('should be create new batch and reset order is in process', async () => {
    const urls = [];
    const url = new UrlsCreateDto();
    url.url = "https://www.wsj.com/asia";
    url.title = "The Wall Street Journal";
    urls.push(url);
    sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(true);
    const result = await service.saveBatch(urls, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.errors.length).toEqual(1);
    expect(result.errors[0].message).toEqual(SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS);
  });

  it('should be update batch', async () => {
    const urls = [];
    const url = new UrlsUpdateDto();
    url.url = "https://www.wsj.com/asia";
    url.title = "The Wall Street Journal";
    url.recent_date = 123456123.123;
    urls.push(url);
    const result = await service.updateBatch(urls, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should getMaxOrder', async () => {
    const userId = 1;
    const result = await service.getMaxOrder(userId);
    expect(result).not.toBeNull();
    expect(result).toEqual(10);
  });

  it('should getById', async () => {
    const userId = 1;
    const result = await service.getById(1, userId);
    expect(result).not.toBeNull();
  });

  it('should getAllFiles', async () => {
    const userId = 1;
    const pageSize = 10;

    const urls = [];
    const url = new UrlsCreateDto();
    url.url = "https://www.wsj.com/asia";
    url.title = "The Wall Street Journal";
    urls.push(url);


    databaseUtilitiesService.getAll = jest.fn().mockResolvedValueOnce(urls);
    deletedItemService.findAll = jest.fn().mockResolvedValue([]);
    const result = await service.getAllFiles({ page_size: pageSize, has_del: 1 }, fakeReq);
    expect(result).not.toBeNull();
    expect(result.data.length).toEqual(1);
    expect(result.data_del.length).toEqual(0);
  });

  it('should be delete url', async () => {
    const urls = [];
    urls.push(Generator.fakeDeleteDTO(1, 1));
    urls.push(Generator.fakeDeleteDTO(2, 2));//getShareColIds
    repository.getShareColIds = jest.fn().mockReturnValueOnce([1]);
    repository.getShareMembersByCollectionId = jest.fn().mockReturnValueOnce([1]);
    service.delete = jest.fn().mockReturnValueOnce(Generator.fakeDeleteDTO(2, 2));
    const result = await service.deleteBatch(urls, [], fakeReq);

    expect(result).not.toBeNull();
    expect(result.results).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
  });

  it('should be delete url 2', async () => {
    const url = new Url();
    const userId = 1;
    const dateItem = 123456123.123;
    repository.delete = jest.fn().mockReturnValueOnce(true);
    deletedItemService.create = jest.fn().mockResolvedValue(true);
    const result = await service.delete(url, userId, dateItem);
    expect(result).not.toBeNull();
  });

  it('should be delete url fail', async () => {
    const url = new Url();
    const userId = 1;
    const dateItem = 123456123.123;
    repository.findOne = jest.fn().mockReturnValueOnce(false);
    const result = await service.delete(url, userId, dateItem);
    expect(result).toEqual(MSG_ERR_NOT_EXIST);
  });

  afterAll(async () => {
    await app.close();
  });
});
