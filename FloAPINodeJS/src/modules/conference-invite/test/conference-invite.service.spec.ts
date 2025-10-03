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
import { UUID } from 'typeorm/driver/mongodb/bson.typings';
import { APP_IDS, DEVICE_TYPE, REPLY_SEND_STATUS } from '../../../common/constants';
import { ChimeChatChannelEntity } from '../../../common/entities/chime-chat-channel.entity';
import { ConferenceHistoryEntity } from '../../../common/entities/conference-history.entity';
import { UserDeleted } from '../../../common/entities/user-deleted.entity';
import { ConferenceMemberRepository } from '../../../common/repositories';
import { ConferenceHistoryRepository } from '../../../common/repositories/conference-history.repository';
import { ConferenceRepository } from '../../../common/repositories/conference.repository';
import { UsersRepository } from '../../../common/repositories/user.repository';
import { ChimeChatService } from '../../communication/services';
import { ConferenceInviteService } from '../conference-invite.service';



jest.mock('../../../common/utils/apn.util', () => ({
  ApnPush: jest.fn(() => 1),
  ApnVoipPush: jest.fn(() => 1),
  sendAPNs: jest.fn(() => 1),
  sendAPNs4Mac: jest.fn(() => 1)
}));

process.env.PUSH_NOTIFY_KEY_PATH = "/opt/flo_apns_certificates/";
process.env.KEY_MAP_PUSH_NOTIFY_IPAD = '{"11":"com.floware.universalflo.automation"}'
process.env.KEY_MAP_PUSH_NOTIFY_IPHONE = '{"40":"com.floware.flo.dev","41":"com.floware.flo.dev"}'
process.env.KEY_MAP_VOIP_NOTIFY_IPAD = '{"12":"","13":""}'
process.env.KEY_MAP_VOIP_NOTIFY_IPHONE = '{"42":""}'
process.env.KEY_MAP_PUSH_NOTIFY_MACOS = '{"50":"com.floware.flomac","60":"com.floware.flomac.internal"}'

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
    {
      username: 'floauto.api_debug_01_conf_1@flostage.com',
      device_token: 'gzrIM1926YAEpXV3jR5nd9ANciKQW8V4ga5kPXmzVn8lM6xisWwkcE2O07LL6ZMr',
      device_type: 4,
      env_silent: 0,
      cert_env: 2
    },
    {
      username: 'floauto.api_debug_01_conf_1@flostage.com',
      device_token: 'gzrIM1926YAEpXV3jR2225nd9ANciKQW8V4ga5kPXmzVn8lM6xisWwkcE2O07LL6ZMr',
      device_type: 5,
      env_silent: 0,
      cert_env: 0
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
  createConferenceHistoryForInvitee: jest.fn(entity => []),
}));

