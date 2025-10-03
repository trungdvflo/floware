import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { QueryFailedError, Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { SHARE_STATUS } from '../../../common/constants';
import { ErrorCode } from '../../../common/constants/error-code';
import {
  MSG_COLECTION_ID_INVALID, MSG_ERR_DUPLICATE_ENTRY, MSG_ERR_EXISTED,
  MSG_ERR_LINK, MSG_ERR_NOT_EXIST, MSG_NOT_FOUND_MEMBER
} from '../../../common/constants/message.constant';
import { DeletedItem, ShareMember, Users } from '../../../common/entities';
import { IUser } from '../../../common/interfaces';
import { KanbanRepository, ShareMemberRepository } from '../../../common/repositories';
import { buildFailItemResponse } from '../../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { CollectionQueueService } from '../../bullmq-queue/collection-queue.service';
import { CollectionService } from '../../collection/collection.service';
import { CollectionInstanceMemberService } from '../../collection_instance_member/collection-instance-member.service';
import { ChimeChatService } from '../../communication/services';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { KanbanService } from '../../kanban/kanban.service';
import { ShareMemberService } from '../share-member.service';
import * as FakeData from './fakeData';
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

const spyHttpClientChime = {
  axiosRef: {
    post: jest.fn().mockReturnValue({
      data: { data: [] }
    })
  }
};
const spyHttpClient: SpyObject = TestUtilsService.createSpyObj(['delete', 'put'], ['toPromise']);

const repoMockFactory = jest.fn(() => ({
  save: jest.fn((entity) => {
    entity.id = 1;
    return entity;
  }),
  createQueryBuilder: jest.fn(e => e),
  delete: jest.fn((entity) => {
    return { ...entity, affected: true };
  }),
  find: jest.fn((entity) => entity),
  findOne: jest.fn((entity) => entity),
  create: jest.fn((entity) => entity),
  remove: jest.fn((entity) => entity),
  update: jest.fn((entity) => entity),
  getOneByCollection: jest.fn((entity) => entity),
  getShareMembers: jest.fn((entity) => entity),
  getShareMembersWithCollectionInfo: jest.fn((entity) => entity),
  getShareMembersForTrashByObjectId: jest.fn((entity) => entity),
  getShareMembersForTrash: jest.fn((entity) => entity),
  getCurrentTime: jest.fn((entity) => entity),
  getOneMemberByMemberId: jest.fn((entity) => entity),
  manager: {
    query: jest.fn((entity) => entity),
  },
  metadata: {
    ownColumns: [
      {
        databaseName: 'id'
      },
      {
        databaseName: 'user_id'
      },
      {
        databaseName: 'collection_id'
      },
      {
        databaseName: 'calendar_uri'
      },
      {
        databaseName: 'access'
      },
      {
        databaseName: 'shared_status'
      },
      {
        databaseName: 'shared_email'
      },
      {
        databaseName: 'member_user_id'
      },
      {
        databaseName: 'contact_uid'
      },
      {
        databaseName: 'contact_href'
      },
      {
        databaseName: 'account_id'
      },
      {
        databaseName: 'created_date'
      },
      {
        databaseName: 'updated_date'
      },
      {
        provide: HttpService,
        useValue: spyHttpClient
      },
    ]
  }
}));
const kanbanRepositoryMockFactory: () => MockType<KanbanRepository> = jest.fn(() => ({
  generateSystemKanban: jest.fn((e) => e),
}));

const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({}));
const repoMockUserFactory: () => MockType<Repository<Users>> = jest.fn(() => ({
  delete: jest.fn((entity) => {
    return { ...entity, affected: true };
  })
}));
const apiLastModifiedServiceMockFactory: () =>
  MockType<ApiLastModifiedQueueService> = jest.fn(() => ({}));

