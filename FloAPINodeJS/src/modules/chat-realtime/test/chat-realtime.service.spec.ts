import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as jimp from 'jimp';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_ERR_DOWNLOAD, MSG_ERR_UPLOAD, MSG_FILE_NOT_EXIST } from '../../../common/constants/message.constant';
import {
  CollectionRepository,
  ConferenceMemberRepository,
  ConferenceRepository,
  FileCommonRepository,
  LinkFileRepository,
  QuotaRepository,
  ShareMemberRepository
} from '../../../common/repositories';
import { ApiLastModifiedQueueService } from '../../../modules/bullmq-queue/api-last-modified-queue.service';
import { ChannelTypeNumber } from '../../communication/interfaces';
import { ChimeChatService, RealTimeService } from '../../communication/services';
import { ChatService } from '../chat-realtime.service';
import {
  ChatDownloadDTO, ChimeFileDTO, GetAttachmentDTO,
  GetChatDTO, GetLastSeenDTO, PostChatDTO, PutChatDTO
} from '../dtos';
jest.mock('aws-sdk', () => {
  return {
    S3: jest.fn(() => ({
      headObject: jest.fn().mockReturnThis(),
      getSignedUrl: jest.fn().mockReturnThis(),
      deleteObject: jest.fn().mockReturnThis(),
      upload: jest.fn().mockReturnThis(),
      getObject: jest.fn().mockReturnThis(),
    }))
  };
});

jest.mock('@nestjs/axios', () => ({
  HttpModule: jest.fn(),
  HttpService: jest.fn(),
}));

const apiLastModifiedServiceMockFactory: (
) => MockType<ApiLastModifiedQueueService> = jest.fn(() => ({
  addJob: jest.fn(entity => entity),
  addJobConference: jest.fn(entity => entity),
}));

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

const repoMockFactory: () => MockType<Repository<any>> = jest.fn(() => ({
  changeQuotaFileCommon: jest.fn((entity) => entity),
  create: jest.fn((entity) => entity),
  update: jest.fn((entity) => entity),
  delete: jest.fn((entity) => entity),
  save: jest.fn((entity) => entity),
  filterMessage: jest.fn(entity => entity),
  updateComment: jest.fn(entity => entity),
  generateDeletedItemForShared: jest.fn(entity => entity),
  createQueryBuilder: jest.fn(() => createQueryBuilder),
  FindOptionsWhere: jest.fn((entity) => entity),
  findOne: jest.fn(entity => entity),
  getFileDownloadByMessageUID: jest.fn(entity => entity),
}));

