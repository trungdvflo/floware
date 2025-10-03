import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { OBJECT_SHARE_ABLE } from '../../../common/constants';
import { BaseGetDTO } from '../../../common/dtos/base-get.dto';
import { GeneralObjectId } from '../../../common/dtos/object-uid';
import { DeletedItem } from '../../../common/entities';
import { CollectionCommentRepository, CommentMentionRepository } from '../../../common/repositories';
import { ApiLastModifiedQueueService, FileAttachmentQueueService } from '../../bullmq-queue';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { CommentService } from '../comment.service';
import { CreateCommentDto, DeleteCommentDto, UpdateCommentDto } from '../dtos';
import { fakeComment, fakeMention } from './fakeData';

jest.mock('@nestjs/axios', () => ({
  HttpModule: jest.fn(),
  HttpService: jest.fn(),
}));

const mentionReposMockFactory: () => MockType<CommentMentionRepository> = jest.fn(() => ({
  findByObjUid: jest.fn(entity => entity),
  find: jest.fn(entity => entity),
  findOne: jest.fn((id: number) => id),
  save: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  insert: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  remove: jest.fn(entity => entity),
  getMentionUserByComment: jest.fn(entity => []),
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
  addMention: jest.fn().mockReturnValue(0),
  removeAllMention: jest.fn().mockReturnValue(0)
}));

const commentReposMockFactory: () => MockType<CollectionCommentRepository> = jest.fn(() => ({
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
  addJobCollection: jest.fn(entity => entity),
  sendLastModifiedByCollectionId: jest.fn(entity => entity),
}));
const fileAttachmentQueueService: (
) => MockType<ApiLastModifiedQueueService> = jest.fn(() => ({
  addJob: jest.fn(entity => entity),
  addJobFileCommon: jest.fn(entity => entity),
}));