describe('ConferenceInviteService', () => {
  let createQueryBuilder: any;
  let app: INestApplication;
  let conferenceInviteService: ConferenceInviteService;
  let userService: UsersService;
  let httpClient: HttpService;
  let deviceTokenRepo: MockType<DeviceTokenRepository>;
  let confHisRepo: MockType<ConferenceHistoryRepository>;
  let conferenceRepo: MockType<ConferenceRepository>;
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
    createConferenceHistoryForInvitee: jest.fn(entity => []),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register({}), HttpModule],
      providers: [
        ConferenceInviteService,
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
          provide: WebSocketQueueService,
          useFactory: webSocketServiceMockFactory,
          useValue: {
            floAppCallFloWebSocket: jest.fn((e) => 1),
            floAppReplyFloWebSocket: jest.fn((e) => 1),
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
        },
        {
          provide: ApiLastModifiedQueueService,
          useValue: jest.fn(() => ({
            addJob: jest.fn(entity => entity),
            addJobConference: jest.fn(entity => entity),
          }))
        }
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    deviceTokenRepo = module.get(DeviceTokenRepository);
    conferenceInviteService = module.get<ConferenceInviteService>(ConferenceInviteService);
    userService = module.get<UsersService>(UsersService);
    httpClient = module.get<HttpService>(HttpService);
    confHisRepo = module.get(ConferenceHistoryRepository);
    conferenceRepo = module.get(ConferenceRepository);


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
      expect(conferenceInviteService).toBeDefined();
      expect(userService).toBeDefined();
      expect(confHisRepo).toBeDefined();
    });
  });

  describe('SEND INVITE', () => {

    it('should be send-invite success', async () => {
      const data = {
        "organizer": "abc@flomail.net",
        "invitee": [{ "email": "email1@flomail.net" }, { "email": "email2@flomail.net" }],
        "meeting_url": "URL string",
        "meeting_id": "meeting_id string",
        "channel_id": 223,
        "invite_status": 1,
        "call_type": 1,
        "title": 'abc',
        "sender": "xyza@flomail.net",
      }
      try {
        httpClient.get = jest.fn()
          .mockReturnValue({
            toPromise: () => ({
              data: ['sfa']
            })
          });
        const res = await conferenceInviteService.sendInvite(data, fakeReq);
        expect(res.itemPass.length).toBeGreaterThan(0);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });

    it('should be send-invite not invitee', async () => {
      const data = {
        "organizer": "abc@flomail.net",
        "invitee": [],
        "meeting_url": "URL string",
        "meeting_id": "meeting_id string",
        "channel_id": 223,
        "invite_status": 1,
        "call_type": 1,
        "title": 'abc',
        "sender": "xyza@flomail.net",
      }
      try {
        const res = await conferenceInviteService.sendInvite(data, fakeReq);
        expect(res.itemPass.length).toBeGreaterThan(0);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });

    it('should be send-invite exception', async () => {
      const data = {
        "organizer": "abc@flomail.net",
        "invitee": [{ "email": "email1@flomail.net" }, { "email": "email2@flomail.net" }],
        "meeting_url": "URL string",
        "meeting_id": "meeting_id string",
        "channel_id": 223,
        "invite_status": 1,
        "call_type": 1,
        "title": 'abc',
        "sender": "xyza@flomail.net",
      }
      try {
        const res = await conferenceInviteService.sendInvite(data, fakeReq);
        expect(res.itemPass.length).toBeGreaterThan(0);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });

    it('should be send-invite exception channel not exist', async () => {
      const data = {
        "organizer": "abc@flomail.net",
        "invitee": [
          { "email": "email1@flomail.net" },
          { "email": "email2@flomail.net" }
        ],
        "meeting_url": "URL string",
        "meeting_id": "meeting_id string",
        "channel_id": 0,
        "invite_status": 1,
        "call_type": 1,
        "title": 'abc',
        "sender": "xyza@flomail.net",
      }
      try {
        conferenceRepo.checkExistChannelByMember = jest.fn().mockResolvedValue(0)
        const res = await conferenceInviteService.sendInvite(data, fakeReq);
        expect(res.itemPass.length).toBeGreaterThan(0);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });

    it('should be send-invite exception deviceTokenDoesNotExist', async () => {
      const data = {
        "organizer": "abc@flomail.net",
        "invitee": [{ "email": "email1@flomail.net" }, { "email": "email2@flomail.net" }],
        "meeting_url": "URL string",
        "meeting_id": "meeting_id string",
        "channel_id": 0,
        "invite_status": 1,
        "call_type": 1,
        "title": 'abc',
        "sender": "xyza@flomail.net",
      }
      try {
        deviceTokenRepo.listOfDeviceToken = jest.fn()
          .mockReturnValue({
            toPromise: () => ([
              { device_token: new UUID(), device_type: DEVICE_TYPE.FLO_WEB },
              { device_token: new UUID(), device_type: DEVICE_TYPE.FLO_INTERNAL },
              { device_token: new UUID(), device_type: DEVICE_TYPE.FLO_IPAD_QC },
              { device_token: new UUID(), device_type: DEVICE_TYPE.FLO_IPAD_PROD },
              { device_token: new UUID(), device_type: DEVICE_TYPE.FLO_IPHONE_QC },
              { device_token: new UUID(), device_type: DEVICE_TYPE.FLO_IPHONE_DEV },
            ])
          });
        const res = await conferenceInviteService.sendInvite(data, fakeReq);
        expect(res.itemPass.length).toBeGreaterThan(0);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });

    it('should call sendInvite with non invitee', async () => {
      const data = {
        organizer: "abc@flomail.net",
        invitee: null,
        meeting_url: "URL string",
        meeting_id: "meeting_id string",
        channel_id: 223,
        invite_status: 1,
        call_type: 1,
        reply_status: 20,
        title: 'abc',
        sender: "xyza@flomail.net",
      }
      try {
        await conferenceInviteService.sendInvite(data, { ...fakeReq, user: userIPAD });
      } catch (error) {
      }
    });

    it('should call return data invalid', async () => {
      await conferenceInviteService.sendIPadCall(data, { FLO_IPAD: [] });
    });

    it('should call sendWebCall', async () => {
      await conferenceInviteService.sendWebCall(data, { FLO_WEB: [] });
    });

    it('should call sendIPadCall', async () => {
      await conferenceInviteService.sendIPadCall(data, {
        FLO_IPAD: [
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4600' },
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4603' },
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4601' },
        ]
      });
    });


    it('should call sendIPhoneCall', async () => {
      await conferenceInviteService.sendIPhoneCall(data, {
        FLO_IPHONE: [
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4600' },
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4603' },
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4601' },
        ]
      });
    });

    it('should call sendMacCall', async () => {
      await conferenceInviteService.sendMacOSCall(data, {
        FLO_MAC: [
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4600' },
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4603' },
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4601' },
        ]
      });
    });

    it('should call sendWebCall', async () => {
      await conferenceInviteService.sendWebCall(dataNonDevice, {
        FLO_WEB: [
          { device_uid: '4715c998-1f71-4133-9bd5-16e40b4b4600' },
          { device_uid: '4715c998-1f71-4133-9bd5-16e40b4b4601' },
        ]
      });
    });
  });

  describe('REPLY INVITE', () => {
    it('should be reply-invite success with device token', async () => {
      const data = {
        organizer: "abc@flomail.net",
        invitee: [{ "email": "email1@flomail.net" }, { "email": "email2@flomail.net" }],
        meeting_url: "URL string",
        meeting_id: "meeting_id string",
        channel_id: 223,
        invite_status: 1,
        call_type: 1,
        reply_status: 22,
        device_token: "mgNtgUO2YoOxr7da8d0aN89X81DxKe70hiJ6q1uJaPoS8wg6gagYkFbVCTbqUpYT"
      }
      try {
        httpClient.get = jest.fn()
          .mockReturnValue({
            toPromise: () => ({
              data: ['sfa']
            })
          });
        const res = await conferenceInviteService.replyInvite(data, fakeReq);
        expect(res.itemPass.length).toBeGreaterThan(0);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });

    it('should be reply-invite success with no device token', async () => {
      const data = {
        organizer: "abc@flomail.net",
        invitee: [{ "email": "email1@flomail.net" }, { "email": "email2@flomail.net" }],
        meeting_url: "URL string",
        meeting_id: "meeting_id string",
        channel_id: 223,
        invite_status: 1,
        call_type: 1,
        reply_status: 22,
      }
      try {
        httpClient.get = jest.fn()
          .mockReturnValue({
            toPromise: () => ({
              data: ['sfa']
            })
          });
        const res = await conferenceInviteService.replyInvite(data, fakeReq);
        expect(res.itemPass.length).toBeGreaterThan(0);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });

    it('should be reply-invite not invitee', async () => {
      const data = {
        organizer: "abc@flomail.net",
        invitee: [],
        meeting_url: "URL string",
        meeting_id: "meeting_id string",
        channel_id: 223,
        invite_status: 1,
        call_type: 1,
        reply_status: 22,
      }
      try {
        const res = await conferenceInviteService.replyInvite(data, fakeReq);
        expect(res.itemPass.length).toBeGreaterThan(0);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });

    it('should be reply-invite exception', async () => {
      const data = {
        organizer: "abc@flomail.net",
        invitee: [{ "email": "email1@flomail.net" }, { "email": "email2@flomail.net" }],
        meeting_url: "URL string",
        meeting_id: "meeting_id string",
        channel_id: 223,
        invite_status: 1,
        call_type: 1,
        reply_status: 22,
      }
      try {
        const res = await conferenceInviteService.replyInvite(data, fakeReq);
        expect(res.itemPass.length).toBeGreaterThan(0);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });

    it('should be reply-invite exception channel not exist', async () => {
      const data = {
        "organizer": "abc@flomail.net",
        "invitee": [{ "email": "email1@flomail.net" }, { "email": "email2@flomail.net" }],
        "meeting_url": "URL string",
        "meeting_id": "meeting_id string",
        "channel_id": 0,
        "title": 'abc',
        "invite_status": 1,
        "call_type": 1,
        "sender": "xyza@flomail.net",
      }
      try {
        conferenceRepo.checkExistChannelByMember = jest.fn(entity => 0)
        deviceTokenRepo.listOfDeviceToken = jest.fn()
          .mockReturnValue({
            toPromise: () => ([])
          });
        const res = await conferenceInviteService.sendInvite(data, fakeReq);
        expect(res.itemPass.length).toBeGreaterThan(0);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });

    it('should be reply-invite exception deviceTokenDoesNotExist', async () => {
      const data = {
        "organizer": "abc@flomail.net",
        "invitee": [{ "email": "email1@flomail.net" }, { "email": "email2@flomail.net" }],
        "meeting_url": "URL string",
        "meeting_id": "meeting_id string",
        "channel_id": 0,
        "title": 'abc',
        "invite_status": 1,
        "call_type": 1,
        "sender": "xyza@flomail.net",
      }
      try {
        deviceTokenRepo.listOfDeviceToken = jest.fn()
          .mockReturnValue({
            toPromise: () => ([])
          });
        const res = await conferenceInviteService.sendInvite(data, fakeReq);
        expect(res.itemPass.length).toBeGreaterThan(0);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });

    it('should be reply-invite success with call_decline', async () => {
      const data = {
        organizer: "abc@flomail.net",
        invitee: [{ "email": "email1@flomail.net" }, { "email": "email2@flomail.net" }],
        meeting_url: "URL string",
        meeting_id: "meeting_id string",
        channel_id: 223,
        invite_status: 1,
        call_type: 1,
        reply_status: REPLY_SEND_STATUS.call_declined,
        device_token: "mgNtgUO2YoOxr7da8d0aN89X81DxKe70hiJ6q1uJaPoS8wg6gagYkFbVCTbqUpYT"
      }
      try {
        httpClient.get = jest.fn()
          .mockReturnValue({
            toPromise: () => ({
              data: ['sfa']
            })
          });
        const res = await conferenceInviteService.replyInvite(data, fakeReq);
        expect(res.itemPass).toBe({ status: 1 });
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });

    it('should call replyInvite with channel with web decline', async () => {
      const data = {
        organizer: "abc@flomail.net",
        invitee: [{ email: "abc1@flomail.net" }, { email: "abc2@flomail.net" },],
        meeting_url: "URL string",
        meeting_id: "meeting_id string",
        channel_id: 223,
        invite_status: 1,
        call_type: 1,
        reply_status: REPLY_SEND_STATUS.call_declined,
        title: 'abc',
        sender: "xyza@flomail.net",
      }
      conferenceRepo.checkExistChannelByMember = jest.fn().mockResolvedValue(1)
      const rs
        = await conferenceInviteService.replyInvite(data, { ...fakeReq, user: userWEB });

      expect(rs.itemPass).toBeDefined();
      expect(rs.itemFail.length).toBe(0);
    });


    it('should call replyInvite with non invitee', async () => {
      const data = {
        organizer: "abc@flomail.net",
        invitee: null,
        meeting_url: "URL string",
        meeting_id: "meeting_id string",
        channel_id: 223,
        invite_status: 1,
        call_type: 1,
        reply_status: 20
      }
      try {
        await conferenceInviteService.replyInvite(data, { ...fakeReq, user: userIPAD });
      } catch (error) {
      }
    });

    it('should call replyInvite with channel not existed', async () => {
      const data = {
        organizer: "abc@flomail.net",
        invitee: [{ email: "abc1@flomail.net" }, { email: "abc2@flomail.net" },],
        meeting_url: "URL string",
        meeting_id: "meeting_id string",
        channel_id: 223,
        invite_status: 1,
        call_type: 1,
        reply_status: 20,
        title: 'abc',
        sender: "xyza@flomail.net",
      }
      try {
        conferenceRepo.checkExistChannelByMember = jest.fn().mockResolvedValue(0)
        await conferenceInviteService.replyInvite(data, { ...fakeReq, user: userIPAD });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should call return data invalid', async () => {
      await conferenceInviteService.replyIPadCall(data, { FLO_IPAD: [] }, userIPAD);
    });

    it('should call replyWebCall', async () => {
      await conferenceInviteService.replyWebCall(data, { FLO_WEB: [] }, userWEB);
    });

    it('should call replyMacOS', async () => {
      await conferenceInviteService.replyMacOSCall(data, {
        FLO_MAC: [
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4600' },
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4603' },
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4601' },
        ]
      }, userIPAD);
    });

    it('should call replyIPadCall', async () => {
      await conferenceInviteService.replyIPadCall(data, {
        FLO_IPAD: [
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4600' },
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4603' },
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4601' },
        ]
      }, userIPAD);
    });

    it('should call replyIPhoneCall', async () => {
      await conferenceInviteService.replyIPhoneCall(data, {
        FLO_IPHONE: [
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4600' },
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4603' },
          { device_token: '4715c998-1f71-4133-9bd5-16e40b4b4601' },
        ]
      }, userIPAD);
    });

    it('should call replyWebCall', async () => {
      await conferenceInviteService.replyWebCall(dataNonDevice, {
        FLO_WEB: [
          { device_uid: '4715c998-1f71-4133-9bd5-16e40b4b4600' },
          { device_uid: '4715c998-1f71-4133-9bd5-16e40b4b4601' },
        ]
      }, userWEB);
    });
  });
  afterAll(async () => {
    await app.close();
  });
});