import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getCustomRepositoryToken, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { MSG_ERR_WHEN_CREATE } from '../../../common/constants/message.constant';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { ShareMember } from '../../../common/entities/share-member.entity';
import { Url } from '../../../common/entities/urls.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import { UrlRepository } from '../../../common/repositories/url.repository';
import * as CommonUtil from '../../../common/utils/common';
import { DatabaseUtilitiesService } from '../../../modules/database/database-utilities.service';
import { DeletedItemService } from '../../../modules/deleted-item/deleted-item.service';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DeleteObjectQueueService } from '../../bullmq-queue/delete-object-queue.service';
import { SortObjectService } from '../../sort-object/sort-object.service';
import { UrlMembersService } from '../url-member.service';
import * as Generator from './faker';

const ENTITY_ALIAS = 'url';
const SHARE_MEMBER_ENTITY_ALIAS = 'share_member';

const repositoryMockFactory = jest.fn(() => ({
  select: jest.fn().mockReturnThis(),
  findByObjUid: jest.fn().mockReturnThis(),
  find: jest.fn().mockReturnThis(),
  findAll: jest.fn().mockReturnThis(),
  findOne: jest.fn((id: number) => id),
  save: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  create: jest.fn().mockReturnThis(),
  remove: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockReturnThis(),
  query: jest.fn().mockReturnThis(),
  delete: jest.fn((entity) => {
    return { ...entity, affected: 1 };
  }),
  addJob: jest.fn().mockReturnThis(),
  metadata: {
    name: ENTITY_ALIAS
  }
}));

const repositoryDeletedItemMockFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({
  save: jest.fn().mockReturnThis(),
  find: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  create: jest.fn().mockReturnThis(),
}));


const repositoryShareMemberMockFactory = jest.fn(() => ({
  createQueryBuilder: jest.fn(entity => {
    const res = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(q => {
        return {
          max: 10
        };
      }),
      getRawMany: jest.fn(q => {
        return [{
          max: 10
        }];
      }),
    };
    return res;
  }),

  delete: jest.fn((entity) => {
    return { ...entity, affected: true };
  }),
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  create: jest.fn().mockReturnThis(),
  remove: jest.fn().mockReturnThis(),
  getPermissions: jest.fn(entity => entity),
  metadata: {
    name: SHARE_MEMBER_ENTITY_ALIAS
  }
}));


const apiLastModifiedServiceMockFactory: (
) => MockType<ApiLastModifiedQueueService> = jest.fn(() => ({
  addJob: jest.fn().mockReturnThis(),
}));

const sortObjectServiceMockFactory: (
) => MockType<SortObjectService> = jest.fn(() => ({
  isResetOrderRunning: jest.fn()
}));


