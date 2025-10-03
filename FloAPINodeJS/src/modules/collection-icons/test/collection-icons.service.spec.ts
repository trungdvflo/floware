import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { BaseGetDTO } from '../../../common/dtos/base-get.dto';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { CollectionIconsRepository } from '../../../common/repositories/collection-icons.repository';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { CollectionIconsService } from '../collection-icons.service';
import { fakeIcons } from './fakeData';

// import { fakeSubPurchaseDetail } from './faker';


const iconsReposMockFactory: () => MockType<CollectionIconsRepository> = jest.fn(() => ({
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
}));

describe('CollectionIconsService', () => {
  let app: INestApplication;
  let service: CollectionIconsService;
  let iconsRepo: MockType<CollectionIconsRepository>;
  let deletedItemService: DeletedItemService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionIconsService,
        DeletedItemService,
        DatabaseUtilitiesService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory
        },
        {
          provide: CollectionIconsRepository,
          useFactory: iconsReposMockFactory
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory
        }
      ],
    }).compile();


    app = module.createNestApplication();
    await app.init();
    deletedItemService = module.get<any>(DeletedItemService);
    service = module.get<CollectionIconsService>(CollectionIconsService);
    iconsRepo = module.get(CollectionIconsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(iconsRepo).toBeDefined();
  });

  describe('Get icons', () => {
    it('should be return error', async () => {
      try {
        const req = {
          page_size: 10,
          has_del: 1,
          modified_gte: 1247872251.212,
          modified_lt: 1247872251.212,
          ids: []
        } as BaseGetDTO;
        iconsRepo.getLastModifyDate = jest.fn().mockReturnValue(168223232.323);
        iconsRepo.getAllIcons = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.getAllIcons(req, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be get icons', async () => {
      const req = {
        page_size: 10,
        has_del: 1,
        modified_gte: 1247872251.212,
        modified_lt: 1247872251.212,
        ids: []
      } as BaseGetDTO;
      iconsRepo.getLastModifyDate = jest.fn().mockReturnValue(168223232.323);
      iconsRepo.getAllIcons = jest.fn().mockReturnValue(fakeIcons);
      const result = await service.getAllIcons(req, fakeReq);
      expect(result.data[0]).toEqual(fakeIcons[0]);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
