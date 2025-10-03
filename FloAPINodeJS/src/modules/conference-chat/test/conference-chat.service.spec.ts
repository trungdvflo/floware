import { HttpService } from '@nestjs/axios';
import { BadRequestException, INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { DELETED_ITEM_TYPE } from '../../../common/constants/common';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_ERR_DUPLICATE_ENTRY, MSG_ERR_NOT_EXIST, MSG_ERR_WHEN_CREATE, MSG_FILE_NOT_EXIST, MSG_INVALID_CHANNEL_ID } from '../../../common/constants/message.constant';
import { TypeOrmErrorCode } from '../../../common/constants/typeorm-code';
import { BaseGetDTO } from '../../../common/dtos/base-get.dto';
import { IUser } from '../../../common/interfaces';
import { LoggerService } from '../../../common/logger/logger.service';
import { CollectionRepository, ConferenceRepository, ShareMemberRepository } from '../../../common/repositories';
import { ConferenceMemberRepository } from '../../../common/repositories/conference-member.repository';
import { ConferenceChatRepository } from '../../../common/repositories/conferencing-chat.repository';
import { FileCommonRepository } from '../../../common/repositories/file-common.repository';
import { LinkFileRepository } from '../../../common/repositories/link-file-common.repository';
import { QuotaRepository } from '../../../common/repositories/quota.repository';
import { ChatService } from '../../../modules/chat-realtime/chat-realtime.service';
import { ChannelTypeNumber } from '../../../modules/communication/interfaces/real-time.interface';
import { ChimeChatService, RealTimeService } from '../../../modules/communication/services';
import { DatabaseUtilitiesService } from '../../../modules/database/database-utilities.service';
import { DeletedItemService } from '../../../modules/deleted-item/deleted-item.service';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { ConferenceChatService } from '../conference-chat.service';
import { ListMessageIntDTO } from '../dtos/chatting-int-message.post.dto';
import { DeleteMessageIntDTO } from '../dtos/chatting-int.delete.dto';
import { EditMessageIntDTO, UpdateConferenceChatDTO } from '../dtos/conference-chat.put.dto';
import { LinkFileDTO } from '../dtos/createLinkFile.dto';
import { DeleteFileDTO } from '../dtos/delete.dto';
import { GetDownloadDto } from '../dtos/download.get.dto';
import { CreateFileDTO } from '../dtos/upload.create.dto';


jest.mock('@nestjs/axios', () => ({
  HttpModule: jest.fn(),
  HttpService: jest.fn(),
}));

const spyHttpClient = {
  axiosRef: {
    get: jest.fn().mockReturnValue({
      data: { data: [] }
    })
  }
};

const createQueryBuilder = {
  select: jest.fn(() => createQueryBuilder),
  addSelect: jest.fn(() => createQueryBuilder),
  leftJoin: jest.fn(() => createQueryBuilder),
  innerJoin: jest.fn(() => createQueryBuilder),
  where: jest.fn(() => createQueryBuilder),
  andWhere: jest.fn(() => createQueryBuilder),
  execute: jest.fn(() => createQueryBuilder),
  limit: jest.fn(() => createQueryBuilder),
  getMany: jest.fn(() => createQueryBuilder),
};
const repoMockFactory = jest.fn(() => ({
  changeQuotaFileCommon: jest.fn((entity) => entity),
  create: jest.fn((entity) => entity),
  save: jest.fn((entity) => entity),
  filterMessage: jest.fn(entity => entity),
  updateComment: jest.fn(entity => entity),
  generateDeletedItemForShared: jest.fn(entity => entity),
  createQueryBuilder: jest.fn(() => createQueryBuilder),
  FindOptionsWhere: jest.fn((entity) => entity),
}));

const repoMockShareMemberFactory = jest.fn(() => ({
  getPermissionMember: jest.fn((entity) => entity),
  create: jest.fn((entity) => entity),
  save: jest.fn((entity) => entity),
}));

const deletedItemServiceMockFactory: () => MockType<DeletedItemService> = jest.fn(() => ({
  findAll: jest.fn((e) => e),
  batchCreate: jest.fn((e) => e),
}));

const apiLastModifiedServiceMockFactory: () =>
  MockType<ApiLastModifiedQueueService> = jest.fn(() => ({}));