describe('UrlMembersService', () => {
  let app: INestApplication;
  let service: UrlMembersService;
  let repository: MockType<Repository<Url>>;
  let shareMemberRepository: MockType<Repository<ShareMember>>;
  let deletedItemRepository: MockType<Repository<DeletedItem>>;
  let sortObjectService: SortObjectService;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let deletedItemService: DeletedItemService;
  let apiLastModifiedQueueService: ApiLastModifiedQueueService;
  let logger: LoggerService;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlMembersService,
        DeletedItemService,
        DatabaseUtilitiesService,
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: UrlRepository,
          useFactory: repositoryMockFactory,
        },
        {
          provide: getRepositoryToken(DeletedItem),
          useFactory: repositoryDeletedItemMockFactory,
        },
        {
          provide: getRepositoryToken(ShareMember),
          useFactory: repositoryShareMemberMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: DeleteObjectQueueService,
          useFactory: repositoryMockFactory
        },
        {
          provide: SortObjectService,
          useFactory: sortObjectServiceMockFactory,
        },
        {
          provide: getCustomRepositoryToken(DatabaseUtilitiesService),
          useFactory: repositoryMockFactory,
        },
        LoggerService,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    service = module.get(UrlMembersService);
    sortObjectService = module.get(SortObjectService);
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    apiLastModifiedQueueService = module.get<ApiLastModifiedQueueService>(ApiLastModifiedQueueService);
    repository = module.get(UrlRepository);
    deletedItemRepository = module.get(getRepositoryToken(DeletedItem));
    shareMemberRepository = module.get(getRepositoryToken(ShareMember));
    databaseUtilitiesService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    logger = module.get<LoggerService>(LoggerService);
    logger.logError = jest.fn();

  });

  it('should be defined', () => {
    expect(sortObjectService).toBeDefined();
    expect(deletedItemRepository).toBeDefined();
    expect(shareMemberRepository).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(apiLastModifiedQueueService).toBeDefined();
    expect(databaseUtilitiesService).toBeDefined();
    expect(logger).toBeDefined();
  });

  it('should be getPermissions', async () => {
    const result = service.getPermissions(1, [1, 2], 1);
    expect(result).not.toBeNull();
  });

  it('should be create new batch', async () => {
    const urls = [];
    const url = Generator.fakeCreatedDTO(2);
    urls.push(url);
    sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
    jest.spyOn(service, 'getPermissions').mockResolvedValueOnce(Generator.fakeCreatedPermissionDTO());
    jest.spyOn(shareMemberRepository, 'find').mockImplementationOnce(() => {
      return Generator.fakeCreatedPermissionDTO();
    });

    jest.spyOn(CommonUtil, 'getMinTable').mockResolvedValueOnce(0);
    const result = await service.saveBatch(urls, [], fakeReq);
    expect(service.getPermissions).toBeCalledTimes(1);
    expect(result.results).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should be create new batch with invalid access', async () => {
    const urls = [];
    const url = Generator.fakeCreatedDTO(1);
    urls.push(url);
    sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
    jest.spyOn(service, 'getPermissions').mockResolvedValueOnce(Generator.fakeCreatedPermissionDTO());

    jest.spyOn(shareMemberRepository, 'find').mockImplementationOnce(() => {
      return Generator.fakeCreatedPermissionDTO();
    });

    jest.spyOn(CommonUtil, 'getMinTable').mockResolvedValueOnce(0);
    const result = await service.saveBatch(urls, [], fakeReq);
    expect(service.getPermissions).toBeCalledTimes(1);
    expect(result.results).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it('should be get url-member without data_del', async () => {
    const urls = [];
    const url = Generator.fakeCreatedDTO(1);
    urls.push(url);
    databaseUtilitiesService.getAllUrlMember = jest.fn().mockReturnValue([
      Generator.fakeDataEntity(),
      Generator.fakeDataEntity(),
      Generator.fakeDataEntity()
    ]);

    const req = {
      page_size: 1100
    };

    const result = await service.getAll(req, fakeReq);
    expect(databaseUtilitiesService.getAllUrlMember).toBeCalledTimes(1);
    expect(result.data).not.toBeNull();
    expect(result.data).toHaveLength(3);
  });

  it('should be get url-member with data_del', async () => {
    const urls = [];
    const url = Generator.fakeCreatedDTO(1);
    urls.push(url);
    databaseUtilitiesService.getAllUrlMember = jest.fn().mockReturnValue([
      Generator.fakeDataEntity(),
      Generator.fakeDataEntity(),
      Generator.fakeDataEntity()
    ]);

    const req = {
      page_size: 1100,
      has_del: 1
    };

    deletedItemService.findAll = jest.fn().mockReturnValue([
      Generator.fakeDataDelEntity()
    ]);

    const result = await service.getAll(req, fakeReq);
    expect(databaseUtilitiesService.getAllUrlMember).toBeCalledTimes(1);
    expect(deletedItemService.findAll).toBeCalledTimes(1);
    expect(result.data).not.toBeNull();
    expect(result.data).toHaveLength(3);
    expect(result.data_del).toHaveLength(1);
  });

  it('should be update url-member', async () => {
    const urls = [];
    urls.push(Generator.fakeUpdateDTO(1, 1));
    urls.push(Generator.fakeUpdateDTO(2, 2));

    const result = await service.update(urls[0], fakeReq.user.id);
    expect(result).not.toBeNull();
  });

  it('should be updateBatch url-member', async () => {
    const urls = [];

    urls.push(Generator.fakeUpdateDTO(1, 1));
    urls.push(Generator.fakeUpdateDTO(2, 2));

    databaseUtilitiesService.getUrlsMemberByCollectionIds = jest.fn().mockReturnValue(Generator.fakePermissionDTO());
    service.update = jest.fn().mockReturnValueOnce(Generator.fakeUpdateDTO(2, 2));

    jest.spyOn(shareMemberRepository, 'find').mockImplementationOnce(() => {
      return Generator.fakeCreatedPermissionDTO();
    });

    const result = await service.updateBatch(urls, [], fakeReq);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(2);
    expect(databaseUtilitiesService.getUrlsMemberByCollectionIds).toBeCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result.results).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
  });

  it('should be updateBatch url-member exception', async () => {
    const urls = [];

    urls.push(Generator.fakeUpdateDTO(1, 1));
    urls.push(Generator.fakeUpdateDTO(2, 2));

    databaseUtilitiesService.getUrlsMemberByCollectionIds = jest.fn().mockReturnValue(Generator.fakePermissionDTO());
    service.update = jest.fn().mockRejectedValue(new Error('Async error'));

    jest.spyOn(shareMemberRepository, 'find').mockImplementationOnce(() => {
      return Generator.fakeCreatedPermissionDTO();
    });

    const result = await service.updateBatch(urls, [], fakeReq);

    expect(result.errors).toHaveLength(2);
  });

  it('should be delete url-member', async () => {
    const urls = [];

    urls.push(Generator.fakeDeleteDTO(1, 1));
    urls.push(Generator.fakeDeleteDTO(2, 2));
    urls.push(Generator.fakeDeleteDTO(3, 3));
    urls.push(Generator.fakeDeleteDTO(4, 4));
    urls.push(Generator.fakeDeleteDTO(5, 5));
    urls.push(Generator.fakeDeleteDTO(6, 6));

    databaseUtilitiesService.getUrlsMemberByCollectionIds =
      jest.fn().mockReturnValue([
        { ...urls[0] },
        { ...urls[1], shared_status: 1 },
        { ...urls[2], shared_status: 1, access: 1 },
        { ...urls[3], shared_status: 1, access: 2, user_id: 1 },
      ]);
    service.getShareMembersByCollectionId = jest.fn().mockReturnValueOnce([1]);
    const result = await service.deleteBatch(urls, [], fakeReq);

    expect(result).not.toBeNull();
    expect(databaseUtilitiesService.getUrlsMemberByCollectionIds).toBeCalledTimes(1);
    expect(result.results).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).toHaveLength(1);
    expect(result.errors).toHaveLength(5);
  });

  it('should be delete url-member error', async () => {
    const urls = [];

    urls.push(Generator.fakeDeleteDTO(1, 1));

    databaseUtilitiesService.getUrlsMemberByCollectionIds =
      jest.fn().mockReturnValue([
        { ...urls[0], shared_status: 1, access: 2, user_id: 1 },
      ]);
    service.delete = jest.fn().mockResolvedValue({});
    const result = await service.deleteBatch(urls, [], fakeReq);

    expect(result).not.toBeNull();
    expect(result.errors).toHaveLength(1);
  });

  it('should be delete url-member execption', async () => {
    const urls = [];

    urls.push(Generator.fakeDeleteDTO(1, 1));

    databaseUtilitiesService.getUrlsMemberByCollectionIds =
      jest.fn().mockReturnValue([
        { ...urls[0], shared_status: 1, access: 2, user_id: 1 },
      ]);
    service.delete = jest.fn().mockRejectedValue(new Error('Async error'));
    const result = await service.deleteBatch(urls, [], fakeReq);

    expect(result).not.toBeNull();
    expect(result.errors).toHaveLength(1);
  });

  it('should be return share_member_collections', async () => {
    const userId = 1;
    const colIds = [1, 2];
    const sharedStatus = 1;

    jest.spyOn(service, 'getPermissions').mockResolvedValueOnce(Generator.fakeCreatedPermissionDTO());
    const permisstions = await service.getPermissions(userId, colIds, sharedStatus);

    expect(service.getPermissions).toBeCalledTimes(1);
    expect(permisstions).not.toBeNull();
    expect(permisstions).toHaveLength(2);
  });

  it('should be return empty array for function checkPermission', async () => {
    const result = await service.checkPermission([], [], []);
    expect(result.length).toEqual(0);
  });

  it('should be check function checkPermission with access = 2', async () => {
    const urls = Generator.fakeCreatedPermissionDTO();
    urls.push({
      user_id: 1,
      member_user_id: 1,
      account_id: 1,
      collection_id: 3,
      access: 1,
      shared_status: 2,
      owner_email: 'test@flomail.com'
    });
    const url2s = Generator.fakeCreatedPermissionDTO2();
    const result = await service.checkPermission(url2s, urls, []);
    expect(result.length).toEqual(1);
  });

  it('should be return share-member for function getShareMembersByCollectionId', async () => {
    const colId = 1;
    shareMemberRepository.find = jest.fn().mockReturnValueOnce([{ member_user_id: 1, collection_id: colId }]);
    const result = await service.getShareMembersByCollectionId(colId);
    expect(result.length).toEqual(1);
  });

  it('should be return empty array for function getShareMembersByCollectionId', async () => {
    const colId = 1;
    shareMemberRepository.find = jest.fn().mockReturnValueOnce(new Array());
    const result = await service.getShareMembersByCollectionId(colId);
    expect(result.length).toEqual(0);
  });

  it('should be return empty array for function getShareMembersByCollectionIds', async () => {
    const colIds = [1, 2];
    shareMemberRepository.find = jest.fn().mockReturnValueOnce(new Array());
    const result = await service.getShareMembersByCollectionIds(colIds);
    expect(result.length).toEqual(0);
  });


  it('should be return 1 object for function CheckLinkedUrlsMemberPermission', async () => {
    const linkedUrlMembers = Generator.fakeCreatedPermissionDTO3();
    const urls = Generator.fakeCreatedPermissionDTO4();
    const result = await service.CheckLinkedUrlsMemberPermission(linkedUrlMembers, urls, []);
    expect(result.length).toEqual(1);
  });


  it('should saveBatch and throw error', async () => {
    const urls = [];
    const url = Generator.fakeCreatedDTO(2);
    urls.push(url);

    sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
    jest.spyOn(service, 'getPermissions').mockResolvedValueOnce(Generator.fakeCreatedPermissionDTO());
    jest.spyOn(shareMemberRepository, 'find').mockImplementationOnce(() => {
      return Generator.fakeCreatedPermissionDTO();
    });

    jest.spyOn(CommonUtil, 'getMinTable').mockResolvedValueOnce(0);
    repository.save = jest.fn().mockRejectedValueOnce(new Error(MSG_ERR_WHEN_CREATE));

    const result = await service.saveBatch(urls, [], fakeReq);
    expect(result.errors.length).toEqual(1);
  });

  it('should saveBatch and throw error MIN_ORDER_NUMBER', async () => {
    // const urls = [];
    // const url = Generator.fakeCreatedDTO(2);
    // urls.push(url);

    // sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
    // jest.spyOn(service, 'getPermissions').mockResolvedValueOnce(Generator.fakeCreatedPermissionDTO());
    // jest.spyOn(shareMemberRepository, 'find').mockImplementationOnce(() => {
    //   return Generator.fakeCreatedPermissionDTO();
    // });

    // jest.spyOn(CommonUtil, 'getMinTable').mockResolvedValueOnce(-9999999);

    // const result = await service.saveBatch(urls, [], fakeReq);
    // expect(result.errors.length).toEqual(1);
  });

  afterAll(async () => {
    await app.close();
  });
});