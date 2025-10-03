import { BadRequestException, INestApplication, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { MEMBER_ACCESS, SHARE_STATUS } from '../../../common/constants';
import { ErrorCode } from '../../../common/constants/error-code';
import {
  MSG_ERR_DOWNLOAD, MSG_ERR_LINK, MSG_ERR_WHEN_DELETE, MSG_FIND_NOT_FOUND
} from '../../../common/constants/message.constant';
import { BaseGetDTO } from '../../../common/dtos/base-get.dto';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { FileAttachment } from '../../../common/entities/file-attachment.entity';
import { LinkedCollectionObject } from '../../../common/entities/linked-collection-object.entity';
import { ShareMember } from '../../../common/entities/share-member.entity';
import { ShareMemberRepository } from '../../../common/repositories';
import { FileAttachmentRepository } from '../../../common/repositories/file-attachment.repository';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { FileAttachmentQueueService } from '../../bullmq-queue/file-queue.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { FileMemberService } from '../file-member.service';
import * as FakeData from './fakeData';

const mS3Instance = {
  upload: jest.fn().mockReturnThis(),
  promise: jest.fn().mockResolvedValueOnce({ Body: 'asdas' }),
  getObject: jest.fn().mockReturnThis(),
  putObject: jest.fn().mockReturnThis()
};

const repoMockFactory = jest.fn(() => ({
  save: jest.fn(entity => {
    entity.id = 1;
    return entity;
  }),
  find: jest.fn(entity => entity),
  findOne: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  reduce: jest.fn(),
  metadata: {
    ownColumns: [
      {
        databaseName: 'id'
      },
      {
        databaseName: 'user_id'
      },
      {
        databaseName: 'source_account_id'
      },
      {
        databaseName: 'source_object_href'
      },
      {
        databaseName: 'destination_object_href'
      },
      {
        databaseName: 'action_data'
      },
      {
        databaseName: 'action'
      },
      {
        databaseName: 'source_object_uid'
      },
      {
        databaseName: 'destination_object_uid'
      },
      {
        databaseName: 'source_object_type'
      },
      {
        databaseName: 'destination_object_type'
      },
      {
        databaseName: 'destination_object_uid'
      },
      {
        databaseName: 'path'
      },
      {
        databaseName: 'created_date'
      },
      {
        databaseName: 'updated_date'
      }
    ]
  }
}));

const apiLastModifiedServiceMockFactory: () => MockType<ApiLastModifiedQueueService> =
  jest.fn(() => ({ addJob: jest.fn(entity => entity) }));

const fileAttachmentQueueServiceMockFactory: () => MockType<FileAttachmentQueueService> =
  jest.fn(() => ({ addJob: jest.fn(entity => entity) }));

const repoMockLinkCollecionObjectFactory: () => MockType<Repository<LinkedCollectionObject>> = jest.fn(() => ({
  findOne: jest.fn(entity => entity),
  find: jest.fn(entity => entity),
}));

jest.mock('aws-sdk', () => {
  return { S3: jest.fn(() => mS3Instance) };
});

const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({
  insert: jest.fn(entity => entity),
}));
const repoMockShareMemberFactory: () => MockType<Repository<ShareMember>> = jest.fn(() => ({
  findOne: jest.fn(entity => entity),
  find: jest.fn(entity => entity),
}));

