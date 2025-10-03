import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { APP_IDS } from '../../../common/constants';
import { ErrorCode } from '../../../common/constants/error-code';
import { INVALID_REQUEST } from '../../../common/constants/message.constant';
import { BaseGetDTO, GetConferencePagingDTO } from '../../../common/dtos/base-get.dto';
import { ErrorDTO } from '../../../common/dtos/error.dto';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { IUser } from '../../../common/interfaces';
import {
  CollectionRepository, ConferenceMemberRepository, FileCommonRepository,
  LinkFileRepository, QuotaRepository, ShareMemberRepository
} from '../../../common/repositories';
import { ChimeMeetingRepository } from '../../../common/repositories/chime-meeting.repository';
import { ConferenceRepository } from '../../../common/repositories/conference.repository';
import { MeetingRepository } from '../../../common/repositories/meeting.repository';
import { buildFailItemResponse } from '../../../common/utils/respond';
import { ChatService } from '../../../modules/chat-realtime/chat-realtime.service';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { ChimeChatService, RealTimeService } from '../../communication/services';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { ConferencingService } from '../conference-channel.service';
import { CallPhoneDTO, RemoveAttendeeDTO } from '../dtos';
import { ChannelCreateDto } from '../dtos/channel.create.dto';
import { LeaveChannelDto } from '../dtos/channel.leave.dto';
import { MoveChannelDto } from '../dtos/channel.move.dto';
import { ChimeDto } from '../dtos/chime.dto';
import { MemberUpdateDto } from '../dtos/member.update.dto';
import { ScheduleDTO } from '../dtos/schedule.dto';
import { fakeConferencing } from './fakeData';



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