describe('ShareMemberService', () => {
  let createQueryBuilder: any;
  let app: INestApplication;
  let shareMemberService: ShareMemberService;
  let repo: MockType<ShareMemberRepository>;
  let deletedItemService: DeletedItemService;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let collectionService: CollectionService;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;
  let collectionInstanceMemberService: MockType<CollectionInstanceMemberService>;
  let httpClient: HttpService;
  let eventEmitter: EventEmitter2;
  let kanbanRepo: KanbanRepository;

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
        ShareMemberService,
        DeletedItemService,
        DatabaseUtilitiesService,
        ChimeChatService,
        {
          provide: HttpService,
          useValue: spyHttpClientChime
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(ShareMemberRepository),
          useFactory: repoMockFactory,
        },
        {
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory,
        },
        {
          provide: getRepositoryToken(Users),
          useFactory: repoMockUserFactory,
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory,
          useValue: {
            addJob: jest.fn((e) => e),
          },
        },
        {
          // how you provide the injection token in a test instance
          provide: CollectionService,
          useValue: {
            findByIds: jest.fn((e) => e),
            findByMemberIds: jest.fn((e) => e),
            findOneWithCondition: jest.fn((e) => e),
          },
        },
        {
          provide: CollectionInstanceMemberService,
          useValue: {
            deleteByColIdsAndUserId: jest.fn((e) => e),
          },
        },
        {
          provide: KanbanService,
          useValue: {
            deleteByColIdsAndUserId: jest.fn((e) => e),
          },
        },
        {
          provide: CollectionQueueService,
          useValue: {
            createSystemKanbanOfCollection: jest.fn((e) => e),
          },
        },
        {
          provide: HttpService,
          useValue: spyHttpClient
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn((e) => e),
          },
        },
        {
          provide: KanbanRepository,
          useValue: kanbanRepositoryMockFactory
        }
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    shareMemberService = module.get<ShareMemberService>(ShareMemberService);
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    databaseUtilitiesService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    repo = module.get(ShareMemberRepository);
    collectionService = module.get<CollectionService>(CollectionService);
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    httpClient = module.get<HttpService>(HttpService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    kanbanRepo = module.get<KanbanRepository>(KanbanRepository);

    createQueryBuilder = {
      createQueryBuilder: jest.fn(() => createQueryBuilder),
      select: jest.fn(() => createQueryBuilder),
      addSelect: jest.fn(() => createQueryBuilder),
      leftJoin: jest.fn(() => createQueryBuilder),
      innerJoin: jest.fn(() => createQueryBuilder),
      where: jest.fn(() => createQueryBuilder),
      andWhere: jest.fn(() => createQueryBuilder),
      execute: jest.fn(() => createQueryBuilder),
      limit: jest.fn(() => createQueryBuilder),
      distinct: jest.fn(() => createQueryBuilder),
      getMany: jest.fn(() => createQueryBuilder),
      getRawMany: jest.fn(entity => entity),
    };
    repo.createQueryBuilder = jest.fn(() => createQueryBuilder);
  });

  it('should be call getShareMembers', async () => {
    const resData = await shareMemberService.getShareMembers(1, 1, [SHARE_STATUS.LEAVED]);
    expect(resData).not.toBeNull()
  });

  it('should be getShareMembersWithCollectionInfo', async () => {
    const resData = await shareMemberService
      .getShareMembersWithCollectionInfo(user.userId, [1, 2]);

    expect(resData).not.toBeNull()
  });

  it('should be getShareMembersForTrash', async () => {
    const resData = await shareMemberService.getShareMembersForTrash(user.userId, ["1", "2"], ["1", "2"]);
    expect(resData).not.toBeNull()
    const resData2 = await shareMemberService.getShareMembersForTrash(user.userId, ["1", "2"], ["1", "2"]);
    expect(resData2).not.toBeNull()
    const resData3 = await shareMemberService.getShareMembersForTrash(user.userId, [], ["1", "2"]);
    expect(resData3).not.toBeNull()
  });

  it('should be defined', () => {
    expect(shareMemberService).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(databaseUtilitiesService).toBeDefined();
    expect(collectionService).toBeDefined();
    expect(apiLastModifiedQueueService).toBeDefined();
  });

  it('filterDuplicateItem should be return data error', async () => {
    const dto_1 = FakeData.fakeCreatedDTO();
    const resData = shareMemberService.filterDuplicateItem([dto_1, dto_1]);
    expect(resData.dataFilter[0]).toEqual(dto_1);
    expect(resData.dataError[0]).toEqual(dto_1);
  });

  it('filterDuplicateItem should be return data without duplicate', async () => {
    const dto_1 = FakeData.fakeCreatedDTO();
    const dto_2 = FakeData.fakeCreatedDTO();
    const resData = shareMemberService.filterDuplicateItem([dto_1, dto_2]);
    expect(resData.dataFilter).toEqual([dto_1, dto_2]);
    expect(resData.dataError).toHaveLength(0);
  });

  it('should be call function getShareMembers with conditon', async () => {
    const entity1 = FakeData.fakeEntity();
    const fakeData = {
      id: entity1.id,
      collection_id: entity1.collection_id,
      calendar_uri: entity1.calendar_uri,
      access: entity1.access,
      shared_status: entity1.shared_status,
    }
    repo.getShareMembers = jest.fn().mockReturnValue(fakeData);
    const resData = await shareMemberService.getShareMembers(entity1.id, entity1.member_user_id);
    expect(resData).toEqual(fakeData)
  });

  it('should be call function updateMemberObject with conditon', async () => {
    const item_1 = FakeData.fakeCreatedDTO();
    const entity1 = FakeData.fakeEntity();
    const fakeData = {
      id: entity1.id,
      collection_id: entity1.collection_id,
      calendar_uri: entity1.calendar_uri,
      access: entity1.access,
      shared_status: entity1.shared_status,
    }
    const options = {
      collection_id: item_1.collection_id,
      member_user_id: entity1.member_user_id,
      id: entity1.id
    }
    const queryBuilder = {
      shared_status: SHARE_STATUS.LEAVED
    }

    repo.update = jest.fn().mockReturnValue(fakeData);

    const resData = await shareMemberService.updateMemberObject(options, queryBuilder);
    expect(resData).toEqual(fakeData)
  });

  describe('get share members', () => {
    it('should get member list return empty array', async () => {
      const req = {
        page_size: 1100
      };
      databaseUtilitiesService.getAllMember = jest.fn().mockReturnValue([]);
      const result = await shareMemberService.getAllFiles(req, fakeReq);
      expect(databaseUtilitiesService.getAllMember).toBeCalledTimes(1);
      expect(result.data).not.toBeNull();
      expect(result.data).toHaveLength(0);
    });

    it('should get member list', async () => {
      const entity1 = FakeData.fakeEntity();
      const entity2 = FakeData.fakeEntity();
      const req = {
        page_size: 50,
        has_del: 1,
        shared_status: -1
      };
      databaseUtilitiesService.getAllMember = jest.fn().mockResolvedValue([entity1, entity2]);
      deletedItemService.findAll = jest.fn().mockReturnValue([]);

      const result = await shareMemberService.getAllFiles(req, fakeReq);
      expect(databaseUtilitiesService.getAllMember).toHaveBeenCalledWith({
        userId: user.userId,
        filter: req,
        repository: repo
      });
      expect(databaseUtilitiesService.getAllMember).toBeCalledTimes(1);
      expect(result).toMatchObject({
        data: [entity1, entity2],
        data_del: []
      });
      expect(result.data).toHaveLength(2);
      expect(result.data[0].collection_id).toEqual(entity1.collection_id);
      expect(result.data[0].calendar_uri).toEqual(entity1.calendar_uri);
      expect(result.data[0].access).toEqual(entity1.access);
      expect(result.data[0].shared_status).toEqual(entity1.shared_status);
      expect(result.data[0].member_user_id).toEqual(entity1.member_user_id);
      expect(result.data[0].contact_uid).toEqual(entity1.contact_uid);
      expect(result.data[0].contact_href).toEqual(entity1.contact_href);
    });

    it('should get member list with collection_id', async () => {
      const entity1 = FakeData.fakeEntity();
      const entity2 = FakeData.fakeEntity();
      const req = {
        page_size: 50,
        collection_id: entity1.collection_id
      };
      databaseUtilitiesService.getAllMember = jest.fn().mockResolvedValue([entity1, entity2]);
      deletedItemService.findAll = jest.fn().mockReturnValue([]);

      const result = await shareMemberService.getAllFiles(req, fakeReq);

      expect(databaseUtilitiesService.getAllMember).toBeCalledTimes(1);
      expect(result.data[0]).toEqual(entity1);
      expect(result.data[0].collection_id).toEqual(entity1.collection_id);
      expect(result.data[0].calendar_uri).toEqual(entity1.calendar_uri);
      expect(result.data[0].access).toEqual(entity1.access);
      expect(result.data[0].shared_status).toEqual(entity1.shared_status);
      expect(result.data[0].member_user_id).toEqual(entity1.member_user_id);
      expect(result.data[0].contact_uid).toEqual(entity1.contact_uid);
      expect(result.data[0].contact_href).toEqual(entity1.contact_href);
    });
  });

  describe('get data share by member', () => {
    const entity1 = FakeData.fakeEntityByMember();
    const entity2 = FakeData.fakeEntityByMember();
    it('should return error', async () => {
      const req = {
        page_size: 1100
      };
      const errNotFound = buildFailItemResponse(ErrorCode.MEMBER_NOT_FOUND,
        MSG_ERR_NOT_EXIST);

      repo.find = jest.fn().mockReturnValue([]);
      const result = await shareMemberService.getAllByMember(req, user.userId);
      expect(result.data).not.toBeNull();
    });

    it('should return data', async () => {
      const req = {
        page_size: 50,
        has_del: 1
      };
      repo.find = jest.fn().mockReturnValue([entity1.collection_id, entity2.collection_id]);
      databaseUtilitiesService.syncDataByMember = jest.fn().mockResolvedValue([entity1, entity2]);
      deletedItemService.findAll = jest.fn().mockReturnValue([]);

      const result = await shareMemberService.getAllByMember(req, user.userId);

      expect(databaseUtilitiesService.syncDataByMember).toBeCalledTimes(1);

      expect(result).toMatchObject({
        data: [entity1, entity2],
        data_del: []
      });
      expect(result.data).toHaveLength(2);
      expect(result.data[0].collection_id).toEqual(entity1.collection_id);
      expect(result.data[0]['access']).toEqual(entity1.access);
      expect(result.data[0]['shared_status']).toEqual(entity1.shared_status);
    });
  });

  describe('Created share members', () => {
    const item_1 = FakeData.fakeCreatedDTO();
    const item_2 = FakeData.fakeCreatedDTO();
    const dataDto = [item_1, item_2];
    const entity1 = FakeData.fakeEntity();
    const entity2 = FakeData.fakeEntity();

    it('should be show duplicate entry', async () => {
      const dto_1 = FakeData.fakeCreatedDTO();
      const resData = await shareMemberService.createMember([dto_1, dto_1], fakeReq);
      expect(resData.itemFail[0].code).toEqual(ErrorCode.DUPLICATE_ENTRY);
      expect(resData.itemFail[0].message).toEqual(MSG_ERR_DUPLICATE_ENTRY);
    });

    it('should be success created share members', async () => {
      jest.spyOn(databaseUtilitiesService, 'findOneByEmail').mockResolvedValue({ id: entity1.member_user_id });
      collectionService.findOneWithCondition = jest.fn().mockReturnValue({ id: entity1.collection_id, type: 3 });

      repo.create = jest.fn().mockResolvedValueOnce(plainToClass(ShareMember, {
        user_id: user.userId,
        member_user_id: entity1.member_user_id,
        account_id: item_1.account_id,
        shared_status: 0, // always is 0 when create
        ...item_1,
        created_date: entity1.createDate,
        updated_date: entity1.createDate
      })).mockResolvedValueOnce(plainToClass(ShareMember, {
        user_id: user.userId,
        member_user_id: entity2.member_user_id,
        account_id: item_2.account_id,
        shared_status: 0, // always is 0 when create
        ...item_2,
        created_date: entity2.createDate,
        updated_date: entity2.createDate
      }));
      repo.save = jest.fn().mockResolvedValueOnce(plainToClass(ShareMember, {
        user_id: user.userId,
        ...entity1
      })).mockResolvedValueOnce(plainToClass(ShareMember, {
        user_id: user.userId,
        ...entity2
      }));
      repo.find = jest.fn().mockResolvedValueOnce([{
        member_user_id: 1
      }]);

      const result = await shareMemberService.createMember(dataDto, fakeReq);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(3);
      expect(result.itemPass).toHaveLength(2);
      expect(result.itemPass[0]).toEqual(entity1);
      expect(result.itemPass[1]).toEqual(entity2);
    });

    it('should be show duplicate item if collecion_id and share_email same', async () => {
      jest.spyOn(databaseUtilitiesService, 'findOneByEmail').mockResolvedValue({ id: entity1.member_user_id });
      collectionService.findOneWithCondition = jest.fn().mockReturnValue({ id: entity1.collection_id, type: 3 });
      repo.findOne = jest.fn().mockReturnValueOnce({ shared_status: 0 })
        .mockReturnValueOnce({ shared_status: 0 });

      const result = await shareMemberService.createMember(dataDto, fakeReq);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_EXISTED);
      expect(result.itemFail[1].message).toEqual(MSG_ERR_EXISTED);
    });

    it('should be update share_status is 0 if collecion_id or share_email same and share_status larger than 2', async () => {
      entity1.shared_status = 3;
      entity2.shared_status = 4;

      jest.spyOn(databaseUtilitiesService, 'findOneByEmail').mockResolvedValue({ id: entity1.member_user_id });
      collectionService.findOneWithCondition = jest.fn().mockReturnValue({ id: entity1.collection_id, type: 3 });
      repo.findOne = jest.fn().mockReturnValueOnce(entity1)
        .mockReturnValueOnce(entity2);
      repo.find = jest.fn().mockResolvedValueOnce([{
        member_user_id: 1
      }]);
      const result = await shareMemberService.createMember(dataDto, fakeReq);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(3);
      expect(result.itemPass[0].shared_status).toEqual(0);
      expect(result.itemPass[1].shared_status).toEqual(0);
    });

    it('should return item fail with share user not existed', async () => {
      jest.spyOn(databaseUtilitiesService, 'findOneByEmail').mockResolvedValue(undefined);
      collectionService.findOneWithCondition = jest.fn().mockReturnValue({ id: entity1.collection_id, type: 3 });

      const result = await shareMemberService.createMember(dataDto, fakeReq);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
      expect(result.itemPass).toHaveLength(0);
      expect(result.itemFail[0].message).toEqual(MSG_NOT_FOUND_MEMBER);
      expect(result.itemFail[1].message).toEqual(MSG_NOT_FOUND_MEMBER);
    });

    it('should return item fail with collection_id not existed', async () => {
      jest.spyOn(databaseUtilitiesService, 'findOneByEmail').mockResolvedValue({ id: 31136 });
      collectionService.findOneWithCondition = jest.fn().mockReturnValue(undefined);

      const result = await shareMemberService.createMember(dataDto, fakeReq);
      expect(result.itemPass).toHaveLength(0);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_LINK.COLLECTION_NOT_EXIST);
      expect(result.itemFail[1].message).toEqual(MSG_ERR_LINK.COLLECTION_NOT_EXIST);
    });

    it('should return item fail with collection_id existed but type collection != 3', async () => {
      jest.spyOn(databaseUtilitiesService, 'findOneByEmail').mockResolvedValue({ id: 31136 });
      collectionService.findOneWithCondition = jest.fn().mockReturnValue({ id: entity1.collection_id, type: 1 });

      const result = await shareMemberService.createMember(dataDto, fakeReq);
      expect(result.itemPass).toHaveLength(0);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
      expect(result.itemFail[0].message).toEqual(MSG_COLECTION_ID_INVALID);
      expect(result.itemFail[1].message).toEqual(MSG_COLECTION_ID_INVALID);
    });
  });

  describe('Update share members', () => {
    const item_1 = FakeData.fakeUpdatedDTO();
    const item_2 = FakeData.fakeUpdatedDTO();

    const entity1 = FakeData.fakeEntity();
    const entity2 = FakeData.fakeEntity();
    const dataDto = [item_1, item_2];
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };

    it('should be success update share members', async () => {
      entity1.access = item_1.access;
      entity1.shared_status = item_1.shared_status;
      entity2.access = item_2.access;
      entity2.shared_status = item_2.shared_status;
      entity1.id = item_1.id;
      entity2.id = item_2.id;

      repo.getOneByCollection = jest.fn().mockReturnValueOnce(entity1)
        .mockReturnValueOnce(entity2);
      repo.find = jest.fn().mockResolvedValue([{
        memberId: 1, updateTime: 123
      }]);

      const result = await shareMemberService.updateMember(dataDto, fakeReq);
      expect(result.itemPass).toHaveLength(2);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(4);
      expect(result.itemPass[0].access).toEqual(entity1.access);
      expect(result.itemPass[0].shared_status).toEqual(entity1.shared_status);
      expect(result.itemPass[1].access).toEqual(entity1.access);
      expect(result.itemPass[1].shared_status).toEqual(entity1.shared_status);
    });


    it('should be success update share members 2', async () => {
      item_1.shared_status = 3;
      item_2.shared_status = 4;
      entity1.access = item_1.access;
      entity2.access = item_2.access;
      entity1.id = item_1.id;
      entity2.id = item_2.id;

      repo.getOneByCollection = jest.fn().mockReturnValueOnce(entity1)
        .mockReturnValueOnce(entity2);
      repo.find = jest.fn().mockResolvedValue([{
        memberId: 1, updateTime: 123
      }]);
      collectionService.findOneWithCondition = jest.fn().mockReturnValue({ id: entity1.collection_id });

      const result = await shareMemberService.updateMember(dataDto, fakeReq);

      expect(result.itemPass).toHaveLength(2);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(4);
      expect(result.itemPass[0].access).toEqual(entity1.access);
      expect(result.itemPass[0].shared_status).toEqual(item_1.shared_status);
      expect(result.itemPass[1].access).toEqual(entity1.access);
      expect(result.itemPass[1].shared_status).toEqual(item_2.shared_status);
    });

    it('should return item fail with share user not existed', async () => {
      repo.findOne = jest.fn().mockReturnValue(undefined);

      const result = await shareMemberService.updateMember(dataDto, fakeReq);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
      expect(result.itemPass).toHaveLength(0);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST);
      expect(result.itemFail[1].message).toEqual(MSG_ERR_NOT_EXIST);
    });

    it('should throw error when having query failed error', async () => {
      const queryFailedError = new QueryFailedError('', [], new Error());
      repo.getOneByCollection = jest.fn().mockImplementationOnce(() => {
        throw queryFailedError;
      })

      const result = await shareMemberService.updateMember(dataDto, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[1].code).toEqual(ErrorCode.MEMBER_NOT_FOUND);
    });
  });

  describe('Update status of share members', () => {
    const item_1 = FakeData.fakeUpdatedStatusDTO();
    const item_2 = FakeData.fakeUpdatedStatusDTO();

    const entity1 = FakeData.fakeEntity();
    const entity2 = FakeData.fakeEntity();
    const dataDto = [item_1, item_2];

    it('should throw Collection does not exist.', async () => {
      collectionService.findOneWithCondition = jest.fn().mockReturnValue(false);

      const result = await shareMemberService.updateStatusMember(dataDto, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.COLLECTION_NOT_FOUND);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_LINK.COLLECTION_NOT_EXIST);
    });

    it('should throw error when having query failed error', async () => {
      const queryFailedError = new QueryFailedError('', [], new Error());
      collectionService.findOneWithCondition = jest.fn().mockReturnValue({ id: entity1.collection_id });
      repo.getOneMemberByMemberId = jest.fn().mockImplementationOnce(() => {
        throw queryFailedError;
      })

      const result = await shareMemberService.updateStatusMember(dataDto, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[1].code).toEqual(ErrorCode.MEMBER_NOT_FOUND);
    });

    it('should return item fail with share user not existed', async () => {
      collectionService.findOneWithCondition = jest.fn().mockReturnValue({ id: entity1.collection_id });
      repo.getOneMemberByMemberId = jest.fn().mockReturnValue(undefined);

      const result = await shareMemberService.updateStatusMember(dataDto, fakeReq);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
      expect(result.itemPass).toHaveLength(0);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST);
      expect(result.itemFail[1].message).toEqual(MSG_ERR_NOT_EXIST);
    });

    it('should be return member remove of share members', async () => {
      entity1.shared_status = 1;
      entity2.shared_status = 0;
      item_1.shared_status = 4;
      item_2.shared_status = 4;
      entity1.id = item_1.collection_id;
      entity2.id = item_2.collection_id;
      collectionService.findOneWithCondition = jest.fn().mockReturnValue({ id: entity1.collection_id });
      repo.getOneMemberByMemberId = jest.fn().mockReturnValueOnce(entity1)
        .mockReturnValueOnce(entity2);
      repo.find = jest.fn().mockResolvedValue([{
        memberId: 1, updateTime: 123
      }]);

      const result = await shareMemberService
        .updateStatusMember(dataDto, fakeReq);

      expect(result.itemFail).toHaveLength(1);
    });

    it('should be return member when share status are same', async () => {
      entity1.shared_status = 3;
      entity2.shared_status = 3;
      entity1.id = item_1.collection_id;
      entity2.id = item_2.collection_id;

      collectionService.findOneWithCondition = jest.fn().mockReturnValue({ id: entity1.collection_id });
      repo.findOne = jest.fn().mockReturnValueOnce(entity1)
        .mockReturnValueOnce(entity2);
      repo.find = jest.fn().mockResolvedValue([{
        memberId: 1, updateTime: 123
      }]);

      const result = await shareMemberService.updateStatusMember(dataDto, fakeReq);
      expect(result.itemPass).toHaveLength(0);
    });

    it('should be return member declined error', async () => {
      item_1.shared_status = 2;
      entity1.shared_status = 1;
      entity1.id = item_1.collection_id;
      entity2.id = item_2.collection_id;

      collectionService.findOneWithCondition = jest.fn().mockReturnValue({ id: entity1.collection_id });
      repo.findOne = jest.fn().mockReturnValueOnce(entity1);

      const result = await shareMemberService.updateStatusMember([item_1, item_1], fakeReq);
      expect(result.itemPass).toHaveLength(0);
    });

    it('should be success update status of share members', async () => {
      entity1.shared_status = 0;
      entity2.shared_status = 1;
      item_1.shared_status = 1;
      item_2.shared_status = 1;
      entity1.id = item_1.collection_id;
      entity2.id = item_2.collection_id;

      collectionService.findOneWithCondition = jest.fn().mockReturnValue({ id: entity1.collection_id });
      repo.getOneMemberByMemberId = jest.fn().mockReturnValueOnce(entity1)
        .mockReturnValueOnce(entity2);
      repo.find = jest.fn().mockResolvedValue([{
        memberId: 1, updateTime: 123
      }]);
      kanbanRepo.generateSystemKanban = jest.fn().mockReturnValue(1);
      const result = await shareMemberService.updateStatusMember(dataDto, fakeReq);
      entity1.shared_status = 1;
      entity2.shared_status = 1;
      expect(result.itemPass).toHaveLength(1);
      expect(result.itemPass[0].shared_status).toEqual(entity1.shared_status);
    });
  });

  describe('Un-Share members', () => {
    const item_1 = FakeData.fakeUnShareDTO();
    const item_2 = FakeData.fakeUnShareDTO();

    const entity1 = FakeData.fakeEntity();
    const entity2 = FakeData.fakeEntity();
    const dataDto = [item_1, item_2];

    it('should be success un-share members', async () => {
      entity1.shared_status = SHARE_STATUS.JOINED;
      entity2.shared_status = SHARE_STATUS.WAITING;
      entity1.id = item_1.id;
      entity2.id = item_2.id;

      repo.findOne = jest.fn().mockReturnValueOnce(entity1)
        .mockReturnValueOnce(entity2);
      repo.find = jest.fn().mockResolvedValue([{
        memberId: 1, updateTime: 123
      }]);
      collectionService.findOneWithCondition = jest.fn().mockReturnValue(entity1);
      const result = await shareMemberService.unShareMember(dataDto, fakeReq);
      expect(result.itemPass).toHaveLength(2);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(4);
      expect(result.itemPass[0].id).toEqual(item_1.id);
      expect(result.itemPass[1].id).toEqual(item_2.id);
    });

    it('should return item fail with share user not existed', async () => {
      repo.findOne = jest.fn().mockReturnValue(undefined);

      const result = await shareMemberService.unShareMember(dataDto, fakeReq);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(0);
      expect(result.itemPass).toHaveLength(0);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST);
      expect(result.itemFail[1].message).toEqual(MSG_ERR_NOT_EXIST);
    });

    it('should throw error when having query failed error', async () => {
      const queryFailedError = new QueryFailedError('', [], new Error());
      repo.findOne = jest.fn().mockImplementationOnce(() => {
        throw queryFailedError;
      })

      const result = await shareMemberService.unShareMember(dataDto, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[1].code).toEqual(ErrorCode.MEMBER_NOT_FOUND);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
