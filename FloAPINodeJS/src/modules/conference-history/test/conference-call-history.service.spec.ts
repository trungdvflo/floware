import { HttpModule, HttpService } from '@nestjs/axios';
import { CacheModule, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockType, fakeReq } from '../../../../test';
import { ConferenceMemberEntity } from '../../../common/entities/conference-member.entity';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { IUser } from '../../../common/interfaces';
import { LoggerService } from '../../../common/logger/logger.service';
import { DeviceTokenRepository } from '../../../common/repositories/devicetoken.repository';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { WebSocketQueueService } from '../../bullmq-queue/web-socket-queue.service';
import { ConferenceMemberService } from '../../conference-member/conference-member.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { UsersService } from '../../users/users.service';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { APP_IDS } from '../../../common/constants';
import { ChimeChatChannelEntity } from '../../../common/entities/chime-chat-channel.entity';
import { ConferenceHistoryEntity } from '../../../common/entities/conference-history.entity';
import { UserDeleted } from '../../../common/entities/user-deleted.entity';
import { ConferenceMeetingRepository, ConferenceMemberRepository } from '../../../common/repositories';
import { ConferenceHistoryRepository } from '../../../common/repositories/conference-history.repository';
import { ConferenceRepository } from '../../../common/repositories/conference.repository';
import { UsersRepository } from '../../../common/repositories/user.repository';
import { ChimeChatService } from '../../communication/services';
import { ConferenceHistoryService } from '../conference-history.service';
import { fakeCreateDetails, fakeDeleteDetails } from './faker';



jest.mock('../../../common/utils/apn.util', () => ({
  ApnPush: jest.fn(() => 1),
  ApnVoipPush: jest.fn(() => 1),
  sendAPNs: jest.fn(() => 1),
}));

process.env.KEY_MAP_PUSH_NOTIFY = "{\"10\":\"com.floware.universalflo.qcrelease\",\"11\":\"com.floware.universalflo.qc\",\"30\":\"com.floware.flo.qc\",\"31\":\"com.floware.flo.qc\"}";
process.env.PUSH_NOTIFY_KEY_PATH = "/opt/flo_apns_certificates/";
process.env.EY_MAP_VOIP_NOTIFY = '{"12":"","13":""}';

jest.mock('@nestjs/axios', () => ({
  HttpModule: jest.fn(),
  HttpService: jest.fn(),
}));
export class TestUtilsService {
  static createSpyObj(baseName: string, methodNames: string[]): SpyObject {
    let obj: any = {};

    for (let i = 0; i < methodNames.length; i++) {
      obj[methodNames[i]] = jest.fn();
    }
    return { [baseName]: () => obj };
  };
}

export class SpyObject {
  [key: string]: () => { [key: string]: jest.Mock };
}
const spyHttpClient: SpyObject = TestUtilsService.createSpyObj('get', ['toPromise']);