describe('FileService', () => {
  let app: INestApplication;
  let createQueryBuilder: any;
  let filememberService: FileMemberService;
  let repo: MockType<Repository<FileAttachment>>;
  let repoShareMember: MockType<ShareMemberRepository>;
  let repoLinkedCollectionObject: MockType<Repository<LinkedCollectionObject>>;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let deletedItemService: DeletedItemService;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;
  let fileAttachmentQueueService: MockType<FileAttachmentQueueService>;
  const user_id = 1;
  const email = 'test@flomail.net'
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileMemberService,
        DeletedItemService,
        {
          provide: FileAttachmentRepository,
          useFactory: repoMockFactory
        },
        {
          provide: ShareMemberRepository,
          useFactory: repoMockShareMemberFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(LinkedCollectionObject),
          useFactory: repoMockLinkCollecionObjectFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: FileAttachmentQueueService,
          useFactory: fileAttachmentQueueServiceMockFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: DatabaseUtilitiesService,
          useValue: {
            getAll: jest.fn((e) => e),
          },
        }
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    filememberService = module.get<FileMemberService>(FileMemberService);
    repo = module.get(FileAttachmentRepository);
    repoShareMember = module.get(ShareMemberRepository);
    repoLinkedCollectionObject = module.get(getRepositoryToken(LinkedCollectionObject));
    databaseUtilitiesService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    deletedItemService = module.get<any>(DeletedItemService);
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    fileAttachmentQueueService = module.get(FileAttachmentQueueService);
    deletedItemService = module.get<any>(DeletedItemService);
    createQueryBuilder = {
      select: jest.fn(() => createQueryBuilder),
      addSelect: jest.fn(() => createQueryBuilder),
      innerJoin: jest.fn(() => createQueryBuilder),
      where: jest.fn(() => createQueryBuilder),
      andWhere: jest.fn(() => createQueryBuilder),
      execute: jest.fn(() => createQueryBuilder),
      limit: jest.fn(() => createQueryBuilder),
      getRawOne: jest.fn(() => createQueryBuilder),
    };
    repoShareMember.createQueryBuilder = jest.fn(() => createQueryBuilder);
  });

  it('should be defined', () => {
    expect(filememberService).toBeDefined();
    expect(databaseUtilitiesService).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(apiLastModifiedQueueService).toBeDefined();
    expect(fileAttachmentQueueService).toBeDefined();
  });

  it('checkPermissionMember should be call', async () => {
    const option = {
      collection_id: 1,
      member_user_id: 1,
      shared_status: SHARE_STATUS.JOINED,
      access: [MEMBER_ACCESS.READ_WRITE]
    }
    const mockdata = {
      owner_email: 'user_test123@flomail.net',
      owner_user_id: 123,
      id: 1
    }

    filememberService.checkPermissionMember = jest.fn().mockResolvedValue(mockdata);
    const rs = await filememberService.checkPermissionMember(option);
    expect(rs).toEqual(mockdata);
  });

  it('checkPermissionMemberFile should be call', async () => {
    const option = {
      collection_id: 1,
      member_user_id: 1,
      shared_status: SHARE_STATUS.JOINED,
      access: [MEMBER_ACCESS.READ_WRITE]
    }
    await filememberService.checkPermissionMember(option);
    expect(repoShareMember.createQueryBuilder).toBeCalled();
  });

  it('createMemberForDeleteItem should be call', async () => {
    const mockupMembers: ShareMember[] = [
      { member_user_id: 41834, shared_email: 'abc@flodev.net' } as ShareMember,
      { member_user_id: 39552, shared_email: 'abc1@flodev.net' } as ShareMember
    ];
    const mockupItemDelete = { collectionId: 244751, itemId: 3508, updatedDate: 1651046757.815 }

    const rs = await filememberService.createMemberForDeleteItem(mockupMembers, mockupItemDelete);
    expect(rs[0].memberId).toEqual(mockupMembers[0].member_user_id);
  });

  it('deleteFileWasabi should be call', async () => {
    await filememberService.deleteFileWasabi(1, '2af0fd8c-65db-46f0-ad2a-228c69432a57', 'jpg');
    expect(fileAttachmentQueueService.addJob).toBeCalledTimes(1);
  });

  describe('Sync member file', () => {
    const entity1 = FakeData.fakeFileMember();
    const entity2 = FakeData.fakeFileMember();
    it('should return [] if share member do not have data', async () => {
      const req = {
        page_size: 10,
        has_del: 0,
        modified_gte: 1247872251.212,
        modified_lt: 1247872251.212,
        ids: []
      } as BaseGetDTO;

      repoShareMember.find = jest.fn().mockReturnValue([]);

      const result = await filememberService.getAllFiles(req, user_id);
      expect(result.data).toEqual([]);
      expect(result.data_del).toEqual([]);
    });

    it('should return delete member files', async () => {
      const req = {
        page_size: 10,
        has_del: 1,
      } as BaseGetDTO;

      const mockDataDel = [
        {
          "id": 117015,
          "item_id": 3505,
          "item_uid": null,
          "is_recovery": 0,
          "created_date": 1651040669.181,
          "updated_date": 1651040669.181
        },
        {
          "id": 117020,
          "item_id": 3505,
          "item_uid": null,
          "is_recovery": 0,
          "created_date": 1651041171.852,
          "updated_date": 1651041171.852
        },
      ]

      repoShareMember.find = jest.fn().mockReturnValue([]);

      databaseUtilitiesService.syncFileByMember = jest.fn().mockReturnValueOnce([]);
      deletedItemService.findAll = jest.fn().mockReturnValue(mockDataDel);

      const result = await filememberService.getAllFiles(req, user_id);
      expect(deletedItemService.findAll).toBeCalledTimes(1);
      expect(result.data_del).toHaveLength(2);
    });

    it('should get all files', async () => {
      const req = {
        page_size: 10,
        has_del: 0,
        modified_gte: 1247872251.212,
        modified_lt: 1247872251.212,
        ids: []
      } as BaseGetDTO;

      repoShareMember.find = jest.fn().mockReturnValue([
        { collection_id: 7069 },
        { collection_id: 244740 },
        { collection_id: 244750 },
        { collection_id: 244751 },
        { collection_id: 244754 },
        { collection_id: 244778 },
        { collection_id: 244780 }]);

      databaseUtilitiesService.syncFileByMember = jest.fn().mockReturnValueOnce([
        entity1, entity2
      ]);
      deletedItemService.findAll = jest.fn().mockReturnValueOnce([]);

      const result = await filememberService.getAllFiles(req, user_id);
      expect(databaseUtilitiesService.syncFileByMember).toBeCalledTimes(1);
      expect(deletedItemService.findAll).toBeCalledTimes(0);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual(entity1)
      expect(result.data_del).toEqual([]);
    });
  });

  describe('upload single file', () => {
    const mockItemShare = {
      owner_email: 'user_test123@flomail.net',
      owner_user_id: 123,
      id: 1
    }
    const mockLCONoTrashed = {
      id: 1,
      is_trashed: 0
    }
    const mockLCOTrashed = {
      id: 1,
      is_trashed: 1
    }

    it('should return access denied', async () => {
      const file = {
        size: 1,
        mimetype: 'audio',
        filename: 'test'
      };
      filememberService.checkPermissionMember = jest.fn().mockResolvedValueOnce(false);
      try {
        const rs = await filememberService.fileSingleUpload({ uid: true } as any,
          file as any, '', fakeReq);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.response.message).toEqual(MSG_ERR_LINK.COLLECTION_NOT_EDIT_PER);
      }
    });

    it('should return link does not exist', async () => {
      const file = {
        size: 1,
        mimetype: 'audio',
        filename: 'test'
      };
      filememberService.checkPermissionMember = jest.fn().mockResolvedValueOnce(mockItemShare);
      repoLinkedCollectionObject.findOne = jest.fn().mockResolvedValueOnce(false);
      try {
        const rs = await filememberService.fileSingleUpload({ uid: true, object_uid: 'abc' } as any,
          file as any, '', fakeReq);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.response.message).toEqual(MSG_ERR_LINK.LINK_NOT_EXIST);
      }
    });

    it('should return link is trashed', async () => {
      const file = {
        size: 1,
        mimetype: 'audio',
        filename: 'test'
      };

      filememberService.checkPermissionMember = jest.fn().mockResolvedValue(mockItemShare);
      repoLinkedCollectionObject.findOne = jest.fn().mockResolvedValueOnce(mockLCOTrashed);

      try {
        await filememberService.fileSingleUpload({ uid: true, object_uid: 'abc' } as any,
          file as any, '', fakeReq);
      } catch (e) {
        expect(e.response.message).toEqual(MSG_ERR_LINK.LINK_TRASHED);
      }
      expect(filememberService.checkPermissionMember).toBeCalledTimes(1);

    });

    it('should upload single file with uid and fail when upload', async () => {
      const file = {
        size: 1,
        mimetype: 'audio',
        filename: 'test'
      };


      filememberService.checkPermissionMember = jest.fn().mockResolvedValue(mockItemShare);
      repoLinkedCollectionObject.findOne = jest.fn().mockResolvedValueOnce(mockLCONoTrashed);

      filememberService.uploadPrivateFile = jest.fn().mockResolvedValueOnce(false);
      try {
        await filememberService.fileSingleUpload({ uid: true, object_uid: 'abc' } as any,
          file as any, '', fakeReq);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
      expect(filememberService.checkPermissionMember).toBeCalledTimes(1);
      expect(filememberService.uploadPrivateFile).toBeCalledTimes(1);
    });

    it('should upload single file with uid and success', async () => {
      const file = {
        size: 1,
        mimetype: 'audio',
        filename: 'test'
      };
      filememberService.checkPermissionMember = jest.fn().mockResolvedValueOnce(mockItemShare);
      repoLinkedCollectionObject.findOne = jest.fn().mockResolvedValueOnce(mockLCONoTrashed);
      filememberService.uploadPrivateFile = jest.fn().mockResolvedValueOnce(true);
      repo.update = jest.fn();
      apiLastModifiedQueueService.addJob = jest.fn().mockResolvedValueOnce(true);
      await filememberService.fileSingleUpload({ uid: true, object_uid: 'abc' } as any,
        file as any, '', fakeReq);

      expect(filememberService.checkPermissionMember).toBeCalledTimes(1);
      expect(filememberService.uploadPrivateFile).toBeCalledTimes(1);
    });

    it('should upload single file without uid and upload fail', async () => {
      const file = {
        size: 1,
        mimetype: 'audio',
        filename: 'test'
      };
      filememberService.checkPermissionMember = jest.fn().mockResolvedValue(mockItemShare);
      repoLinkedCollectionObject.findOne = jest.fn().mockResolvedValueOnce(mockLCONoTrashed);

      filememberService.uploadPrivateFile = jest.fn().mockResolvedValueOnce(false);
      try {
        await filememberService.fileSingleUpload({ object_uid: 'abc' } as any,
          file as any, '', fakeReq);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
      expect(filememberService.uploadPrivateFile).toBeCalledTimes(1);
    });

    it('should upload single file without uid and success', async () => {
      const file = {
        size: 1,
        mimetype: 'audio',
        filename: 'test'
      };
      filememberService.checkPermissionMember = jest.fn().mockResolvedValue(mockItemShare);
      repoLinkedCollectionObject.findOne = jest.fn().mockResolvedValueOnce(mockLCONoTrashed);
      repoShareMember.find = jest.fn().mockResolvedValue([
        { member_user_id: 1 },
        { member_user_id: 2 },
        { member_user_id: 3 }
      ]);

      filememberService.uploadPrivateFile = jest.fn().mockResolvedValueOnce(true);
      repo.create = jest.fn().mockReturnValueOnce({});
      repo.save = jest.fn().mockResolvedValueOnce({});
      apiLastModifiedQueueService.addJob = jest.fn().mockResolvedValueOnce(true);
      await filememberService.fileSingleUpload({ object_uid: 'abc' } as any,
        file as any, '', fakeReq);
      expect(repo.create).toBeCalledTimes(1);
      expect(repo.save).toBeCalledTimes(1);
      expect(filememberService.uploadPrivateFile).toBeCalledTimes(1);
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(4);
    });

    it('should return item not found', async () => {
      const file = {
        size: 1,
        mimetype: 'audio',
        filename: 'test'
      };
      filememberService.checkPermissionMember = jest.fn().mockResolvedValue(mockItemShare);
      repoLinkedCollectionObject.findOne = jest.fn().mockResolvedValueOnce(mockLCONoTrashed);
      repo.findOne = jest.fn().mockReturnValue(false);
      try {
        await filememberService.fileSingleUpload({ object_uid: 'abc' } as any,
          file as any, '', fakeReq);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.response.message).toEqual(MSG_FIND_NOT_FOUND);
      }
    });

    it('should upload single file without uid and have BadRequestException', async () => {
      const file = {
        size: 1,
        mimetype: 'audio',
        filename: 'test'
      };
      filememberService.uploadPrivateFile = jest.fn().mockRejectedValueOnce('fail');
      try {
        await filememberService.fileSingleUpload({ object_uid: 'abc' } as any,
          file as any, '', fakeReq);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('should upload single file without uid and have InternalServerErrorException', async () => {
      const file = {
        size: 1,
        mimetype: 'audio',
        filename: 'test'
      };
      filememberService.checkPermissionMember = jest.fn().mockResolvedValue(mockItemShare);
      repoLinkedCollectionObject.findOne = jest.fn().mockResolvedValueOnce(mockLCONoTrashed);
      filememberService.uploadPrivateFile = jest.fn().mockRejectedValueOnce('fail');
      try {
        await filememberService.fileSingleUpload({ object_uid: 'abc' } as any,
          file as any, '', fakeReq);
      } catch (e) {
        expect(e).toBeInstanceOf(InternalServerErrorException);
      }
      expect(filememberService.uploadPrivateFile).toBeCalledTimes(1);
    });

    it('should upload private file and fail', async () => {
      mS3Instance.promise = jest.fn().mockRejectedValue('fail');
      await filememberService.uploadPrivateFile('fake' as any, 'img', '')
        .then((rs) => {
          expect(rs).toEqual(false);
          expect(mS3Instance.promise).rejects.toEqual('fail');
        });
    });

  });

  describe('download single file', () => {
    it('should return fail when no permission', async () => {
      filememberService.checkPermissionMember = jest.fn()
        .mockResolvedValueOnce(undefined);
      try {
        await filememberService.downloadSingleFile({ uid: 1, collection_id: 2 } as any, user_id);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('should return false if there is no link collection object', async () => {
      filememberService.checkPermissionMember = jest.fn()
        .mockResolvedValueOnce({ id: 1, user_id: 1 });

      databaseUtilitiesService.syncFileMemberByObjectUid = jest.fn()
        .mockResolvedValueOnce(undefined);
      try {
        const rs = await filememberService.downloadSingleFile({ uid: 1, collection_id: 2 } as any, user_id);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('should return bad request exception when s3 can not download', async () => {
      filememberService.checkPermissionMember = jest.fn()
        .mockResolvedValueOnce({ id: 1, user_id: 1 });

      databaseUtilitiesService.syncFileMemberByObjectUid = jest.fn()
        .mockResolvedValueOnce({
          owner: 'quangadmin_dev_lead@flodev.net',
          ext: 'jpg',
          id: 1,
          trashed: 0
        });
      try {
        mS3Instance.promise = jest.fn().mockRejectedValue('fail');
        await filememberService.downloadSingleFile({ uid: 1, collection_id: 2 } as any, user_id);
      } catch (e) {
        expect(e.response).toEqual({
          code: ErrorCode.BAD_REQUEST,
          message: MSG_ERR_DOWNLOAD,
          attributes: { uid: 1, collection_id: 2 }
        });
      }
    });

    it('should return link is trashed', async () => {
      filememberService.checkPermissionMember = jest.fn()
        .mockResolvedValueOnce({ id: 1, user_id: 1 });

      databaseUtilitiesService.syncFileMemberByObjectUid = jest.fn()
        .mockResolvedValueOnce({
          owner: 'quangadmin_dev_lead@flodev.net',
          ext: 'jpg',
          id: 1,
          trashed: 1
        });
      try {
        mS3Instance.promise = jest.fn().mockRejectedValue('fail');
        await filememberService.downloadSingleFile({ uid: 1, collection_id: 2 } as any, user_id);
      } catch (e) {
        expect(e.response.message).toEqual(MSG_ERR_LINK.LINK_TRASHED);
      }
    });

    it('should return data', async () => {
      filememberService.checkPermissionMember = jest.fn()
        .mockResolvedValueOnce({ id: 1, user_id: 1 });

      databaseUtilitiesService.syncFileMemberByObjectUid = jest.fn()
        .mockResolvedValueOnce({
          owner: 'quangadmin_dev_lead@flodev.net',
          ext: 'jpg',
          id: 1,
          trashed: 0
        });
      mS3Instance.promise = jest.fn().mockResolvedValueOnce({ Body: 'fake' });
      const { PassThrough } = require('stream');
      const mockedStream = new PassThrough();
      mockedStream.emit('data', 'fake');
      // jest.spyOn(filememberService, 'createMemberForDeleteItem').mockResolvedValue([{ member_user_id: 41834 }]);
      const rs = await filememberService.downloadSingleFile({ uid: 1, collection_id: 2 } as any, user_id);
      expect(rs.stream).toHaveLength;
      expect(rs.resContent).toEqual({
        'Content-Disposition': 'attachment',
        'Content-Type': 'jpg',
        'Content-Length': 4
      });
    });
  });

  describe('Delete file', () => {
    const item_1 = FakeData.fakeDeleteFileDTO();
    const item_2 = FakeData.fakeDeleteFileDTO();
    const dataDto = [item_1, item_2];

    it('should return fail if no permission', async () => {
      filememberService.checkPermissionMember = jest.fn()
        .mockResolvedValueOnce(undefined);
      try {
        await filememberService.deleteMemberFile(dataDto, fakeReq);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('should return false if there is no link collection object', async () => {
      filememberService.checkPermissionMember = jest.fn()
        .mockResolvedValueOnce({ id: 1, user_id: 1 });

      databaseUtilitiesService.syncFileMemberByObjectUid = jest.fn()
        .mockResolvedValueOnce(undefined);
      try {
        await filememberService.deleteMemberFile(dataDto, fakeReq);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('should delete data', async () => {
      filememberService.checkPermissionMember = jest.fn()
        .mockResolvedValueOnce({ id: 1, user_id: 1 });

      databaseUtilitiesService.syncFileMemberByObjectUid = jest.fn()
        .mockResolvedValueOnce({
          owner: 'quangadmin_dev_lead@flodev.net',
          ext: 'jpg',
          id: 1
        });

      const rs = await filememberService.deleteMemberFile(dataDto, fakeReq);
      expect(rs.itemFail[0].message).toEqual(MSG_ERR_LINK.COLLECTION_NOT_EDIT_PER)
      expect(rs.itemFail[1].message).toEqual(MSG_ERR_WHEN_DELETE)

    });
  });

  afterAll(async () => {
    await app.close();
  });
});