describe('CommentService', () => {
  let app: INestApplication;
  let service: CommentService;
  let commentRepo: MockType<CollectionCommentRepository>;
  let mentionRepo: MockType<CommentMentionRepository>;
  let deletedItemService: DeletedItemService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        DeletedItemService,
        DatabaseUtilitiesService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory
        },
        {
          provide: CollectionCommentRepository,
          useFactory: commentReposMockFactory
        },
        {
          provide: CommentMentionRepository,
          useFactory: mentionReposMockFactory
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn()
          }
        },
        {
          provide: FileAttachmentQueueService,
          useFactory: fileAttachmentQueueService
        }
      ],
    }).compile();


    app = module.createNestApplication();
    await app.init();
    deletedItemService = module.get<any>(DeletedItemService);
    service = module.get<CommentService>(CommentService);
    commentRepo = module.get(CollectionCommentRepository);
    mentionRepo = module.get(CommentMentionRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(commentRepo).toBeDefined();
    expect(mentionRepo).toBeDefined();
  });

  describe('Get comment', () => {
    const fakeUser = {
      id: 1, token: '', userId: 1, userAgent: '', email: 'anph@abc.com', appId: '', deviceUid: ''
    };
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
        commentRepo.getAllComment = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.getComments(req, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be get comment', async () => {
      const req = {
        page_size: 10,
        has_del: 1,
        modified_gte: 1247872251.212,
        modified_lt: 1247872251.212,
        ids: []
      } as BaseGetDTO;
      deletedItemService.findAll = jest.fn().mockReturnValue([]);
      commentRepo.getAllComment = jest.fn().mockReturnValue(fakeComment);
      const result = await service.getComments(req, fakeReq);
      expect(result.data[0]).toEqual(fakeComment[0]);
    });
  });

  describe('Get mention user', () => {
    const fakeUser = {
      id: 1, token: '', userId: 1, userAgent: '', email: 'anph@abc.com', appId: '', deviceUid: ''
    };
    it('should be return error', async () => {
      try {
        const req = {
          collection_id: 0
        } as BaseGetDTO;
        deletedItemService.findAll = jest.fn().mockReturnValue([]);
        mentionRepo.getAllMentionUsers = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.getAllMentionsUser(req, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be get comment', async () => {
      const req = {
        collection_id: 1
      } as BaseGetDTO;
      deletedItemService.findAll = jest.fn().mockReturnValue([]);
      mentionRepo.getAllMentionUsers = jest.fn().mockReturnValue(fakeMention);
      const result = await service.getAllMentionsUser(req, fakeReq);
      expect(result.data[0]).toEqual(fakeMention[0]);
    });
  });
  describe('Created comment', () => {
    it('should be return valid comment', async () => {
      const dtoComment: CreateCommentDto[] = [{
        "collection_id": 123,
        "object_uid": new GeneralObjectId({ uid: "d5a68e33-ba04-11eb-a32e-5bed2a93fc42" }),
        "object_type": OBJECT_SHARE_ABLE.VTODO,
        "action_time": 12345.345,
        "comment": "created new item",
        parent_id: 0,
        mentions: [],
        updated_date: Date.now() / 1000,
        created_date: Date.now() / 1000,
        ref: "1"
      }];
      commentRepo.insertComment = jest.fn().mockReturnValue({ ...dtoComment[0], object_uid: dtoComment[0].object_uid.getPlain() });
      const result = await service.createBatchComment(dtoComment, fakeReq);
      expect(result.itemPass[0]).toEqual({
        ...dtoComment[0],
        object_uid: dtoComment[0].object_uid.getPlain()
      });
    });

    it('should be return valid comment with mention', async () => {
      const dtoComment: CreateCommentDto[] = [{
        "collection_id": 123,
        "object_uid": new GeneralObjectId({ uid: "d5a68e33-ba04-11eb-a32e-5bed2a93fc42" }),
        "object_type": OBJECT_SHARE_ABLE.VTODO,
        "action_time": 12345.345,
        "comment": "created new item",
        mentions: [{
          mention_text: '@anph',
          email: 'anph@flodev.net'
        }],
        parent_id: 0,
        updated_date: Date.now() / 1000,
        created_date: Date.now() / 1000,
        ref: "1"
      }];
      commentRepo.insertComment = jest.fn().mockReturnValue({ ...dtoComment[0], object_uid: dtoComment[0].object_uid.getPlain() });
      const result = await service.createBatchComment(dtoComment, fakeReq);
      expect(result.itemPass[0]).toEqual({
        ...dtoComment[0],
        object_uid: dtoComment[0].object_uid.getPlain()
      });
    });

    it('should be return error 1', async () => {
      try {
        const dtoComment: CreateCommentDto[] = [{
          "collection_id": 123,
          "object_uid": new GeneralObjectId({ uid: "d5a68e33-ba04-11eb-a32e-5bed2a93fc42" }),
          "object_type": OBJECT_SHARE_ABLE.VTODO,
          "action_time": 12345.345,
          "comment": "created new item",
          parent_id: 0,
          updated_date: Date.now() / 1000,
          created_date: Date.now() / 1000,
        }];
        commentRepo.insertComment = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })

        await service.createBatchComment(dtoComment, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 2', async () => {
      try {
        const dtoComment: CreateCommentDto[] = [{
          "collection_id": 123,
          "object_uid": new GeneralObjectId({ uid: "d5a68e33-ba04-11eb-a32e-5bed2a93fc42" }),
          "object_type": OBJECT_SHARE_ABLE.VTODO,
          "action_time": 12345.345,
          "comment": "created new item",
          parent_id: 0,
          updated_date: Date.now() / 1000,
          created_date: Date.now() / 1000,
        }];
        commentRepo.insertComment = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })

        await service.createBatchComment(dtoComment, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Update comment', () => {
    it('should be return duplicate comment', async () => {
      const dtoComment: UpdateCommentDto[] = [{
        "id": 1,
        "comment": "test 1",
        action_time: Date.now() / 1000,
        updated_date: Date.now() / 1000,
      }];
      const commentUpdated = {
        ...dtoComment[0],
        "created_date": 1670495246.939,
        "collection_id": 244595,
        "object_uid": "d5a68e33-ba04-11eb-a32e-5bed2a93fc42",
        "object_type": OBJECT_SHARE_ABLE.URL,
        "object_href": "",
        "collection_activity_id": 1,
        "email": "anph_po@flodev.net",
        "action": 1,
        "action_time": 0,
        user_id: 11,
        "parent_id": 0,
        createDate: function (): void {
          throw new Error('Function not implemented.');
        },
        updatedDate: function (): void {
          throw new Error('Function not implemented.');
        },
        deleteUserId: function (): void {
          throw new Error('Function not implemented.');
        },
        attachments: ''
      };
      commentRepo.updateComment = jest.fn().mockReturnValue(commentUpdated);
      const result = await service
        .updateBatchComment([commentUpdated, commentUpdated], fakeReq);

      expect(result.itemPass.length).toEqual(1);
      expect(result.itemFail.length).toEqual(1);
    });
    it('should be return error comment', async () => {
      commentRepo.updateComment = jest.fn().mockReturnValue({});
      const result = await service
        .updateBatchComment([], fakeReq);
      expect(result.itemPass.length).toEqual(0);
      expect(result.itemFail.length).toEqual(0);
    });
    it('should be return valid comment', async () => {
      const dtoComment: UpdateCommentDto[] = [{
        "id": 1,
        "comment": "test 1",
        action_time: Date.now() / 1000,
        updated_date: Date.now() / 1000,
      }];
      const commentUpdated = {
        ...dtoComment[0],
        "created_date": 1670495246.939,
        "collection_id": 244595,
        "object_uid": "d5a68e33-ba04-11eb-a32e-5bed2a93fc42",
        "object_type": OBJECT_SHARE_ABLE.URL,
        "object_href": "",
        "collection_activity_id": 1,
        "email": "anph_po@flodev.net",
        "action": 1,
        "action_time": 0,
        mentions: [],
        user_id: 11,
        "parent_id": 0,
        createDate: function (): void {
          throw new Error('Function not implemented.');
        },
        updatedDate: function (): void {
          throw new Error('Function not implemented.');
        },
        deleteUserId: function (): void {
          throw new Error('Function not implemented.');
        },
        attachments: ''
      };
      commentRepo.updateComment = jest.fn().mockReturnValue(commentUpdated);

      const result = await service.updateBatchComment(dtoComment, fakeReq);
      expect(result.itemPass[0]).toEqual(commentUpdated);
    });
    it('should be return valid comment with mention', async () => {
      const dtoComment: UpdateCommentDto[] = [{
        "id": 1,
        "comment": "test 1",
        mentions: [{
          mention_text: '@anph',
          email: 'anph@flodev.net'
        }],
        action_time: Date.now() / 1000,
        updated_date: Date.now() / 1000,
      }];
      const commentUpdated = {
        ...dtoComment[0],
        "created_date": 1670495246.939,
        "collection_id": 244595,
        "object_uid": "d5a68e33-ba04-11eb-a32e-5bed2a93fc42",
        "object_type": OBJECT_SHARE_ABLE.URL,
        "object_href": "",
        "collection_activity_id": 1,
        "email": "anph_po@flodev.net",
        "action": 1,
        "action_time": 0,
        user_id: 11,
        "parent_id": 0,
        createDate: function (): void {
          throw new Error('Function not implemented.');
        },
        updatedDate: function (): void {
          throw new Error('Function not implemented.');
        },
        deleteUserId: function (): void {
          throw new Error('Function not implemented.');
        },
        attachments: ''
      };
      commentRepo.updateComment = jest.fn().mockReturnValue(commentUpdated);
      const result = await service.updateBatchComment(dtoComment, fakeReq);
      expect(result.itemPass[0]).toEqual(commentUpdated);
    });

    it('should be return error 1', async () => {
      try {
        const dtoComment: UpdateCommentDto[] = [{
          "id": 1,
          "comment": "test 1",
          action_time: Date.now() / 1000,
          updated_date: Date.now() / 1000,

        }];
        commentRepo.updateComment = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.updateBatchComment(dtoComment, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 2', async () => {
      try {
        const dtoComment: UpdateCommentDto[] = [{
          "id": 1,
          "comment": "test 1",
          action_time: Date.now() / 1000,
          updated_date: Date.now() / 1000,
        }];
        commentRepo.updateComment = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.updateBatchComment(dtoComment, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Delete comment', () => {
    it('should be return valid comment', async () => {
      const dtoComment: DeleteCommentDto[] = [{
        'id': 1,
        updated_date: Date.now() / 1000
      }];
      commentRepo.deleteComment = jest.fn().mockReturnValue({
        'id': 1,
        collection_id: 1
      });
      const result = await service
        .deleteBatchComment(dtoComment, fakeReq);
      expect(result.itemPass[0].id).toEqual(dtoComment[0].id);
    });

    it('should be return error 1', async () => {
      try {
        const dtoComment: DeleteCommentDto[] = [{
          id: 1,
          "updated_date": new Date().getTime() / 1000,
        }];
        commentRepo.deleteComment = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.deleteBatchComment(dtoComment, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 2', async () => {
      try {
        const dtoComment: DeleteCommentDto[] = [{
          id: 1,
          updated_date: Date.now() / 1000
        }];
        commentRepo.deleteComment = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.deleteBatchComment(dtoComment, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 3', async () => {
      try {
        const dtoComment: DeleteCommentDto[] = [{
          id: 1,
          updated_date: Date.now() / 1000
        },
        {
          id: 1,
          updated_date: Date.now() / 1000
        }];
        commentRepo.deleteComment = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.deleteBatchComment(dtoComment, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should not send last modify', async () => {
      try {
        const dtoComment: DeleteCommentDto[] = [];
        commentRepo.deleteComment = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.deleteBatchComment(dtoComment, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