const repoMockFactory = jest.fn(() => ({
  createQueryBuilder: jest.fn(e => e),
  find: jest.fn((entity) => entity),
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

const webSocketServiceMockFactory: () =>
  MockType<WebSocketQueueService> = jest.fn(() => ({}));

const databaseServiceMockFactory: () =>
  MockType<DatabaseUtilitiesService> = jest.fn(() => ({}));
const deviceTokenRepoMockFactory: () => MockType<DeviceTokenRepository> = jest.fn(() => ({
  findByObjUid: jest.fn(entity => entity),
  find: jest.fn(entity => entity),
  findOne: jest.fn((id: number) => id),
  save: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  insert: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  remove: jest.fn(entity => entity),
  listOfDeviceToken: jest.fn(entity => ([
    {
      username: 'floauto.api_debug_01_conf_1@flostage.com',
      device_token: 'xmJmb2GhJoLemgHeLMVmhPYH8aCavknDw9r42OxTzbcq7P7bNiU5Ls4aGx47v4zA',
      device_type: -1,
      env_silent: 0,
      cert_env: 2
    },
    {
      username: 'floauto.api_debug_01_conf_1@flostage.com',
      device_token: 'gzrIM1926YAEpXV3jR5nd9ANciKQW8V4ga5kPXmzVn8lM6xisWwkcE2O07LL6ZMr',
      device_type: 2,
      env_silent: 0,
      cert_env: 2
    },
  ])),
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

const conferenceMemberReposMockFactory: () => MockType<ConferenceMemberRepository> = jest.fn(() => ({
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
  checkExistChannelByMember: jest.fn(entity => 1),
  listOfConferenceHistory: jest.fn(entity => [entity]),
  createConferenceHistoryForInvitee: jest.fn(entity => 0),
}));

const conferenceMeetingReposMockFactory: () => MockType<ConferenceMeetingRepository> = jest.fn(() => ({
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
  createIfNotExists: jest.fn(entity => 1),
}));

describe('ConferenceHistoryService', () => {
  let createQueryBuilder: any;
  let app: INestApplication;
  let conferenceHistoryService: ConferenceHistoryService;
  let userService: UsersService;
  let confMemberService: ConferenceMemberService;
  let deletedItemService: DeletedItemService;
  let httpClient: HttpService;
  let deviceTokenRepo: MockType<DeviceTokenRepository>;
  let confHisRepo: MockType<ConferenceHistoryRepository>;
  let conferenceRepo: MockType<ConferenceRepository>;
  let eventEmitter: EventEmitter2;
  let conferenceMemberRepo: MockType<ConferenceMemberRepository>;
  const user: IUser = {
    userId: 1,
    id: 1,
    email: 'tester001@flomail.net',
    appId: '',
    deviceUid: '',
    userAgent: '',
    token: '',
  };

  const _userWeb: IUser = {
    userId: 1,
    id: 1,
    email: 'tester001@flomail.net',
    appId: APP_IDS.web,
    deviceUid: '',
    userAgent: '',
    token: '',
  };

  const conferenceHisReposMockFactory: () => MockType<ConferenceHistoryRepository> = jest.fn(() => ({
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
    checkExistChannelByMember: jest.fn(entity => 1),
    listOfConferenceHistory: jest.fn(entity => [entity]),
    createConferenceHistoryForInvitee: jest.fn(entity => 0),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register({}), HttpModule],
      providers: [
        ConferenceHistoryService,
        UsersService,
        ConferenceMemberService,
        LoggerService,
        ChimeChatService,
        {
          provide: DeletedItemService,
          useFactory: jest.fn(() => ({})),
          useValue: {
            findAll: jest.fn((e) => e),
          },
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory,
          useValue: {
            addJob: jest.fn((e) => e),
          },
        },
        {
          provide: ConferenceRepository,
          useFactory: conferenceHisReposMockFactory
        },
        {
          provide: ConferenceMemberRepository,
          useFactory: conferenceMemberReposMockFactory
        },
        {
          provide: ConferenceHistoryRepository,
          useFactory: conferenceHisReposMockFactory
        },
        {
          provide: ConferenceMeetingRepository,
          useFactory: conferenceMeetingReposMockFactory
        },
        {
          provide: WebSocketQueueService,
          useFactory: webSocketServiceMockFactory,
          useValue: {
            floAppCallFloWebSocket: jest.fn((e) => e),
            floAppReplyFloWebSocket: jest.fn((e) => e),
          },
        },

        {
          provide: DatabaseUtilitiesService,
          useFactory: databaseServiceMockFactory,
          useValue: {
            getAll: jest.fn((e) => [e]),
          },
        },
        {
          provide: DeviceTokenRepository,
          useFactory: deviceTokenRepoMockFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(ConferenceHistoryEntity),
          useFactory: repoMockFactory,
        },
        {
          provide: getRepositoryToken(ChimeChatChannelEntity),
          useFactory: repoMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(ConferenceMemberEntity),
          useFactory: repoMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockFactory,
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
          provide: HttpService,
          useValue: spyHttpClient
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn((e) => e),
          },
        }
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    deviceTokenRepo = module.get(DeviceTokenRepository);
    conferenceHistoryService = module.get<ConferenceHistoryService>(ConferenceHistoryService);
    userService = module.get<UsersService>(UsersService);
    confMemberService = module.get<ConferenceMemberService>(ConferenceMemberService);
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    httpClient = module.get<HttpService>(HttpService);
    confHisRepo = module.get(ConferenceHistoryRepository);
    conferenceRepo = module.get(ConferenceRepository);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);


    createQueryBuilder = {
      select: jest.fn(entity => createQueryBuilder),
      addSelect: jest.fn(entity => createQueryBuilder),
      leftJoin: jest.fn(entity => createQueryBuilder),
      innerJoin: jest.fn(entity => createQueryBuilder),
      innerJoinAndSelect: jest.fn(entity => createQueryBuilder),
      // leftJoinAndSelect: jest.fn(entity => createQueryBuilder),
      where: jest.fn(entity => createQueryBuilder),
      andWhere: jest.fn(entity => createQueryBuilder),
      execute: jest.fn(entity => createQueryBuilder),
      getRawOne: jest.fn(entity => { return { channel_id: 1 } }),
      getOne: jest.fn(entity => { return { channel_id: 1 } }),
    };
    confHisRepo.createQueryBuilder = jest.fn(() => createQueryBuilder);
    conferenceMemberRepo = module.get(ConferenceMemberRepository);
    conferenceRepo.createQueryBuilder = jest.fn(() => createQueryBuilder);
  });

  const data = {
    organizer: "abc@flomail.net",
    invitee: [{ "email": "email1@flomail.net" }, { "email": "email2@flomail.net" }],
    meeting_url: "URL string",
    meeting_id: "meeting_id string",
    channel_id: 223,
    invite_status: 1,
    call_type: 1,
    reply_status: 20,
    device_token: '4715c998-1f71-4133-9bd5-16e40b4b4600'
  }

  const dataNonDevice = {
    organizer: "abc@flomail.net",
    invitee: [{ "email": "email1@flomail.net" }, { "email": "email2@flomail.net" }],
    meeting_url: "URL string",
    meeting_id: "meeting_id string",
    channel_id: 223,
    invite_status: 1,
    call_type: 1,
    reply_status: 20
  }

  const userIPAD: IUser = {
    userId: 1,
    id: 1,
    email: 'tester001@flomail.net',
    appId: 'd944424393cf309e125cbfaf0e70f1ba',
    deviceUid: '4715c998-1f71-4133-9bd5-16e40b4b4601',
    userAgent: '',
    token: '',
  };

  const userWEB: IUser = {
    userId: 1,
    id: 1,
    email: 'tester001@flomail.net',
    appId: 'e70f1b125cbad944424393cf309efaf0',
    deviceUid: '4715c998-1f71-4133-9bd5-16e40b4b4600',
    userAgent: '',
    token: '',
  };

  describe('DEFINITION', () => {

    it('should be defined', () => {
      expect(conferenceHistoryService).toBeDefined();
      expect(userService).toBeDefined();
      expect(confHisRepo).toBeDefined();
    });
  });

  describe('GET', () => {

    it('should be get all', async () => {
      const filter = {
        page_size: 100,
        has_del: 1
      };
      const res = await conferenceHistoryService.getAll(filter, fakeReq);
      expect(res.data).not.toBeNull();
      expect(res.data_del).not.toBeNull();
    });

    it('should be get all by web', async () => {
      const filter = {
        page_size: 100,
        has_del: 1
      };
      const res = await conferenceHistoryService.getAll(filter, { ...fakeReq, user: _userWeb });
      expect(res.data).not.toBeNull();
      expect(res.data_del).not.toBeNull();
    });
  });
  describe('CREATE', () => {

    it('should be create not success', async () => {
      conferenceMemberRepo.checkConferenceWithEmail = jest.fn()
        .mockResolvedValueOnce(fakeCreateDetails[0])
        .mockResolvedValueOnce(fakeCreateDetails[1]);
      userService.getUserIdByEmail = jest.fn().mockResolvedValue({ id: user.userId });
      confHisRepo.find = jest.fn().mockResolvedValue(fakeCreateDetails);
      const res = await conferenceHistoryService.create(fakeCreateDetails, fakeReq);

      expect(res.itemFail.length).toBeGreaterThan(0);
    });

    it('should be create duplicate data', async () => {
      conferenceMemberRepo.checkConferenceWithEmail = jest.fn()
        .mockResolvedValueOnce(fakeCreateDetails[0])
        .mockResolvedValueOnce(fakeCreateDetails[0]);
      userService.getUserIdByEmail = jest.fn().mockResolvedValue({ id: user.userId });
      confHisRepo.find = jest.fn().mockResolvedValue(fakeCreateDetails);
      const res = await conferenceHistoryService.create([fakeCreateDetails[0], fakeCreateDetails[0]], fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });

    it('should be create error with revoke time > 0', async () => {
      conferenceMemberRepo.checkConferenceWithEmail = jest.fn().mockResolvedValue({
        channel_id: 112,
        id: 1,
        revoke_time: 123456
      });
      const res = await conferenceHistoryService.create(fakeCreateDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });

    it('should be create error with CONFERENCE_NOT_EXIST', async () => {
      conferenceMemberRepo.checkConferenceWithEmail = jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({})
      const res = await conferenceHistoryService.create(fakeCreateDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });

    it('should be create error email not exist', async () => {
      conferenceMemberRepo.checkConferenceWithEmail = jest.fn()
        .mockResolvedValueOnce(fakeCreateDetails[0])
        .mockResolvedValueOnce(fakeCreateDetails[1])
      userService.getUserIdByEmail = jest.fn().mockResolvedValue({});
      const res = await conferenceHistoryService.create(fakeCreateDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });

    it('should be create error exception', async () => {
      const res = await conferenceHistoryService.create(fakeCreateDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });
  });
  describe('UPDATE', () => {

    it('should be update success', async () => {
      confHisRepo.find = jest.fn().mockResolvedValueOnce(fakeCreateDetails);
      confHisRepo.update = jest.fn().mockResolvedValueOnce(fakeCreateDetails[0])
        .mockResolvedValueOnce(fakeCreateDetails[1]);
      const res = await conferenceHistoryService.update(fakeCreateDetails, fakeReq);
      expect(res.itemPass.length).toBeGreaterThan(0);
    });

    it('should be update  error exception', async () => {
      const res = await conferenceHistoryService.update(fakeCreateDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });

    it('should be update  error not exist', async () => {
      confHisRepo.find = jest.fn().mockResolvedValueOnce([{}]);
      confHisRepo.findOne = jest.fn().mockResolvedValue(null)
      const res = await conferenceHistoryService.update(fakeCreateDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE', () => {
    it('should be Delete success', async () => {
      confHisRepo.find = jest.fn().mockResolvedValueOnce(fakeDeleteDetails);
      confHisRepo.delete = jest.fn().mockResolvedValue(fakeDeleteDetails);
      confHisRepo.findOne = jest.fn().mockResolvedValueOnce(fakeDeleteDetails[0])
        .mockResolvedValueOnce(fakeDeleteDetails[1]);
      deletedItemService.create = jest.fn().mockResolvedValueOnce(fakeDeleteDetails[0])
        .mockResolvedValueOnce(fakeDeleteDetails[1]);

      const res = await conferenceHistoryService.delete(fakeDeleteDetails, fakeReq);
      expect(res.itemPass.length).toBeGreaterThan(0);
    });

    it('should be Delete error at deleted item', async () => {
      confHisRepo.find = jest.fn().mockResolvedValueOnce(fakeDeleteDetails);
      deletedItemService.create = jest.fn().mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const res = await conferenceHistoryService.delete([...fakeDeleteDetails, ...fakeDeleteDetails], fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });

    it('should be delete error exception', async () => {
      const res = await conferenceHistoryService.delete(fakeDeleteDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });

    it('should be delete error not exist', async () => {
      confHisRepo.find = jest.fn().mockResolvedValueOnce([{}]);
      const res = await conferenceHistoryService.delete(fakeDeleteDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });
  });
  describe('REPLY', () => {

    it('should be reply success', async () => {
      conferenceMemberRepo.getMembers4Check = jest.fn()
        .mockResolvedValueOnce([fakeCreateDetails[0]])
        .mockResolvedValueOnce([fakeCreateDetails[1]]);
      userService.getUserIdByEmail = jest.fn().mockResolvedValue({ id: user });
      confHisRepo.find = jest.fn().mockResolvedValue(fakeCreateDetails);
      const res = await conferenceHistoryService.reply(fakeCreateDetails, fakeReq);
      expect(res.itemPass.length).toBeGreaterThan(0);
    });

    it('should be reply error with CONFERENCE_NOT_EXIST', async () => {
      conferenceMemberRepo.getMembers4Check = jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce([])
      const res = await conferenceHistoryService.reply(fakeCreateDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });

    it('should be reply error email not exist', async () => {
      conferenceMemberRepo.getMembers4Check = jest.fn()
        .mockResolvedValueOnce(fakeCreateDetails[0])
        .mockResolvedValueOnce(fakeCreateDetails[1])
      userService.getUserIdByEmail = jest.fn().mockResolvedValue({});
      const res = await conferenceHistoryService.reply(fakeCreateDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });

    it('should be reply error exception', async () => {
      const res = await conferenceHistoryService.reply(fakeCreateDetails, fakeReq);
      expect(res.itemFail.length).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});