const _user: IUser = {
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



const reposMockFactory: () => MockType<ConferenceRepository> = jest.fn(() => ({
  findByObjUid: jest.fn(entity => entity),
  find: jest.fn(entity => entity),
  findOne: jest.fn((id: number) => id),
  findOneBy: jest.fn((id: number) => id),
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
  addJobConference: jest.fn(entity => entity),
}));

describe('ConferencingService', () => {
  let app: INestApplication;
  let service: ConferencingService;
  let conferenceChannelRepo: ConferenceRepository;
  let conferenceMemberRepo: ConferenceMemberRepository;
  let meetingRepository: MeetingRepository;
  let chimeMeetingRepo: ChimeMeetingRepository;
  let deletedItemService: DeletedItemService;
  let chimeService: ChimeChatService;
  let chatService: ChatService;
  let realTimeService: RealTimeService;
  let httpClient: HttpService;
  let eventEmitter: EventEmitter2;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConferencingService,
        DeletedItemService,
        DatabaseUtilitiesService,
        ChimeChatService,
        ChatService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory
        },
        {
          provide: MeetingRepository,
          useFactory: reposMockFactory
        },
        {
          provide: ChimeMeetingRepository,
          useFactory: reposMockFactory
        },
        {
          provide: ConferenceRepository,
          useFactory: reposMockFactory
        },
        {
          provide: ConferenceMemberRepository,
          useFactory: reposMockFactory
        },
        {
          provide: LinkFileRepository,
          useFactory: reposMockFactory,
        },
        {
          provide: QuotaRepository,
          useFactory: reposMockFactory,
        },
        {
          provide: CollectionRepository,
          useFactory: reposMockFactory,
        },
        {
          provide: FileCommonRepository,
          useFactory: reposMockFactory,
        },
        {
          provide: ShareMemberRepository,
          useFactory: reposMockFactory
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory
        },
        {
          provide: HttpService,
          useValue: spyHttpClient
        },
        {
          provide: RealTimeService,
          useFactory: () => ({
            setHeader: jest.fn().mockReturnThis()
          })
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
            emitAsync: jest.fn().mockReturnValue([{ channel: { name: 'aaaa' } }]),
          }
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    deletedItemService = module.get<any>(DeletedItemService);
    service = module.get<ConferencingService>(ConferencingService);
    conferenceChannelRepo = module.get<ConferenceRepository>(ConferenceRepository);
    conferenceMemberRepo = module.get<ConferenceMemberRepository>(ConferenceMemberRepository);
    meetingRepository = module.get(MeetingRepository);
    chimeMeetingRepo = module.get(ChimeMeetingRepository);
    chimeService = module.get<ChimeChatService>(ChimeChatService);
    chatService = module.get<ChatService>(ChatService);
    realTimeService = module.get<RealTimeService>(RealTimeService);
    httpClient = module.get<HttpService>(HttpService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(conferenceChannelRepo).toBeDefined();
    expect(meetingRepository).toBeDefined();
    expect(chimeService).toBeDefined();
  });

  describe('Get Chime information', () => {
    it('should be return data', async () => {
      const req = {
        externalAttendee: 'quangndn@flomail.net',
        joinToken: 'dksajdk3984nejdfefins9enufidsfisuf'
      } as ChimeDto;
      meetingRepository.findOne = jest.fn().mockReturnValue(true);
      const result = await service.validChimeToken(req);
      expect(result.data).toEqual(true);
    });

    it('should be return false message', async () => {
      const req = {
        externalAttendee: 'quangndn@flomail.net',
        joinToken: 'dksajdk3984nejdfefins9enufidsfisuf'
      } as ChimeDto;
      meetingRepository.findOne = jest.fn().mockReturnValue(false);
      const errorFake = new ErrorDTO({
        code: ErrorCode.BAD_REQUEST,
        message: INVALID_REQUEST,
        attributes: req
      })
      const result = await service.validChimeToken(req);
      expect(result.error).toEqual(errorFake);
    });
  });

  describe('Get conferencing', () => {
    it('should be return error', async () => {
      try {
        const req = {
          page_size: 10,
          has_del: 1,
          modified_gte: 1247872251.212,
          modified_lt: 1247872251.212,
          ids: []
        } as BaseGetDTO;
        const user: IUser = {
          userId: 1,
          id: 1,
          email: 'tester001@flomail.net',
          appId: '',
          deviceUid: '',
          userAgent: '',
          token: '',
        };
        deletedItemService.findAll = jest.fn().mockReturnValue([]);
        conferenceChannelRepo.listOfConference = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.getAllChannels(req, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be get conferencing', async () => {
      const req = {
        page_size: 10,
        has_del: 1,
        modified_gte: 1247872251.212,
        modified_lt: 1247872251.212,
        ids: []
      } as BaseGetDTO;
      deletedItemService.findAll = jest.fn().mockReturnValue([]);
      conferenceChannelRepo.listOfConference = jest.fn().mockReturnValue(fakeConferencing);
      conferenceMemberRepo.getListParticipantByChannelId = jest.fn().mockReturnValue([]);
      const result =
        await service.getAllChannels(req, { ...fakeReq, user: _userWeb });
      expect(result.data[0]).toEqual(fakeConferencing[0]);
    });
  });

  describe('Get schedule call', () => {
    it('should be return error', async () => {
      try {
        const req = {
          page_size: 10,
          channel_id: 123
        } as ScheduleDTO;
        chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
        chimeMeetingRepo.getSchedules = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.handleListScheduleCall(req, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return data', async () => {
      try {
        const req = {
          page_size: 10,
          channel_id: 123
        } as ScheduleDTO;
        chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
        chimeMeetingRepo.getSchedules = jest.fn().mockReturnValue(true);
        const rs = await service.handleListScheduleCall(req, fakeReq);
        expect(rs.data).toEqual(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Get conferencing WEB', () => {
    it('should be return error', async () => {
      try {
        const req = {
          page_size: 10,
          has_del: 1,
          modified_gte: 1247872251.212,
          modified_lt: 1247872251.212,
          ids: []
        } as BaseGetDTO;
        deletedItemService.findAll = jest.fn().mockReturnValue([]);
        conferenceChannelRepo.listOfConference = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.getAllChannels(req, { ...fakeReq, user: _userWeb });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be get conferencing', async () => {
      const req = {
        page_size: 10,
        has_del: 1,
        modified_gte: 1247872251.212,
        modified_lt: 1247872251.212,
        collection_ids: [123],
        ids: []
      } as GetConferencePagingDTO;
      deletedItemService.findAll = jest.fn().mockReturnValue([]);
      conferenceMemberRepo.getListParticipantByChannelId = jest.fn().mockReturnValue([]);
      conferenceChannelRepo.listOfConference = jest.fn().mockReturnValue(fakeConferencing);
      const result =
        await service.getAllChannels(req, { ...fakeReq, user: _userWeb });
      expect(result.data[0]).toEqual(fakeConferencing[0]);
    });
  });

  describe('Created conferencing', () => {
    it('should be return invalid conferencing channel', async () => {
      const dtoConferencing: ChannelCreateDto[] = [{
        "title": "test 1",
        "share_title": "test sjare",
        "description": "Discuss about my life",
        "avatar": "/path/to/avatar.png",
        "room_url": "/path/to-the-room-of-my.life",
        "ref": "3700A1BD-REFID",
        enable_chat_history: 1,
        updated_date: Date.now() / 1000,
        created_date: Date.now() / 1000,
        vip: 1
      }];
      conferenceChannelRepo.updateRealtimeChannel = jest.fn().mockReturnValue(dtoConferencing[0]);
      conferenceChannelRepo.insertChannel = jest.fn().mockReturnValue(dtoConferencing[0]);
      const result = await service.createBatchChannel(dtoConferencing, fakeReq);

      expect(result.itemPass[0]).toEqual({
        ...dtoConferencing[0],
        realtime_channel: "aaaa"
      });
    });

    it('should be return error 1', async () => {
      try {
        const dtoConferencing: ChannelCreateDto[] = [{
          "title": "test 1",
          "share_title": "test sjare",
          "description": "Discuss about my life",
          "avatar": "/path/to/avatar.png",
          "room_url": "/path/to-the-room-of-my.life",
          "ref": "3700A1BD-REFID",
          enable_chat_history: 1,
          updated_date: Date.now() / 1000,
          created_date: Date.now() / 1000,
          vip: 1
        }];
        conferenceChannelRepo.insertChannel = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.createBatchChannel(dtoConferencing, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 2', async () => {
      try {
        const dtoConferencing: ChannelCreateDto[] = [{
          "title": "test 1",
          "share_title": "test sjare",
          "description": "Discuss about my life",
          "avatar": "/path/to/avatar.png",
          "room_url": "/path/to-the-room-of-my.life",
          "ref": "3700A1BD-REFID",
          enable_chat_history: 1,
          updated_date: Date.now() / 1000,
          created_date: Date.now() / 1000,
          vip: 1
        }];
        conferenceChannelRepo.insertChannel = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.createBatchChannel(dtoConferencing, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Update conferencing', () => {
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };
    it('should be return invalid conferencing channel', async () => {
      const dtoConferencing: MemberUpdateDto[] = [{
        "id": 1,
        "title": "test 1",
        "share_title": "test sjare",
        "description": "Discuss about my life",
        "avatar": "/path/to/avatar.png",
        enable_chat_history: 1,
        updated_date: Date.now() / 1000,
        room_url: '',
        vip: 0
      }];
      conferenceChannelRepo.updateMember = jest.fn().mockReturnValue(dtoConferencing[0]);
      const result = await service.updateBatchMember(dtoConferencing, fakeReq);
      expect(result.itemPass[0]).toEqual(dtoConferencing[0]);
    });

    it('should be return invalid conferencing channel with creator = 1', async () => {
      const dtoConferencing: MemberUpdateDto[] = [{
        "id": 1,
        "title": "test 1",
        "share_title": "test sjare",
        "description": "Discuss about my life",
        "avatar": "/path/to/avatar.png",
        enable_chat_history: 1,
        updated_date: Date.now() / 1000,
        room_url: '',
        vip: 0
      }];
      conferenceMemberRepo.findOneBy = jest.fn().mockReturnValue({ channel_id: 123, is_creator: 1 });
      conferenceChannelRepo.updateMember = jest.fn().mockReturnValue(dtoConferencing[0]);
      const result = await service.updateBatchMember(dtoConferencing, fakeReq);
      expect(result.itemPass[0]).toEqual(dtoConferencing[0]);
    });

    it('should be return error 1', async () => {
      try {
        const dtoConferencing: MemberUpdateDto[] = [{
          "title": "test 1",
          "share_title": "test sjare",
          "id": 1,
          "description": "Discuss about my life",
          "avatar": "/path/to/avatar.png",
          enable_chat_history: 1,
          updated_date: Date.now() / 1000,
          room_url: '',
          vip: 1

        }];
        conferenceChannelRepo.updateMember = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.updateBatchMember(dtoConferencing, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 2', async () => {
      try {
        const dtoConferencing: MemberUpdateDto[] = [{
          "id": 1,
          "title": "test 1",
          "share_title": "test sjare",
          "description": "Discuss about my life",
          "avatar": "/path/to/avatar.png",
          enable_chat_history: 1,
          updated_date: Date.now() / 1000,
          room_url: '',
          vip: 1
        }];
        conferenceChannelRepo.updateMember = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.updateBatchMember(dtoConferencing, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Delete conferencing', () => {
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };
    it('should be return error', async () => {
      const dtoConferencing: LeaveChannelDto[] = [{
        'id': 1,
      }];
      conferenceChannelRepo.leaveChannel = jest.fn().mockReturnValue(dtoConferencing[0]);
      const result = await service.deleteBatchMember(dtoConferencing, fakeReq);

      expect(result.itemPass[0]).toEqual(dtoConferencing[0]);
    });

    it('should be return error 1', async () => {
      try {
        const dtoConferencing: LeaveChannelDto[] = [{
          id: 1,
          "updated_date": new Date().getTime() / 1000,
        }];
        conferenceChannelRepo.leaveChannel = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.deleteBatchMember(dtoConferencing, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 2', async () => {
      try {
        const dtoConferencing: LeaveChannelDto[] = [{
          id: 1,
          updated_date: Date.now() / 1000
        }];
        conferenceChannelRepo.leaveChannel = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.deleteBatchMember(dtoConferencing, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 3', async () => {
      try {
        const dtoConferencing: LeaveChannelDto[] = [{
          id: 1,
          updated_date: Date.now() / 1000
        },
        {
          id: 1,
          updated_date: Date.now() / 1000
        }];
        conferenceChannelRepo.leaveChannel = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.deleteBatchMember(dtoConferencing, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should not send last modify', async () => {
      try {
        const dtoConferencing: LeaveChannelDto[] = [];
        conferenceChannelRepo.leaveChannel = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.deleteBatchMember(dtoConferencing, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Check channel exist', () => {
    const channel = {
      participants: [
        { email: "abc@flomail.net" },
        { email: "xyz@flomail.net" },
        { email: "asd@flomail.net" }
      ]
    };
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };

    it('should return the correct response for a successful channel check', async () => {

      const expectedResponse = { ...channel, ...fakeConferencing[0] };

      conferenceChannelRepo.checkChannel = jest.fn().mockReturnValue(expectedResponse);

      const result = await service.checkChannel(channel, fakeReq);
      expect(result).toEqual({
        itemPass: [expectedResponse],
        itemFail: []
      });
    });

    it('should internal error', async () => {
      try {
        conferenceChannelRepo.checkChannel = jest.fn().mockImplementationOnce(() => {
          throw Error;
        });
        await service.checkChannel(channel, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should return the correct response for a failed channel check', async () => {

      conferenceChannelRepo.checkChannel = jest.fn().mockReturnValue({
        error: INVALID_REQUEST
      });

      const result = await service
        .checkChannel(channel, fakeReq);

      expect(result).toEqual({
        itemPass: [],
        itemFail: [buildFailItemResponse(ErrorCode.BAD_REQUEST,
          INVALID_REQUEST, channel)]
      });
    });
  });

  describe('Move conference channel', () => {
    const link = {
      "id": 4238455,
      "collection_id": 4300731,
      "object_uid": "ea673bfb-b9d3-4c97-818d-d3216578f826",
      "object_type": "CONFERENCING",
      "account_id": 0,
      "object_href": "",
      "is_trashed": 0,
      "created_date": 1701156020.369,
      "updated_date": 1701156020.369,
      "email_time": 0
    }
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };
    const moveDto: MoveChannelDto[] = [{
      collection_id: 1123,
      channel_uid: "ea673bfb-b9d3-4c97-818d-d3216578f826"
    }];
    it('should be moved', async () => {
      conferenceChannelRepo.moveChannel = jest.fn().mockReturnValue(link);
      const result = await service.moveBatchChannel(moveDto, fakeReq);
      expect(result.itemPass[0]).toEqual(link);
    });

    it('should be return error 1', async () => {
      try {
        conferenceChannelRepo.moveChannel = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.moveBatchChannel(moveDto, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 2', async () => {
      try {
        conferenceChannelRepo.moveChannel = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.moveBatchChannel(moveDto, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 3', async () => {
      try {
        conferenceChannelRepo.moveChannel = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.moveBatchChannel(moveDto, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should not send last modify', async () => {
      try {
        const moveDto: MoveChannelDto[] = [];
        conferenceChannelRepo.moveChannel = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.moveBatchChannel(moveDto, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should error duplicate payload', async () => {
      try {
        const moveDto: MoveChannelDto[] = [{
          collection_id: 1123,
          channel_uid: "ea673bfb-b9d3-4c97-818d-d3216578f826"
        }, {
          collection_id: 1123,
          channel_uid: "ea673bfb-b9d3-4c97-818d-d3216578f826"
        }];
        conferenceChannelRepo.moveChannel = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.moveBatchChannel(moveDto, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Call phone', () => {
    const link = {
      "meeting_id": "ec132e0d-858c-4c04-adeb-032d0b450706",
      "phone_number": "+8490909090",
      "attendee_id": "f2b16c84-64cc-d91d-9fbc-744d65b802bb"
    }
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };
    const callMobileDto: CallPhoneDTO[] = [
      {
        "phone_number": "+8490909090",
        "meeting_id": "ec132e0d-858c-4c04-adeb-032d0b450706",
      },
      {
        "phone_number": "+8490909090",
        "meeting_id": "ec132e0d-858c-4c04-adeb-032d0b450706",
      }];
    it('should be call success', async () => {
      chimeService.callMobile = jest.fn().mockReturnValue({
        data: {
          attendee: {
            Attendee: {
              AttendeeId: link.attendee_id
            }
          }
        }
      });
      const result
        = await service.callPhone(callMobileDto, fakeReq);
      expect(result.itemPass[0]).toEqual(link);
    });

    it('should be return error 1', async () => {
      try {
        chimeService.callMobile = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.callPhone(callMobileDto, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 2', async () => {
      try {
        chimeService.callMobile = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.callPhone(callMobileDto, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Remove attendee', () => {
    const link = {
      "meeting_id": "ec132e0d-858c-4c04-adeb-032d0b450706",
      "attendee_id": "f2b16c84-64cc-d91d-9fbc-744d65b802bb"
    }
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };
    const removeAttendee: RemoveAttendeeDTO[] = [
      {
        "attendee_id": "f2b16c84-64cc-d91d-9fbc-744d65b802bb",
        "meeting_id": "ec132e0d-858c-4c04-adeb-032d0b450706",
      },
      {
        "attendee_id": "f2b16c84-64cc-d91d-9fbc-744d65b802bb",
        "meeting_id": "ec132e0d-858c-4c04-adeb-032d0b450706",
      }];

    it('should be remove success', async () => {
      chimeService.removeAttendee = jest.fn().mockReturnValue({
        data: {
          affected: 1
        }
      });
      const result
        = await service.removeAttendee(removeAttendee, fakeReq);
      expect(result.itemPass[0]).toEqual(link);
    });

    it('should be return error 1', async () => {
      try {
        chimeService.removeAttendee = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.removeAttendee(removeAttendee, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 2', async () => {
      try {
        chimeService.removeAttendee = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.removeAttendee(removeAttendee, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