describe('ChatService', () => {
  let app: INestApplication;
  let chatService: ChatService;
  let realTimeService: RealTimeService;
  let chimeChatService: ChimeChatService;
  let linkFileRepo: LinkFileRepository;
  let collectionRepo: CollectionRepository;
  let sharedMemberRepo: ShareMemberRepository;
  let fileRepo: FileCommonRepository;
  let conferenceMemberRepo: ConferenceMemberRepository;

  beforeEach(async () => {
    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtService,
          useFactory: () => ({
            signAsync: jest.fn().mockResolvedValue('jwt token')
          })
        },
        {
          provide: HttpService,
          useFactory: () => ({
            post: jest.fn().mockResolvedValue({ data: {} }),
            get: jest.fn().mockResolvedValue({ data: {} }),
            delete: jest.fn().mockResolvedValue({ data: {} }),
            put: jest.fn().mockResolvedValue({ data: {} }),
          })
        },
        {
          provide: FileCommonRepository,
          useFactory: repoMockFactory,
        },
        {
          provide: RealTimeService,
          useFactory: () => ({
            setHeader: jest.fn().mockReturnThis()
          })
        },
        {
          provide: ChimeChatService,
          useFactory: () => ({
            setHeader: jest.fn().mockReturnThis()
          })
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory
        },
        {
          provide: jimp,
          useFactory: () => ({
            resize: jest.fn(
              () => ({
                getBufferAsync: jest.fn()
              })
            ),
          }),
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
          provide: ConferenceRepository,
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
          provide: ShareMemberRepository,
          useFactory: repoMockFactory
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
    chatService = module.get<ChatService>(ChatService);
    realTimeService = module.get<RealTimeService>(RealTimeService);
    chimeChatService = module.get<ChimeChatService>(ChimeChatService);
    linkFileRepo = module.get<LinkFileRepository>(LinkFileRepository);
    conferenceMemberRepo = module.get(ConferenceMemberRepository);

    collectionRepo = module.get<CollectionRepository>(CollectionRepository);
    sharedMemberRepo = module.get<ShareMemberRepository>(ShareMemberRepository);
    fileRepo = module.get(FileCommonRepository);
  });

  it('should be defined', () => {
    expect(chatService).toBeDefined();
    expect(realTimeService).toBeDefined();
    expect(chimeChatService).toBeDefined();
    expect(linkFileRepo).toBeDefined();
    expect(conferenceMemberRepo).toBeDefined();
    expect(collectionRepo).toBeDefined();
  });

  describe("sendChatMessage", () => {
    it('Conference: should send a normal chat message', async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {
          timestamp: +new Date(),
          attachments: []
        },
        message_text: "Hello, world!",
      };

      const mockData = {
        data: {
          "channel": "COLLECTION_4511671",
          "status": true
        }
      };
      chimeChatService.sendChatMessage = jest.fn().mockImplementation();
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValue({ id: 123, revoke_time: 0, view_chat_history: 1 });

      const rs = await chatService.sendChatMessage(fakeChat, fakeReq);

      expect(chimeChatService.sendChatMessage).not.toBeCalled();
      jest.runAllTimers();
      expect(chimeChatService.sendChatMessage).toHaveBeenCalledTimes(1);
      expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
        fakeChat.channel_id,
        chatService.getChannelTypeFromNumber(fakeChat.channel_type),
        fakeChat.metadata,
        fakeChat.message_text,
        fakeChat.parent_uid,
        fakeChat.marked
      );
    });

    it('Conference: should send a replied chat message', async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {
          timestamp: +new Date(),
          attachments: [],
        },
        message_text: 'Hello, world!',
        parent_uid: '456',
      };

      const mockData = {
        data: {
          channel: 'COLLECTION_4511671',
          status: true,
        },
      };
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      realTimeService.getChatMessage = jest.fn().mockResolvedValue({
        data: {
          status: 1,
          created_date: 123,
          updated_date: 123,
          deleted_date: 0,
        }
      });

      conferenceMemberRepo.findOne = jest
        .fn()
        .mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      const rs = await chatService.sendChatMessage(fakeChat, fakeReq);

      expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
        fakeChat.channel_id,
        chatService.getChannelTypeFromNumber(fakeChat.channel_type),
        fakeChat.metadata,
        fakeChat.message_text,
        fakeChat.parent_uid,
        fakeChat.marked,
      );
    });

    it('Conference: should send a quote chat message', async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {
          timestamp: +new Date(),
          attachments: [],
        },
        message_text: 'Hello, world!',
        marked: {
          content_marked: 'This is content which was marked',
          message_uid: '456',
        },
      };

      const mockData = {
        data: {
          channel: 'COLLECTION_4511671',
          status: true,
        },
      };
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      realTimeService.getChatMessage = jest.fn().mockResolvedValue({
        data: {
          status: 1,
          created_date: 123,
          updated_date: 123,
          deleted_date: 0,
        }
      });
      conferenceMemberRepo.findOne = jest
        .fn()
        .mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      const rs = await chatService.sendChatMessage(fakeChat, fakeReq);

      expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
        fakeChat.channel_id,
        chatService.getChannelTypeFromNumber(fakeChat.channel_type),
        fakeChat.metadata,
        fakeChat.message_text,
        fakeChat.parent_uid,
        fakeChat.marked,
      );
    });

    it('Conference: should send a forward chat message', async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {
          timestamp: +new Date(),
          attachments: [],
        },
        message_text: '',
        marked: {
          content_marked: 'This is content which was marked',
          message_uid: '456',
        },
      };

      const mockData = {
        data: {
          channel: 'COLLECTION_4511671',
          status: true,
        },
      };
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      realTimeService.getChatMessage = jest.fn().mockResolvedValue({
        data: {
          status: 1,
          created_date: 123,
          updated_date: 123,
          deleted_date: 0,
        }
      });
      conferenceMemberRepo.findOne = jest
        .fn()
        .mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      const rs = await chatService.sendChatMessage(fakeChat, fakeReq);


      expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
        fakeChat.channel_id,
        chatService.getChannelTypeFromNumber(fakeChat.channel_type),
        fakeChat.metadata,
        fakeChat.message_text,
        fakeChat.parent_uid,
        fakeChat.marked,
      );
    });

    it("Conference: shouldn't send a chat message with error [400] from realtime service", async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {
          timestamp: +new Date(),
          attachments: []
        },
        message_text: "Hello, world!"
      };

      const mockData = {
        data: {
          channel: 'COLLECTION_4511671',
          status: false,
        },
        error: {
          statusCode: 400,
        },
      };
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      try {
        const rs = await chatService.sendChatMessage(fakeChat, fakeReq);
      } catch (e) {
        expect(e).toBeDefined();
      }
      expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
        fakeChat.channel_id,
        chatService.getChannelTypeFromNumber(fakeChat.channel_type),
        fakeChat.metadata,
        fakeChat.message_text,
        fakeChat.parent_uid,
        fakeChat.marked
      );
    });

    it("Conference: shouldn't send a chat message with error [404] from realtime service", async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {
          timestamp: +new Date(),
          attachments: []
        },
        message_text: "Hello, world!"
      };

      const mockData = {
        data: {
          channel: 'COLLECTION_4511671',
          status: false,
        },
        error: {
          statusCode: 404,
        },
      };
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      try {
        const rs = await chatService.sendChatMessage(fakeChat, fakeReq);
      } catch (e) {
        expect(e).toBeDefined();
      }
      expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
        fakeChat.channel_id,
        chatService.getChannelTypeFromNumber(fakeChat.channel_type),
        fakeChat.metadata,
        fakeChat.message_text,
        fakeChat.parent_uid,
        fakeChat.marked
      );
    });

    it('Conference: should send a chat message with attachment', async () => {
      linkFileRepo.getFileByFileID = jest.fn().mockImplementation((fileId: number) => ({
        s3Path: '/path',
        uid: '123981er-dsf-as-wr--asdfk',
        dir: '/dir',
        ext: 'png',
      }));
      chatService['s3Util'].GenSource = jest.fn().mockResolvedValue("source");
      chatService['s3Util'].DownloadUrl = jest.fn().mockResolvedValue({ url: '' });
      chatService['s3Util'].FileExist = jest.fn().mockResolvedValue('/path/to/file');
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0 });

      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {
          timestamp: +new Date(),
          attachments: [{
            name: "filename",
            size: 700000,
            file_uid: "123"
          }]
        },
        message_text: "Hello, world!"
      };

      const mockData = {
        data: {
          "channel": "COLLECTION_4511671",
          "status": true
        }
      };
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      const rs = await chatService.sendChatMessage(fakeChat, fakeReq);
      expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
        fakeChat.channel_id,
        chatService.getChannelTypeFromNumber(fakeChat.channel_type),
        fakeChat.metadata,
        fakeChat.message_text,
        fakeChat.parent_uid,
        fakeChat.marked
      );

    });

    it('Conference: should send a chat message with mention', async () => {
      linkFileRepo.getFileByFileID = jest.fn().mockImplementation((fileId: number) => ({
        s3Path: '/path',
        uid: '123981er-dsf-as-wr--asdfk',
        dir: '/dir',
        ext: 'png',
      }));
      chatService['s3Util'].GenSource = jest.fn().mockResolvedValue("source");
      chatService['s3Util'].DownloadUrl = jest.fn().mockResolvedValue({ url: '' });
      chatService['s3Util'].FileExist = jest.fn().mockResolvedValue('/path/to/file');
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0 });

      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {
          timestamp: +new Date(),
          mentions: [{
            email: 'abc@flodev.net'
          }]
        },
        message_text: "Hello, world!"
      };

      const mockData = {
        data: {
          "channel": "COLLECTION_4511671",
          "status": true
        }
      };
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      const rs = await chatService.sendChatMessage(fakeChat, fakeReq);

      expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
        fakeChat.channel_id,
        chatService.getChannelTypeFromNumber(fakeChat.channel_type),
        fakeChat.metadata,
        fakeChat.message_text,
        fakeChat.parent_uid,
        fakeChat.marked
      );
    });

    it("Conference: shouldn't send a chat replied chat message 1", async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {},
        message_text: "Hello, world!",
        parent_uid: '123',
      };

      const mockData = {
        data: {
          channel: 'COLLECTION_4511671',
          status: false,
        },
        error: {
          statusCode: 400,
        },
      };
      realTimeService.getChatMessage = jest.fn().mockResolvedValue({
        data: {
          status: 0,
          created_date: 123,
          updated_date: 123,
          deleted_date: 0,
        }
      });
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      
      try {
        const rs = await chatService.sendChatMessage(fakeChat, fakeReq);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it("Conference: shouldn't send a chat replied chat message 2", async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {},
        message_text: "Hello, world!",
        parent_uid: '123',
      };

      const mockData = {
        data: {
          channel: 'COLLECTION_4511671',
          status: false,
        },
        error: {
          statusCode: 400,
        },
      };
      realTimeService.getChatMessage = jest.fn().mockResolvedValue({
        data: {
          status: 1,
          created_date: 123,
          updated_date: 123,
          deleted_date: 456,
        }
      });
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      
      try {
        const rs = await chatService.sendChatMessage(fakeChat, fakeReq);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it("Conference: shouldn't send a chat replied chat message 3", async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {},
        message_text: "Hello, world!",
        parent_uid: '9999',
      };

      const mockData = {
        data: {
          channel: 'COLLECTION_4511671',
          status: false,
        },
        error: {
          statusCode: 400,
        },
      };
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValue({
        id: 123,
        revoke_time: 0,
        view_chat_history: 0,
        created_date: 456
      });
      realTimeService.getChatMessage = jest.fn().mockResolvedValue({
        data: {
          status: 1,
          created_date: 123,
          updated_date: 123,
          deleted_date: 0,
        }
      });
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      
      try {
        const rs = await chatService.sendChatMessage(fakeChat, fakeReq);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it("Conference: shouldn't send a chat replied chat message 4", async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {},
        message_text: "Hello, world!",
        parent_uid: '9999',
      };

      const mockData = {
        data: {
          channel: 'COLLECTION_4511671',
          status: false,
        },
        error: {
          statusCode: 400,
        },
      };
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValue({
        id: 123,
        revoke_time: 123,
        view_chat_history: 0,
        created_date: 123
      });
      realTimeService.getChatMessage = jest.fn().mockResolvedValue({
        data: {
          status: 1,
          created_date: 456,
          updated_date: 123,
          deleted_date: 0,
        }
      });
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      
      try {
        const rs = await chatService.sendChatMessage(fakeChat, fakeReq);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it('Shared collection: should send a normal chat message', async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 456,
        channel_type: ChannelTypeNumber.SHARED_COLLECTION,
        metadata: {
          timestamp: +new Date(),
          attachments: []
        },
        message_text: "Hello, world!"
      };

      const mockData = {
        data: {
          "channel": "COLLECTION_4511671",
          "status": true
        }
      };
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      collectionRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 456, is_trashed: 0, user_id: 2 });
      sharedMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: fakeReq.user.id });

      const rs = await chatService.sendChatMessage(fakeChat, fakeReq);

      expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
        fakeChat.channel_id,
        chatService.getChannelTypeFromNumber(fakeChat.channel_type),
        fakeChat.metadata,
        fakeChat.message_text,
        fakeChat.parent_uid,
        fakeChat.marked
      );
    });

    it('Shared collection: should send a replied chat message', async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.SHARED_COLLECTION,
        metadata: {
          timestamp: +new Date(),
          attachments: [],
        },
        message_text: 'This is replied message!',
        parent_uid: '456',
      };

      const mockData = {
        data: {
          channel: 'COLLECTION_4511671',
          status: true,
        },
      };
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      realTimeService.getChatMessage = jest.fn().mockResolvedValue({
        data: {
          status: 1,
          created_date: 123,
          updated_date: 123,
          deleted_date: 0,
        }
      });
      collectionRepo.findOne = jest
        .fn()
        .mockResolvedValueOnce({ id: 456, is_trashed: 0, user_id: fakeReq.user.id });
      const rs = await chatService.sendChatMessage(fakeChat, fakeReq);
      expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
        fakeChat.channel_id,
        chatService.getChannelTypeFromNumber(fakeChat.channel_type),
        fakeChat.metadata,
        fakeChat.message_text,
        fakeChat.parent_uid,
        fakeChat.marked,
      );
    });

    it('Shared collection: should send a quote | forward chat message', async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.SHARED_COLLECTION,
        metadata: {
          timestamp: +new Date(),
          attachments: [],
        },
        message_text: 'This is quote | forward message!',
        marked: {
          content_marked: 'This is content which was marked',
          message_uid: '456',
        },
      };

      const mockData = {
        data: {
          channel: 'COLLECTION_4511671',
          status: true,
        },
      };
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      realTimeService.getChatMessage = jest.fn().mockResolvedValue({
        data: {
          status: 1,
          created_date: 123,
          updated_date: 123,
          deleted_date: 0,
        }
      });
      collectionRepo.findOne = jest
        .fn()
        .mockResolvedValueOnce({ id: 456, is_trashed: 0, user_id: fakeReq.user.id });
      const rs = await chatService.sendChatMessage(fakeChat, fakeReq);
      expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
        fakeChat.channel_id,
        chatService.getChannelTypeFromNumber(fakeChat.channel_type),
        fakeChat.metadata,
        fakeChat.message_text,
        fakeChat.parent_uid,
        fakeChat.marked,
      );
    });

    it("Shared collection: should send a chat message with attachment", async () => {
      linkFileRepo.getFileByFileID = jest.fn().mockImplementation((fileId: number) => ({
        s3Path: '/path',
        uid: '123981er-dsf-as-wr--asdfk',
        dir: '/dir',
        ext: 'png',
      }));
      chatService['s3Util'].GenSource = jest.fn().mockResolvedValue("source");
      chatService['s3Util'].DownloadUrl = jest.fn().mockResolvedValue({ url: '' });
      chatService['s3Util'].FileExist = jest.fn().mockResolvedValue('/path/to/file');
      collectionRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 456, is_trashed: 0, user_id: fakeReq.user.id });

      const fakeChat: PostChatDTO = {
        channel_id: 456,
        channel_type: ChannelTypeNumber.SHARED_COLLECTION,
        metadata: {
          timestamp: +new Date(),
          attachments: [{
            file_uid: "123"
          }]
        },
        message_text: "Hello, world!"
      };

      const mockData = {
        data: {
          "channel": "COLLECTION_4511671",
          "status": true
        }
      };
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      const rs = await chatService.sendChatMessage(fakeChat, fakeReq);
      expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
        fakeChat.channel_id,
        chatService.getChannelTypeFromNumber(fakeChat.channel_type),
        fakeChat.metadata,
        fakeChat.message_text,
        fakeChat.parent_uid,
        fakeChat.marked
      );

    });

    it("Shared collection: should send a chat message with mention", async () => {

      linkFileRepo.getFileByFileID = jest.fn().mockImplementation((fileId: number) => ({
        s3Path: '/path',
        uid: '123981er-dsf-as-wr--asdfk',
        dir: '/dir',
        ext: 'png',
      }));
      chatService['s3Util'].GenSource = jest.fn().mockResolvedValue("source");
      chatService['s3Util'].DownloadUrl = jest.fn().mockResolvedValue({ url: '' });
      chatService['s3Util'].FileExist = jest.fn().mockResolvedValue('/path/to/file');
      collectionRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 456, is_trashed: 0, user_id: fakeReq.user.id });


      const fakeChat: PostChatDTO = {
        channel_id: 456,
        channel_type: ChannelTypeNumber.SHARED_COLLECTION,
        metadata: {
          timestamp: +new Date(),
          mentions: [{
            email: 'abc@flodev.net'
          }]
        },
        message_text: "Hello, world!"
      };

      const mockData = {
        data: {
          "channel": "COLLECTION_4511671",
          "status": true
        }
      };
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      const rs = await chatService.sendChatMessage(fakeChat, fakeReq);

      expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
        fakeChat.channel_id,
        chatService.getChannelTypeFromNumber(fakeChat.channel_type),
        fakeChat.metadata,
        fakeChat.message_text,
        fakeChat.parent_uid,
        fakeChat.marked
      );

    });

    it("Should send a chat message with attachment not found", async () => {
      linkFileRepo.getFileByFileID = jest.fn().mockImplementation((fileId: number) => ({
        s3Path: '/path',
        uid: '123981er-dsf-as-wr--asdfk',
        dir: '/dir',
        ext: 'png',
      }));

      chatService['s3Util'].GenSource = jest.fn().mockResolvedValue("source");
      chatService['s3Util'].DownloadUrl = jest.fn().mockResolvedValue({ url: '' });
      chatService['s3Util'].FileExist = jest.fn().mockResolvedValue(false);
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0 });

      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {
          timestamp: +new Date(),
          attachments: [{
            file_uid: "123"
          }]
        },
        message_text: "Hello, world!"
      };

      const mockData = {
        data: {
          "channel": "COLLECTION_4511671",
          "status": true
        }
      };
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      const rs = await chatService.sendChatMessage(fakeChat, fakeReq);

      expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
        fakeChat.channel_id,
        chatService.getChannelTypeFromNumber(fakeChat.channel_type),
        fakeChat.metadata,
        fakeChat.message_text,
        fakeChat.parent_uid,
        fakeChat.marked
      );
    });

    it('Should send chat get an error', async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {
          timestamp: +new Date(),
          attachments: []
        },
        message_text: "Hello, world!"
      };
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });

      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(false);

      try {
        const rs = await chatService.sendChatMessage(fakeChat, fakeReq);
        expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
          fakeChat.channel_id,
          chatService.getChannelTypeFromNumber(fakeChat.channel_type),
          fakeChat.metadata,
          fakeChat.message_text,
          fakeChat.parent_uid,
          fakeChat.marked
        );
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('Should send chat get an error 1', async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        metadata: {
          timestamp: +new Date(),
          attachments: []
        },
        message_text: "Hello, world!"
      };
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0 });

      realTimeService.sendChatMessage = jest.fn().mockImplementation(() => {
        throw new Error();
      })

      try {
        const rs = await chatService.sendChatMessage(fakeChat, fakeReq);
        expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
          fakeChat.channel_id,
          chatService.getChannelTypeFromNumber(fakeChat.channel_type),
          fakeChat.metadata,
          fakeChat.message_text,
          fakeChat.parent_uid,
          fakeChat.marked
        );
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('Should send chat get an error 2', async () => {
      const fakeChat: PostChatDTO = {
        channel_id: 456,
        channel_type: ChannelTypeNumber.SHARED_COLLECTION,
        metadata: {
          timestamp: +new Date(),
          attachments: []
        },
        message_text: "Hello, world!"
      };

      const mockData = {
        data: {
          "channel": "COLLECTION_4511671",
          "status": true
        }
      };
      realTimeService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      chimeChatService.sendChatMessage = jest.fn().mockResolvedValue(mockData);
      collectionRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 456, is_trashed: 0, user_id: 2 });
      sharedMemberRepo.findOne = jest.fn().mockResolvedValueOnce(null)

      try {
        const rs = await chatService.sendChatMessage(fakeChat, fakeReq);
        expect(realTimeService.sendChatMessage).toHaveBeenCalledWith(
          fakeChat.channel_id,
          chatService.getChannelTypeFromNumber(fakeChat.channel_type),
          fakeChat.metadata,
          fakeChat.message_text,
          fakeChat.parent_uid,
          fakeChat.marked
        );
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("getChannelChatMessage", () => {
    it('CONFERENCE: should return chat messages with revoke_time', async () => {
      const mockData = {
        items: [{ message: 'Hello' }, { message: 'World' }],
      };
      const query: GetChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        page_size: 10,
        page_no: 0,
        before_time: 0,
        after_time: 0
      };

      const mockMember = { id: 123, revoke_time: 456 };

      conferenceMemberRepo.findOne = jest.fn().mockResolvedValue(mockMember as never);
      realTimeService.getChannelChatMessage = jest.fn().mockResolvedValueOnce(mockData);
      const remapMessageSpy = jest
        .spyOn(chatService, 'remapMessage')

      await chatService.getChannelChatMessage(query, fakeReq);

      expect(remapMessageSpy).toHaveBeenCalledWith(query.channel_id, query.channel_type);
      expect(realTimeService.getChannelChatMessage).toHaveBeenCalledWith(
        query.channel_id,
        query.parent_uid,
        chatService.getChannelTypeFromNumber(query.channel_type),
        {
          page_size: query.page_size,
          page_no: query.page_no,
          before_sent_time: mockMember.revoke_time,
          after_sent_time: query.after_time,
          sort: query.sort
        },
      );
    });

    it('CONFERENCE: should return chat messages with view_chat_history = 0', async () => {
      const mockData = {
        items: [{ message: 'Hello' }, { message: 'World' }],
      };
      const query: GetChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        page_size: 10,
        page_no: 0,
        before_time: 0,
        after_time: 0,
      };
      const mockMember = { id: 123, revoke_time: 456, view_chat_history: 0, created_date: 789 };

      conferenceMemberRepo.findOne = jest.fn().mockResolvedValue(mockMember as never);
      realTimeService.getChannelChatMessage = jest.fn().mockResolvedValueOnce(mockData);
      const remapMessageSpy = jest
        .spyOn(chatService, 'remapMessage');

      await chatService.getChannelChatMessage(query, fakeReq);

      expect(remapMessageSpy).toHaveBeenCalledWith(query.channel_id, query.channel_type);
      expect(realTimeService.getChannelChatMessage).toHaveBeenCalledWith(
        query.channel_id,
        query.parent_uid,
        chatService.getChannelTypeFromNumber(query.channel_type),
        {
          page_size: query.page_size,
          page_no: query.page_no,
          before_sent_time: mockMember.revoke_time,
          after_sent_time: mockMember.created_date,
          sort: query.sort
        },
      );
    });

    it('CONFERENCE: should return chat messages', async () => {
      const mockData = [{ message: 'Hello' }, { message: 'World' }];
      const query: GetChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        page_size: 10,
        page_no: 0,
        before_time: 0,
        after_time: 0,
      };
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValue({ id: 123, revoke_time: 0 });
      realTimeService.getChannelChatMessage = jest.fn().mockResolvedValue(mockData);
      const rs = await chatService.getChannelChatMessage(query, fakeReq);

      expect(realTimeService.getChannelChatMessage).toHaveBeenCalledWith(
        query.channel_id,
        query.parent_uid,
        chatService.getChannelTypeFromNumber(query.channel_type),
        {
          page_size: query.page_size,
          page_no: query.page_no,
          before_sent_time: query.before_time,
          after_sent_time: query.after_time,
        },
      );
    });

    it('CONFERENCE: should return replied chat messages', async () => {
      const mockData = [
        {
          message: 'Replied message 1',
          parent_uid: 'b78c9fbc-0360-434b-84c7-c78c666bca3f',
          content_marked: 'This is content which was marked',
          message_marked: {
            message_uid: 'b78c9fbc-0360-434b-84c7-c78c666bca3f',
            channel_id: 'CONFERENCE_1086014',
            email: 'hainv.owner1@flodev.net',
            content: 'Chat message 39',
            metadata: '{}',
            sent_time: 1710489529.347,
            created_date: 1710489529.355,
            updated_date: 1710489529.355,
          },
        },
        {
          message: 'Replied message 2',
          parent_uid: 'b78c9fbc-0360-434b-84c7-c78c666bca3f',
          content_marked: 'This is content which was marked',
          message_marked: {
            message_uid: 'b78c9fbc-0360-434b-84c7-c78c666bca3f',
            channel_id: 'CONFERENCE_1086014',
            email: 'hainv.owner1@flodev.net',
            content: 'Chat message 39',
            metadata: '{}',
            sent_time: 1710489529.347,
            created_date: 1710489529.355,
            updated_date: 1710489529.355,
          },
        },
      ];

      const query: GetChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        page_size: 10,
        page_no: 0,
        before_time: 0,
        after_time: 0,
        parent_uid: '123'
      };

      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0 });
      realTimeService.getChannelChatMessage = jest.fn().mockResolvedValue(mockData);
      realTimeService.getChatMessage = jest.fn().mockResolvedValue({
        data: {
          status: 1,
          created_date: 123,
          updated_date: 123,
          deleted_date: 0,
        }
      });
      const rs = await chatService.getChannelChatMessage(query, fakeReq);

      expect(realTimeService.getChannelChatMessage)
        .toHaveBeenCalledWith(
          query.channel_id,
          query.parent_uid,
          chatService.getChannelTypeFromNumber(query.channel_type),
          {
            page_size: query.page_size,
            page_no: query.page_no,
            before_sent_time: query.before_time,
            after_sent_time: query.after_time
          },
        );
    });

    it('CONFERENCE: should return empty array if there is an error', async () => {
      const query: GetChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        page_size: 10,
        page_no: 0,
        before_time: 0,
        after_time: 0
      };
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      realTimeService.getChannelChatMessage = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const rs = await chatService.getChannelChatMessage(query, fakeReq);

      expect(realTimeService.getChannelChatMessage)
        .toHaveBeenCalledWith(
          query.channel_id,
          query.parent_uid,
          chatService.getChannelTypeFromNumber(query.channel_type),
          {
            page_size: query.page_size,
            page_no: query.page_no,
            before_sent_time: query.before_time,
            after_sent_time: query.after_time
          },
        );

      expect(rs.data).toStrictEqual([]);
    });

    it('SHARED COLLECTION: should return chat messages with no permission', async () => {
      const query: GetChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.SHARED_COLLECTION,
        page_size: 10,
        page_no: 0,
        before_time: 0,
        after_time: 0
      };
      collectionRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 0 });
      sharedMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 0 });
      try {
        await chatService.getChannelChatMessage(query, fakeReq);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it('SHARED COLLECTION: should return chat messages', async () => {
      const mockData = [{ message: 'Hello' }, { message: 'World' }];
      const query: GetChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.SHARED_COLLECTION,
        page_size: 10,
        page_no: 0,
        before_time: 0,
        after_time: 0
      };
      collectionRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 456, is_trashed: 0, user_id: fakeReq.user.id });
      realTimeService.getChannelChatMessage = jest.fn().mockResolvedValue(mockData);
      const rs = await chatService.getChannelChatMessage(query, fakeReq);

      expect(realTimeService.getChannelChatMessage)
        .toHaveBeenCalledWith(
          query.channel_id,
          query.parent_uid,
          chatService.getChannelTypeFromNumber(query.channel_type),
          {
            page_size: query.page_size,
            page_no: query.page_no,
            before_sent_time: query.before_time,
            after_sent_time: query.after_time
          },
        );
    });

    it('SHARED COLLECTION: should return empty array if there is an error', async () => {
      const query: GetChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.SHARED_COLLECTION,
        page_size: 10,
        page_no: 0,
        before_time: 0,
        after_time: 0
      };
      collectionRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 456, is_trashed: 0, user_id: fakeReq.user.id });

      realTimeService.getChannelChatMessage = jest.fn().mockResolvedValue(false);
      const rs = await chatService.getChannelChatMessage(query, fakeReq);

      expect(realTimeService.getChannelChatMessage)
        .toHaveBeenCalledWith(
          query.channel_id,
          query.parent_uid,
          chatService.getChannelTypeFromNumber(query.channel_type),
          {
            page_size: query.page_size,
            page_no: query.page_no,
            before_sent_time: query.before_time,
            after_sent_time: query.after_time
          },
        );
      expect(rs.data).toStrictEqual([]);
    });

    it('SHARED COLLECTION: should return empty array if there is an error 1', async () => {
      const query: GetChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.SHARED_COLLECTION,
        page_size: 10,
        page_no: 0,
        before_time: 0,
        after_time: 0
      };
      collectionRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 456, is_trashed: 0, user_id: fakeReq.user.id });

      realTimeService.getChannelChatMessage = jest.fn().mockImplementation(() => {
        throw new Error();
      });

      const rs = await chatService.getChannelChatMessage(query, fakeReq);
      expect(realTimeService.getChannelChatMessage)
        .toHaveBeenCalledWith(
          query.channel_id,
          query.parent_uid,
          chatService.getChannelTypeFromNumber(query.channel_type),
          {
            page_size: query.page_size,
            page_no: query.page_no,
            before_sent_time: query.before_time,
            after_sent_time: query.after_time
          },
        );

      expect(rs.data).toStrictEqual([]);
    });
  });

  describe("getListChatAttachments", () => {

    it("should get a list of chat attachments", async () => {
      const fakeGet = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE
      }
      const mockData = [{
        "name": "test01.jpg",
        "file_type": "image/jpg",
        "size": 10000,
        "path": "attachment/test01.jpg",
        "signed_url": "attachment/test01.signed_url.jpg"
      },
      {
        "name": "test01.jpg",
        "file_type": "image/jpg",
        "size": 4000,
        "path": "attachment/test01.jpg",
        "signed_url": "attachment/test01.signed_url.jpg"
      }];
      const query: GetAttachmentDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        page_size: 10,
        page_no: 0,
      };
      realTimeService.getListChatAttachments = jest.fn().mockResolvedValue(mockData);
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      const rs = await chatService.getListChatAttachments(fakeGet, fakeReq);

      expect(realTimeService.getListChatAttachments).toHaveBeenCalledWith(
        query.channel_id,
        chatService.getChannelTypeFromNumber(query.channel_type)
      );
    });

    it('should return empty array if there is an error', async () => {
      const query: GetChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        page_size: 10,
        page_no: 0,
      };
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      realTimeService.getListChatAttachments = jest.fn().mockResolvedValue(false);
      const rs = await chatService.getListChatAttachments(query, fakeReq);
      expect(realTimeService.getListChatAttachments).toHaveBeenCalledWith(
        query.channel_id,
        chatService.getChannelTypeFromNumber(query.channel_type)
      );
      expect(rs.data).toStrictEqual([]);
    });

    it('should return empty array if there is an error 1', async () => {
      const query: GetChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        page_size: 10,
        page_no: 0,
      };
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });

      realTimeService.getListChatAttachments = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const rs = await chatService.getListChatAttachments(query, fakeReq);
      expect(realTimeService.getListChatAttachments).toHaveBeenCalledWith(
        query.channel_id,
        chatService.getChannelTypeFromNumber(query.channel_type)
      );
      expect(rs.data).toStrictEqual([]);

    });
  });

  describe("getLastSeenMessagesMessage", () => {

    it("should get a list of chat seen", async () => {
      const fakeGet = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE
      }
      const mockData = [{
        "email": "abc@flomail.net",
        "message_uid": "53e59ec7-8a6c-4c8c-95ff-55555"
      },
      {
        "email": "xyz@flomail.net",
        "message_uid": "53e59ec7-8a6c-4c8c-95ff-33333"
      },];
      const query: GetAttachmentDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
      };
      realTimeService.getLastSeenMessages = jest.fn().mockResolvedValue(mockData);
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      const rs = await chatService.getLastSeenMessages(fakeGet, fakeReq);

      expect(realTimeService.getLastSeenMessages).toHaveBeenCalledWith(
        query.channel_id,
        chatService.getChannelTypeFromNumber(query.channel_type)
      );
    });

    it('should return empty array if there is an error', async () => {
      const query: GetLastSeenDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
      };
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      realTimeService.getLastSeenMessages = jest.fn().mockResolvedValue(false);
      const rs = await chatService.getLastSeenMessages(query, fakeReq);
      expect(realTimeService.getLastSeenMessages).toHaveBeenCalledWith(
        query.channel_id,
        chatService.getChannelTypeFromNumber(query.channel_type)
      );
      expect(rs.data).toStrictEqual([]);
    });

    it('should return empty array if there is an error 1', async () => {
      const query: GetChatDTO = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        page_size: 10
      };
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });

      realTimeService.getLastSeenMessages = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const rs = await chatService.getLastSeenMessages(query, fakeReq);
      expect(realTimeService.getLastSeenMessages).toHaveBeenCalledWith(
        query.channel_id,
        chatService.getChannelTypeFromNumber(query.channel_type)
      );
      expect(rs.data).toStrictEqual([]);

    });
  });

  describe("updateChatMessage", () => {
    it("should update a chat message", async () => {
      const fakeChat = {
        message_uid: "message1",
        message_text: "Updated message_text",
        channel_type: ChannelTypeNumber.CONFERENCE,
        channel_id: 123,
        metadata: {
          timestamp: +new Date(),
          attachments: []
        },
      };
      chimeChatService.batchUpdateMessage = jest.fn().mockImplementation();
      realTimeService.updateChatMessage = jest.fn().mockResolvedValue({
        data: { status: 1 }
      });
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });

      const rs = await chatService.updateChatMessage(fakeChat, fakeReq);

      expect(chimeChatService.batchUpdateMessage).not.toBeCalled();
      jest.runAllTimers();
      expect(chimeChatService.batchUpdateMessage).toHaveBeenCalledTimes(1);
      expect(rs.data).not.toBe([]);
    });

    it('should update a chat message with mention', async () => {
      linkFileRepo.getFileByFileID = jest.fn().mockImplementation((fileId: number) => ({
        s3Path: '/path',
        uid: '123981er-dsf-as-wr--asdfk',
        dir: '/dir',
        ext: 'png',
      }));
      chatService['s3Util'].GenSource = jest.fn().mockResolvedValue("source");
      chatService['s3Util'].DownloadUrl = jest.fn().mockResolvedValue({ url: '' });
      chatService['s3Util'].FileExist = jest.fn().mockResolvedValue('/path/to/file');
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0 });

      const fakeChat: PutChatDTO = {
        message_uid: "message1",
        message_text: "Updated message_text",
        channel_type: ChannelTypeNumber.CONFERENCE,
        channel_id: 123,
        metadata: {
          timestamp: +new Date(),
          mentions: [{
            email: 'abc@flodev.net'
          }]
        },
      };

      const mockData = {
        data: {
          "channel": "COLLECTION_4511671",
          "status": true
        }
      };
      chimeChatService.batchUpdateMessage = jest.fn().mockImplementation();
      realTimeService.updateChatMessage = jest.fn().mockResolvedValue(mockData);

      const rs = await chatService.updateChatMessage(fakeChat, fakeReq);

      expect(realTimeService.updateChatMessage).toHaveBeenCalledWith(
        fakeChat.message_uid,
        fakeChat.message_text,
        fakeChat.metadata,
      );
    });

    it("should update a chat message with error", async () => {
      const fakeChat = {
        message_uid: "message1",
        message_text: "Updated message_text",
        channel_type: ChannelTypeNumber.CONFERENCE,
        channel_id: 123,
        metadata: {
          timestamp: +new Date(),
          attachments: []
        },
      };

      chimeChatService.batchUpdateMessage = jest.fn().mockImplementation();
      realTimeService.updateChatMessage = jest.fn().mockResolvedValue(undefined);
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });

      try {
        const rs = await chatService.updateChatMessage(fakeChat, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should update a chat message with error 1", async () => {
      const fakeChat = {
        message_uid: "message1",
        message_text: "Updated message_text",
        channel_type: ChannelTypeNumber.CONFERENCE,
        channel_id: 123,
        metadata: {
          timestamp: +new Date(),
          attachments: []
        },
      };

      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      realTimeService.updateChatMessage = jest.fn().mockImplementation(() => {
        throw new Error();
      });

      try {
        const rs = await chatService.updateChatMessage(fakeChat, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("updateLastChatSeen", () => {
    it("should update the last chat seen", async () => {
      const fakeChat = {
        channel_id: 123,
        channel_type: ChannelTypeNumber.CONFERENCE,
        message_uid: "message1"
      };
      realTimeService.updateLastChatSeen = jest.fn().mockResolvedValue({
        data: { status: 1 }
      });
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });

      const rs = await chatService.updateLastChatSeen(fakeChat, fakeReq);
      expect(rs.data).not.toBe([]);
    });

    it("should update last chat seen with error", async () => {
      const fakeChat = {
        message_uid: "message1",
        message_text: "Updated message_text",
        channel_type: ChannelTypeNumber.CONFERENCE,
        channel_id: 123
      };

      realTimeService.updateLastChatSeen = jest.fn().mockResolvedValue(false);
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });

      try {
        const rs = await chatService.updateLastChatSeen(fakeChat, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should update last chat seen with error 1", async () => {
      const fakeChat = {
        message_uid: "message1",
        message_text: "Updated message_text",
        channel_type: ChannelTypeNumber.CONFERENCE,
        channel_id: 123,
      };
      realTimeService.updateLastChatSeen = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      try {
        const rs = await chatService.updateLastChatSeen(fakeChat, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }

    });
  });

  describe("deleteChatMessage", () => {
    it("should show Can not delete this message", async () => {
      const fakeChat = {
        message_uid: '123123',
        channel_type: ChannelTypeNumber.CONFERENCE,
        channel_id: 123
      };
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      linkFileRepo.getFileDownloadByMessageUID = jest.fn().mockResolvedValue(false);
      realTimeService.deleteChatMessage = jest.fn().mockResolvedValue({
        data: {},
        error: {
          statusCode: 400,
          error: { message: 'Can not delete this message' }
        }
      });
      const rs = await chatService.deleteChatMessage([fakeChat], fakeReq);

      expect(rs.itemFail[0].message).toEqual('Can not delete this message')
    });

    it("should delete all file uploads", async () => {
      const fakeChat = {
        message_uid: '123123',
        channel_type: ChannelTypeNumber.CONFERENCE,
        channel_id: 123
      };
      const fakeFiles = [{
        id: 155549,
        uid: 'c4acbbf5-374c-4971-9b9d-19fac0a5ba6a',
        dir: '72cac6d422727448b2849907144ecd99',
        ext: 'png',
        size: 54658
      }, {
        id: 155550,
        uid: 'ee097d13-aef8-4b4a-bc42-adbee87b2951',
        dir: '72cac6d422727448b2849907144ecd99',
        ext: 'png',
        size: 43741
      }];
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      linkFileRepo.getFileDownloadByMessageUID = jest.fn().mockResolvedValue(fakeFiles);
      chatService.delChatToChime = jest.fn().mockReturnValue([]);
      realTimeService.deleteChatMessage = jest.fn().mockResolvedValue({ data: { status: 1 } });
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });

      const rs = await chatService.deleteChatMessage([fakeChat], fakeReq);
      expect(rs.itemPass).not.toBe([]);
      expect(rs.itemFail).toStrictEqual([]);
    });

    it("should delete a chat message", async () => {
      const fakeChat = {
        message_uid: '123123',
        channel_type: ChannelTypeNumber.CONFERENCE,
        channel_id: 123
      };
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      linkFileRepo.getFileDownloadByMessageUID = jest.fn().mockResolvedValue(false);
      realTimeService.deleteChatMessage = jest.fn().mockResolvedValue({ data: { status: 1 } });
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      chimeChatService.batchDeleteMessage = jest.fn().mockImplementation();

      const rs = await chatService.deleteChatMessage([fakeChat], fakeReq);

      expect(chimeChatService.batchDeleteMessage).not.toBeCalled();
      jest.runAllTimers();
      expect(chimeChatService.batchDeleteMessage).toHaveBeenCalledTimes(1);
      expect(rs.itemPass).not.toBe([]);
      expect(rs.itemFail).toStrictEqual([]);
    });

    it("should delete a chat message with error", async () => {
      const fakeChat = {
        message_uid: '123123',
        channel_type: ChannelTypeNumber.CONFERENCE,
        channel_id: 123
      };
      realTimeService.deleteChatMessage = jest.fn().mockResolvedValue(false);
      const rs = await chatService.deleteChatMessage([fakeChat], fakeReq);
      expect(rs.itemFail).not.toBe([]);
    });

    it("should delete a chat message with error 0", async () => {
      const fakeChat = {
        message_uid: '123123',
        channel_type: ChannelTypeNumber.CONFERENCE,
        channel_id: 123
      };
      realTimeService.deleteChatMessage = jest.fn().mockResolvedValue({ respond: { data: { status: false } } });
      conferenceMemberRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 123, revoke_time: 0, view_chat_history: 1 });
      const rs = await chatService.deleteChatMessage([fakeChat], fakeReq);
      expect(rs.itemFail).not.toBe([]);
    });

    it("should delete a chat message with error 1", async () => {
      const fakeChat = {
        message_uid: '123123',
        channel_type: ChannelTypeNumber.CONFERENCE,
        channel_id: 123
      };
      realTimeService.deleteChatMessage = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const rs = await chatService.deleteChatMessage([fakeChat], fakeReq);
      expect(rs.itemFail).not.toBe([]);
    });
  });

  describe('upload', () => {
    const data: ChimeFileDTO = {
      file: [
        {
          fieldname: 'file',
          originalname: 'Screen Shot 2024-01-08 at 16.37.08.png',
          encoding: '7bit',
          mimetype: 'image/png',
          size: 47158,
        },
        {
          fieldname: 'file',
          originalname: 'Screen Shot 2024-01-17 at 20.58.05.png',
          encoding: '7bit',
          mimetype: 'image/png',
          size: 54658,
        },
      ],
      channel_id: 1,
      channel_type: ChannelTypeNumber.CONFERENCE,
      message_uid: 'quang-test'
    }

    it('should upload error The item can not upload', async () => {
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      chatService.createThumbnail = jest.fn().mockReturnValue(true);
      chatService['s3Util'].uploadFromBuffer = jest.fn().mockResolvedValue(false);
      try {
        await chatService.fileSingleUpload(data, data.file, fakeReq)
      } catch (error) {
        expect(error.message).toEqual(MSG_ERR_UPLOAD);
      }
    });

    it('should upload success', async () => {
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      chatService.createThumbnail = jest.fn().mockReturnValue(true);
      chatService['s3Util'].uploadFromBuffer = jest.fn().mockResolvedValue(true);
      fileRepo.create = jest.fn().mockResolvedValue(data);
      fileRepo.save = jest.fn().mockResolvedValue(true);
      const result = await chatService.fileSingleUpload(data, data.file, fakeReq);
      expect(result.itemPass).toHaveLength(2);
    });

    it('should upload error The item can not upload', async () => {
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      chatService.createThumbnail = jest.fn().mockReturnValue(true);
      chatService['s3Util'].uploadFromBuffer = jest.fn().mockResolvedValue(false);
      try {
        await chatService.fileSingleUpload(data, data.file, fakeReq);
      } catch (error) {
        expect(error.message).toEqual(MSG_ERR_UPLOAD);
      }
    });

    it('should upload error The item can not upload 1', async () => {
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      chatService.createThumbnail = jest.fn().mockReturnValue(true);
      chatService['s3Util'].uploadFromBuffer = jest.fn().mockImplementation(() => {
        throw new Error();
      });

      try {
        await chatService.fileSingleUpload(data, data.file, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('get download', () => {
    const param: ChatDownloadDTO = {
      channel_id: 1,
      channel_type: ChannelTypeNumber.CONFERENCE,
      file_uid: "123",
      thumb: 1
    }
    it('should show channel id not found', async () => {
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      const result = await chatService.download(param, fakeReq)
      expect(result.code).toEqual(ErrorCode.BAD_REQUEST);
    });

    it('should Message uid is invalid.', async () => {
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      linkFileRepo.getFileByChanleIdAndTimeDownload = jest.fn().mockResolvedValue(false);

      const result = await chatService.download(param, fakeReq)
      expect(result.message).toEqual(MSG_FILE_NOT_EXIST);
    });

    it('should show The item can not download', async () => {
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      linkFileRepo.getFileByChanleIdAndTimeDownload = jest.fn().mockResolvedValue({
        id: 1546,
        filename: '1.jpeg',
        uid: 'bda76bec-ee26-4f40-838d-542ad9bc3321',
        dir: '385f70b3a8a259f24f19e163d1f6a05d',
        mime: 'image/jpeg',
        ext: 'jpeg',
        size: 26099
      });
      chatService['s3Util'].GenSource = jest.fn().mockResolvedValue("source");
      chatService['s3Util'].FileExist = jest.fn().mockResolvedValue(false);
      const result = await chatService.download(param, fakeReq)
      expect(result.message).toEqual(MSG_ERR_DOWNLOAD);
    });

    it('should get download error FILE_NOT_FOUND', async () => {
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      linkFileRepo.getFileByChanleIdAndTimeDownload = jest.fn().mockResolvedValue(false);
      chatService['s3Util'].GenSource = jest.fn().mockResolvedValue("source");
      chatService['s3Util'].FileExist = jest.fn().mockResolvedValue(false);

      const result = await chatService.download(param, fakeReq)
      expect(result.code).toEqual(ErrorCode.BAD_REQUEST);
    });

    it('should get download success', async () => {
      chatService.checkPermissionBeforeChat = jest.fn().mockReturnValue(true);
      linkFileRepo.getFileByChanleIdAndTimeDownload = jest.fn().mockResolvedValue({
        id: 1546,
        filename: '1.jpeg',
        uid: 'bda76bec-ee26-4f40-838d-542ad9bc3321',
        dir: '385f70b3a8a259f24f19e163d1f6a05d',
        mime: 'image/jpeg',
        ext: 'jpeg',
        size: 26099
      });
      chatService['s3Util'].GenSource = jest.fn().mockResolvedValue("source");
      chatService['s3Util'].FileExist = jest.fn().mockResolvedValue(true);
      chatService['s3Util'].DownloadUrl = jest.fn().mockResolvedValue({ url: '' });

      const result = await chatService.download(param, fakeReq)
      expect(result.code).toEqual(ErrorCode.REQUEST_SUCCESS);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(async () => {
    await app.close();
  });
});
