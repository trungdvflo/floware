import { HttpModule, HttpService } from '@nestjs/axios';
import { CacheModule, INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { ErrorCode } from '../../../common/constants/error-code';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { UserDeleted } from '../../../common/entities/user-deleted.entity';
import { IUser } from '../../../common/interfaces';
import { LoggerService } from '../../../common/logger/logger.service';
import { ConferenceMemberRepository, ConferenceRepository } from '../../../common/repositories';
import { UsersRepository } from '../../../common/repositories/user.repository';
import { ApiLastModifiedQueueService } from '../../../modules/bullmq-queue/api-last-modified-queue.service';
import { ChimeChatService } from '../../../modules/communication/services';
import { DatabaseUtilitiesService } from '../../../modules/database/database-utilities.service';
import { DeletedItemService } from '../../../modules/deleted-item/deleted-item.service';
import { UsersService } from '../../../modules/users/users.service';
import { ConferenceMemberService } from '../conference-member.service';
import { fakeCreateDetails, fakeCreateNoDubplicates, fakeDeleteDetails, fakeQuery } from './faker';

jest.mock('@nestjs/axios', () => ({
  HttpModule: jest.fn(),
  HttpService: jest.fn(),
}));
const spyHttpClient = {
  axiosRef: {
    post: jest.fn().mockReturnValue({
      data: { data: [] }
    })
  }
};

const repoMockFactory = jest.fn(() => ({
  createQueryBuilder: jest.fn(e => e),
  find: jest.fn((entity) => [entity]),
  findOne: jest.fn((entity) => entity),
  insert: jest.fn((entity) => {
    return {
      raw: {
        insertId: 1
      }
    }
  }),
  create: jest.fn((entity) => entity),
}));

const apiLastModifiedServiceMockFactory: () =>
  MockType<ApiLastModifiedQueueService> = jest.fn(() => ({}));

const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({}));

const databaseServiceMockFactory: () =>
  MockType<DatabaseUtilitiesService> = jest.fn(() => ({}));

const conferenceMemberReposMockFactory: () => MockType<ConferenceMemberRepository> = jest.fn(() => ({
  findByObjUid: jest.fn(entity => entity),
  find: jest.fn(entity => entity),
  findOne: jest.fn((id: number) => id),
  save: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  insert: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  remove: jest.fn(entity => entity),
  findOneBy: jest.fn(entity => entity),
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
  checkExistChannelByMember: jest.fn(entity => 1),
  listOfConferenceHistory: jest.fn(entity => [entity]),
  createConferenceHistoryForInvitee: jest.fn(entity => []),
}));