describe('ConferenceChatService', () => {
  let app: INestApplication;
  let service: ConferenceChatService;
  let chatService: ChatService;
  let realTimeService: RealTimeService;
  let deletedItemService: MockType<DeletedItemService>;
  let loggerService: LoggerService;
  let fileRepo: FileCommonRepository;
  let conferencingMemberRepo: ConferenceMemberRepository;
  let shareMemberRepo: ShareMemberRepository;
  let conferenceChatRepo: ConferenceChatRepository;
  let linkFileRepo: LinkFileRepository;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let chimeService: ChimeChatService;
  let httpClient: HttpService;
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
        ConferenceChatService,
        LoggerService,
        DatabaseUtilitiesService,
        ChimeChatService,
        {
          provide: FileCommonRepository,
          useFactory: repoMockFactory,
        },
        {
          provide: ShareMemberRepository,
          useFactory: repoMockShareMemberFactory,
        },
        {
          provide: ConferenceChatRepository,
          useFactory: repoMockFactory,
        },
        {
          provide: DeletedItemService,
          useFactory: deletedItemServiceMockFactory,
        },
        {
          provide: LinkFileRepository,
          useFactory: repoMockFactory,
        },
        {
          provide: QuotaRepository,
          useFactory: repoMockFactory,
        },
        {
          provide: ConferenceMemberRepository,
          useFactory: repoMockFactory,
        },
        {
          provide: CollectionRepository,
          useFactory: repoMockFactory,
        },
        {
          provide: ConferenceRepository,
          useFactory: repoMockFactory,
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory,
          useValue: {
            addJob: jest.fn((e) => e),
            addJobCollection: jest.fn((e) => e),
            sendLastModifiedByCollectionId: jest.fn(entity => entity),
          },
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
        ChatService,
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

    service = module.get<ConferenceChatService>(ConferenceChatService);
    chatService = module.get<ChatService>(ChatService);
    realTimeService = module.get<RealTimeService>(RealTimeService);
    fileRepo = module.get(FileCommonRepository);
    linkFileRepo = module.get(LinkFileRepository);
    conferenceChatRepo = module.get(ConferenceChatRepository);
    conferencingMemberRepo = module.get(ConferenceMemberRepository);
    shareMemberRepo = module.get(ShareMemberRepository);
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    databaseUtilitiesService = module.get<any>(DatabaseUtilitiesService);
    deletedItemService = module.get(DeletedItemService);
    loggerService = module.get<any>(LoggerService);
    chimeService = module.get<ChimeChatService>(ChimeChatService);
    httpClient = module.get<HttpService>(HttpService);
    loggerService.logError = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(fileRepo).toBeDefined();
    expect(linkFileRepo).toBeDefined();
    expect(conferenceChatRepo).toBeDefined();
    expect(conferencingMemberRepo).toBeDefined();
    expect(apiLastModifiedQueueService).toBeDefined();
  });

  describe('Get Chime information', () => {
    const params: ListMessageIntDTO = {
      internal_channel_id: 9381101,
      max_results: 10,
      internal_channel_type: 1,
      sort_order: "ASC",
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
    it('should be return conferenceNotExist', async () => {
      conferencingMemberRepo.checkConferenceWithEmail = jest.fn().mockReturnValue(false);
      const result = await service.getListMessagesChannel(params, fakeReq);
      expect(result.error.code).toEqual(ErrorCode.BAD_REQUEST);
    });

    it('should be return list of messages', async () => {
      const confExisted = {
        channel_id: 938110,
        revoke_time: 0,
        id: 1486746,
        view_chat_history: 0,
        join_time: 1702636079.07,
        enable_chat_history: 0,
        user_id: 126992,
        created_date: 1702635406.882
      }
      conferencingMemberRepo.checkConferenceWithEmail = jest.fn().mockReturnValue(confExisted);
      const result = await service.getListMessagesChannel(params, fakeReq);
      expect(result.data).toEqual([]);
    });

    // it('should be return false message', async () => {
    //   const req = {
    //     externalAttendee: 'quangndn@flomail.net',
    //     joinToken: 'dksajdk3984nejdfefins9enufidsfisuf'
    //   } as ChimeDto;
    //   meetingRepository.findOne = jest.fn().mockReturnValue(false);
    //   const errorFake = new ErrorDTO({
    //     code: ErrorCode.BAD_REQUEST,
    //     message: INVALID_REQUEST,
    //     attributes: req
    //   })
    //   const result = await service.getListMessagesChannel(req);
    //   expect(result.error).toEqual(errorFake);
    // });
  });

  describe('Sync data', () => {
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };

    it('should call channelMemberExisted', async () => {
      conferencingMemberRepo.findOne = jest.fn().mockReturnValue(true);
      await service.channelMemberExisted(1, 1);
    });

    it('should get conference chat', async () => {
      const filter = {
        page_size: 10,
        has_del: 1,
        modified_gte: 1247872251.212,
        modified_lt: 1247872251.212,
        ids: []
      } as BaseGetDTO;

      databaseUtilitiesService.getAll = jest.fn().mockReturnValue([]);
      deletedItemService.findAll = jest.fn().mockReturnValue([]);
      const result = await service.getAllItems(filter, fakeReq);
      expect(databaseUtilitiesService.getAll).toBeCalledTimes(1);
      expect(deletedItemService.findAll).toHaveBeenCalledWith(user.userId, DELETED_ITEM_TYPE.CONFERENCE_CHAT, {
        modified_gte: filter.modified_gte,
        modified_lt: filter.modified_lt,
        ids: filter.ids,
        page_size: filter.page_size
      });

      expect(result).toMatchObject({
        data: [],
        data_del: []
      });
    });
  });

  describe('Create conference chat', () => {
    const param = new GetDownloadDto();
    param.channel_id = 12;
    param.file_uid = '123';
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };
    const dataNoMessage: LinkFileDTO[] = [{
      "channel_id": 500461,
      "message_uid": "hjl@flouat.net",
      "message_text": "hi",
      "file_common_id": 123,
      "message_type": 0
    }];
    const data: LinkFileDTO[] = [{
      "channel_id": 500461,
      "message_uid": "hjl@flouat.net",
      "message_text": "hi",
      "file_common_id": 123,
      "message_type": 1
    }];

    it('should be QUERY error when create dubplicate', async () => {
      service.channelMemberExisted = jest.fn().mockResolvedValueOnce(true);
      conferencingMemberRepo.getInfoMember = jest.fn().mockResolvedValueOnce(true);
      fileRepo.findOne = jest.fn().mockResolvedValueOnce(true);
      conferenceChatRepo.save = jest.fn().mockResolvedValue(() => {
        throw new QueryFailedError(TypeOrmErrorCode.ER_DUP_ENTRY, undefined, new Error());
      });
      const result = await service.createConferenceChat(data, fakeReq);
    });

    it('should throw error', async () => {
      service.channelMemberExisted = jest.fn().mockResolvedValueOnce(true);
      conferencingMemberRepo.getInfoMember = jest.fn().mockResolvedValueOnce(true);
      fileRepo.findOne = jest.fn().mockResolvedValueOnce(true);
      conferenceChatRepo.save = jest.fn().mockImplementationOnce(() => {
        throw Error;
      })
      const result = await service.createConferenceChat(data, fakeReq);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_WHEN_CREATE);
    });

    it('should create with channel id not found', async () => {
      service.channelMemberExisted = jest.fn().mockResolvedValueOnce(false);
      const result = await service.createConferenceChat(data, fakeReq);
      expect(result.itemFail).toHaveLength(1);
      expect(result.itemFail[0].message).toEqual(MSG_INVALID_CHANNEL_ID);
    });

    it('should create with error getInfoMember', async () => {
      service.channelMemberExisted = jest.fn().mockResolvedValueOnce(true);
      conferencingMemberRepo.getInfoMember = jest.fn().mockResolvedValueOnce(false);
      const result = await service.createConferenceChat(data, fakeReq);
      expect(result.itemFail).toHaveLength(1);
      expect(result.itemFail[0].message).toEqual(MSG_INVALID_CHANNEL_ID);
    });

    it('should create with file id does not exist', async () => {
      service.channelMemberExisted = jest.fn().mockResolvedValueOnce(true);
      conferencingMemberRepo.getInfoMember = jest.fn().mockResolvedValueOnce(true);
      fileRepo.findOne = jest.fn().mockResolvedValueOnce(false);
      const result = await service.createConferenceChat(data, fakeReq);
      expect(result.itemFail[0].message).toEqual(MSG_FILE_NOT_EXIST);
    });

    it('should create success', async () => {
      service.channelMemberExisted = jest.fn().mockResolvedValueOnce(true);
      conferencingMemberRepo.getInfoMember = jest.fn().mockResolvedValueOnce(true);
      fileRepo.findOne = jest.fn().mockResolvedValueOnce(true);
      conferenceChatRepo.save = jest.fn().mockResolvedValueOnce(true);
      linkFileRepo.save = jest.fn().mockResolvedValueOnce(true);
      const result = await service.createConferenceChat(data, fakeReq);
      expect(result.itemPass[0]).toEqual(true);
    });

    it('should create success with no message', async () => {
      service.channelMemberExisted = jest.fn().mockResolvedValueOnce(true);
      conferencingMemberRepo.getInfoMember = jest.fn().mockResolvedValueOnce(true);
      fileRepo.findOne = jest.fn().mockResolvedValueOnce(true);
      conferenceChatRepo.save = jest.fn().mockResolvedValueOnce(true);
      linkFileRepo.save = jest.fn().mockResolvedValueOnce(true);
      const result = await service.createConferenceChat(dataNoMessage, fakeReq);
      expect(result.itemPass[0]).toEqual(true);
    });

  });

  describe('Update conference chat', () => {
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };

    const data: UpdateConferenceChatDTO[] = [{
      id: 1,
      message_text: 'hello from Quang'
    }];

    it('should throw error', async () => {
      conferenceChatRepo.findOne = jest.fn().mockResolvedValueOnce(true);
      conferenceChatRepo.update = jest.fn().mockImplementationOnce(() => {
        throw Error;
      })
      const result = await service.update(data, fakeReq);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
    });

    it('should The item does not exist', async () => {
      const data: UpdateConferenceChatDTO[] = [{
        id: 1,
        message_text: 'hello from Quang'
      }];

      conferenceChatRepo.findOne = jest.fn().mockReturnValue(false);
      const result = await service.update(data, fakeReq);
      expect(result.itemFail[0]['message']).toEqual(MSG_ERR_NOT_EXIST);
    });

    it('should update', async () => {
      conferenceChatRepo.findOne = jest.fn().mockReturnValue(true);
      conferenceChatRepo.update = jest.fn().mockReturnValue(true);

      const result = await service.update(data, fakeReq);
      expect(result.itemPass[0].message_text).toEqual(data[0].message_text);
    });
  });

  describe('get download', () => {
    const param: GetDownloadDto = {
      channel_id: 1,
      channel_type: ChannelTypeNumber.CONFERENCE,
      file_uid: "123"
    }
    it('should show channel id not found', async () => {
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      const result = await service.download(param, fakeReq);
      expect(result.code).toEqual(ErrorCode.BAD_REQUEST);
    });

    it('should Message uid is invalid.', async () => {
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      linkFileRepo.getFileByFileIDAndChannelId = jest.fn().mockResolvedValue(false);

      const result = await service.download(param, fakeReq);
      expect(result.message).toEqual(MSG_FILE_NOT_EXIST);
    });

    it('should get download error FILE_NOT_FOUND', async () => {
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      linkFileRepo.getFileByFileIDAndChannelId = jest.fn().mockResolvedValue(false);
      service['s3Util'].GenSource = jest.fn().mockResolvedValue("source");
      service['s3Util'].FileExist = jest.fn().mockResolvedValue(false);

      const result = await service.download(param, fakeReq);
      expect(result.code).toEqual(ErrorCode.BAD_REQUEST);
    });

    it('should get download success', async () => {
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      linkFileRepo.getFileByFileIDAndChannelId = jest.fn().mockResolvedValue(true);
      service['s3Util'].GenSource = jest.fn().mockResolvedValue("source");
      service['s3Util'].FileExist = jest.fn().mockResolvedValue(true);
      service['s3Util'].DownloadUrl = jest.fn().mockResolvedValue({ url: '' });

      const result = await service.download(param, fakeReq);
      expect(result.code).toEqual(ErrorCode.REQUEST_SUCCESS);
    });
  });


  describe('upload', () => {
    const data: CreateFileDTO = {
      file: 'file content',
      channel_id: 1,
      channel_type: ChannelTypeNumber.CONFERENCE,
      message_uid: 'quang-test'
    }

    it('should upload error The item can not upload', async () => {
      service['s3Util'].uploadFromBuffer = jest.fn().mockResolvedValue(false);

      try {
        const result = await service.fileSingleUpload(data, data.file, 'doc', fakeReq);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });

    it('should upload success', async () => {
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      service['s3Util'].uploadFromBuffer = jest.fn().mockResolvedValue(true);
      fileRepo.create = jest.fn().mockResolvedValue(data);
      fileRepo.save = jest.fn().mockResolvedValue(true);
      const result = await service.fileSingleUpload(data, data.file, 'doc', fakeReq);
      expect(result).toEqual(true);
    });
  });

  describe('delete', () => {
    const data: DeleteFileDTO[] = [{ id: 1 }, { id: 2 }];
    const dataDubplicate: DeleteFileDTO[] = [{ id: 1 }, { id: 2 }, { id: 2 }];
    it('should delete error he item not found', async () => {
      conferenceChatRepo.findOne = jest.fn().mockReturnValue(false);
      const result = await service.deleteConferenceChat(data, fakeReq);
      expect(result.itemFail[0]['message']).toEqual('The item not found');
    });

    it('should delete success', async () => {
      conferenceChatRepo.findOne = jest.fn().mockReturnValue(true);
      const result = await service.deleteConferenceChat(data, fakeReq);
      expect(result.itemFail[0]['message']).toEqual('Delete failed');
    });

    it('should delete success with data duplicate', async () => {
      conferenceChatRepo.findOne = jest.fn().mockReturnValue({
        message_type: 1
      });
      const result = await service.deleteConferenceChat(dataDubplicate, fakeReq);
      expect(result.itemFail[0]['message']).toEqual(MSG_ERR_DUPLICATE_ENTRY);
    });
  });

  describe('update message', () => {
    const data: EditMessageIntDTO[] = [
      {
        internal_channel_id: 1,
        internal_channel_type: 1,
        internal_message_uid: "message-uid 1",
        msg: "change message"
      },
      {
        internal_channel_id: 1,
        internal_channel_type: 0,
        internal_message_uid: "message-uid",
        msg: "change message"
      },
      {
        internal_channel_id: 1,
        internal_channel_type: 1,
        internal_message_uid: "message-uid",
        msg: "change message"
      }
    ];
    it('should call remove dubplicate function', async () => {
      conferencingMemberRepo.findOne = jest.fn().mockReturnValue(true);
      shareMemberRepo.getPermissionMember = jest.fn().mockReturnValue(false);
      chimeService.batchUpdateMessage = jest.fn().mockReturnValue([]);
      const result = await service.updateMessage(data, fakeReq);
      expect(result.itemFail[0].code).toEqual(ErrorCode.DUPLICATE_ENTRY);
    });
    it('should call update function', async () => {
      conferencingMemberRepo.findOne = jest.fn().mockReturnValue(true);
      shareMemberRepo.getPermissionMember = jest.fn().mockReturnValue(true);
      chimeService.batchUpdateMessage = jest.fn().mockReturnValue([]);
      const result = await service.updateMessage(data, fakeReq);
      expect(result.itemPass).toEqual([]);
    });
  });

  describe('delete message', () => {
    const data: DeleteMessageIntDTO[] = [
      {
        internal_channel_id: 1,
        internal_channel_type: 1,
        internal_message_uid: "message-uid 1",
      },
      {
        internal_channel_id: 1,
        internal_channel_type: 0,
        internal_message_uid: "message-uid",
      },
      {
        internal_channel_id: 1,
        internal_channel_type: 1,
        internal_message_uid: "message-uid",
      }
    ];

    it('should call remove dubplicate function', async () => {
      conferencingMemberRepo.findOne = jest.fn().mockReturnValue(true);
      shareMemberRepo.getPermissionMember = jest.fn().mockReturnValue(false);
      chimeService.batchDeleteMessage = jest.fn().mockReturnValue([]);
      const result = await service.deleteMessage(data, fakeReq);
      expect(result.itemFail[0].code).toEqual(ErrorCode.DUPLICATE_ENTRY);
    });
    it('should call delete function', async () => {
      conferencingMemberRepo.findOne = jest.fn().mockReturnValue(true);
      shareMemberRepo.getPermissionMember = jest.fn().mockReturnValue(true);
      chimeService.batchDeleteMessage = jest.fn().mockReturnValue([]);
      const result = await service.deleteMessage(data, fakeReq);
      expect(result.itemPass).toEqual([]);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});