describe('ConferenceMemberService', () => {
  let app: INestApplication;
  let service: ConferenceMemberService;
  let userService: UsersService;
  let httpClient: HttpService;
  let conferenceMemberRepo: MockType<ConferenceMemberRepository>;
  let deletedItemService: DeletedItemService;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let eventEmitter: EventEmitter2;
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
      imports: [CacheModule.register({}), HttpModule],
      providers: [
        ConferenceMemberService,
        UsersService,
        LoggerService,
        ChimeChatService,
        DeletedItemService,
        DatabaseUtilitiesService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory,
          useValue: {
            addJob: jest.fn((e) => e),
            addJobConference: jest.fn((e) => e)
          },
        },
        {
          provide: DatabaseUtilitiesService,
          useFactory: databaseServiceMockFactory,
          useValue: {
            getAllConferenceMember: jest.fn((e) => e),
          },
        },
        {
          provide: HttpService,
          useValue: spyHttpClient
        },
        {
          provide: ConferenceRepository,
          useFactory: conferenceMemberReposMockFactory
        },
        {
          provide: ConferenceMemberRepository,
          useFactory: conferenceMemberReposMockFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: UsersRepository,
          useFactory: repoMockFactory,
        },
        {
          provide: getRepositoryToken(UserDeleted),
          useFactory: repoMockFactory,
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

    service = module.get<ConferenceMemberService>(ConferenceMemberService);
    userService = module.get<UsersService>(UsersService);
    httpClient = module.get<HttpService>(HttpService);
    deletedItemService = module.get<any>(DeletedItemService);
    conferenceMemberRepo = module.get(ConferenceMemberRepository);
    databaseUtilitiesService = module.get<any>(DatabaseUtilitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(userService).toBeDefined();
    expect(conferenceMemberRepo).toBeDefined();
  });

  it('should be get all', async () => {
    const filter = {
      page_size: 100,
      has_del: 1
    };
    databaseUtilitiesService.getAllConferenceMember = jest.fn().mockReturnValue(true);
    deletedItemService.findAll = jest.fn().mockReturnValue(true);
    const res = await service.getAll(filter, user.userId);
    expect(res.data).not.toBeNull();
  });

  describe('Post Conference Member', () => {
    it('should be show duplicateEntry', async () => {
      const res = await service.create(fakeCreateDetails, fakeReq);
      expect(res.itemFail[0].code).toEqual(ErrorCode.DUPLICATE_ENTRY)
    })

    it('should be create error with The conference not existed.', async () => {
      conferenceMemberRepo.checkConferenceWithEmail = jest.fn().mockResolvedValue(false);
      const res = await service.create(fakeCreateNoDubplicates, fakeReq);
      expect(res.itemFail[0].code).toEqual(ErrorCode.CONFERENCE_NOT_EXIST)
    });

    it('should be create error with objectDuplicated', async () => {
      conferenceMemberRepo.checkConferenceWithEmail = jest.fn().mockResolvedValue({
        channel_id: 112,
        revoke_time: 0,
        enable_chat_history: 1,
        id: 1,
      });
      const res = await service.create(fakeCreateNoDubplicates, fakeReq);
      expect(res.itemFail[0].code).toEqual(ErrorCode.OBJECT_DUPLICATED)
    });

    it('should be create success with revoke time > 0', async () => {
      conferenceMemberRepo.checkConferenceWithEmail = jest.fn().mockReturnValue({
        channel_id: 112,
        revoke_time: 123456,
        enable_chat_history: 1,
        id: 1,
      });
      conferenceMemberRepo.update = jest.fn().mockResolvedValue(fakeDeleteDetails[0]);
      userService.getUserIdByEmail = jest.fn().mockResolvedValue({ id: user.userId });
      conferenceMemberRepo.find = jest.fn().mockResolvedValue(fakeDeleteDetails);
      const res = await service.create(fakeCreateDetails, fakeReq);
      expect(res.itemPass.length).toBeGreaterThan(0);
    });

    it('should be return USER_NOT_FOUND', async () => {
      conferenceMemberRepo.checkConferenceWithEmail = jest.fn().mockReturnValue({
        channel_id: 112,
        enable_chat_history: 1,
        id: 1,
      });
      userService.getUserIdByEmail = jest.fn().mockResolvedValue(false);
      const res = await service.create(fakeCreateNoDubplicates, fakeReq);
      expect(res.itemFail[0].code).toEqual(ErrorCode.USER_NOT_FOUND)
    });

    it('should be create succesful', async () => {
      conferenceMemberRepo.checkConferenceWithEmail = jest.fn().mockReturnValue({
        channel_id: 112,
        id: 1,
        enable_chat_history: 1
      });
      userService.getUserIdByEmail = jest.fn().mockResolvedValue({ id: user.userId });
      conferenceMemberRepo.insert = jest.fn().mockResolvedValue(fakeQuery);
      conferenceMemberRepo.find = jest.fn().mockResolvedValue(fakeDeleteDetails);
      const res = await service.create(fakeCreateDetails, fakeReq);
      expect(res.itemPass.length).toBeGreaterThan(0);
    });

    it('should be create false', async () => {
      conferenceMemberRepo.checkConferenceWithEmail = jest.fn().mockReturnValue({
        channel_id: 112,
        id: 1,
        enable_chat_history: 1
      });
      userService.getUserIdByEmail = jest.fn().mockResolvedValue({ id: user.userId });
      conferenceMemberRepo.insert = jest.fn().mockResolvedValue(false);
      conferenceMemberRepo.find = jest.fn().mockResolvedValue(fakeDeleteDetails);
      const res = await service.create(fakeCreateDetails, fakeReq);
      expect(res.itemPass.length).toEqual(0)
    });
  });

  describe('PUT Conference Member', () => {
    it('should be update error with The conference not existed.', async () => {
      conferenceMemberRepo.checkConferenceWithMemberId = jest.fn().mockResolvedValue(false);
      const res = await service.update(fakeCreateNoDubplicates, fakeReq);
      expect(res.itemFail[0].code).toEqual(ErrorCode.CONFERENCE_NOT_EXIST)
    });

    it('should be error with conferenceNotPermission', async () => {
      conferenceMemberRepo.checkConferenceWithMemberId = jest.fn().mockReturnValue({
        is_creator: 2,
        revoke_time: 1,
        channel_id: 1
      });
      conferenceMemberRepo.update = jest.fn().mockResolvedValue(fakeDeleteDetails[0]);
      const res = await service.update(fakeCreateDetails, fakeReq);
      expect(res.itemFail[0].code).toEqual(ErrorCode.CONFERENCE_NOT_PERMISSION)
    });

    it('should be update success', async () => {
      conferenceMemberRepo.checkConferenceWithMemberId = jest.fn().mockReturnValue({
        is_creator: 1,
        revoke_time: 1,
        channel_id: 1
      });
      conferenceMemberRepo.update = jest.fn().mockResolvedValue(fakeDeleteDetails[0]);
      conferenceMemberRepo.find = jest.fn().mockResolvedValue(fakeDeleteDetails);
      const res = await service.update(fakeCreateDetails, fakeReq);
      expect(res.itemPass.length).toBeGreaterThan(0);
    });

    it('should be update  error exception', async () => {
      const res = await service.update(fakeCreateDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });

    it('should be update  error not exist', async () => {
      service['checkConferenceWithMemberId'] = jest.fn().mockResolvedValue({});
      const res = await service.update(fakeCreateDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });
  });

  describe('REMOVE Conference Member', () => {
    it('should be remove error with The conference not existed.', async () => {
      conferenceMemberRepo.checkConferenceWithMemberId = jest.fn().mockResolvedValue(false);
      const res = await service.remove(fakeDeleteDetails, fakeReq);
      expect(res.itemFail[0].code).toEqual(ErrorCode.CONFERENCE_NOT_EXIST)
    });

    it('should be remove success', async () => {
      conferenceMemberRepo.checkConferenceWithMemberId = jest.fn().mockReturnValue({
        is_creator: 1,
        revoke_time: 1,
        channel_id: 1
      });
      conferenceMemberRepo.update = jest.fn().mockResolvedValue(fakeDeleteDetails[0]);
      conferenceMemberRepo.find = jest.fn().mockResolvedValue(fakeDeleteDetails);
      const res = await service.remove(fakeDeleteDetails, fakeReq);
      expect(res.itemPass.length).toBeGreaterThan(0);
    });

    it('should be remove error exception', async () => {
      const res = await service.remove(fakeDeleteDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });

    it('should be remove error not exist', async () => {
      service['checkConferenceWithMemberId'] = jest.fn().mockResolvedValue({});
      const res = await service.remove(fakeDeleteDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});