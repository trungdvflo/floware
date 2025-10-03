import { BadRequestException, INestApplication, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { OBJ_TYPE } from '../../../common/constants';
import { BaseGetDTO } from '../../../common/dtos/base-get.dto';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { TrashEntity } from '../../../common/entities/trash.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import { ShareMemberRepository } from '../../../common/repositories';
import { FileAttachmentRepository } from '../../../common/repositories/file-attachment.repository';
import { LinkedCollectionObjectRepository } from '../../../common/repositories/linked-collection-object.repository';
import { ApiLastModifiedQueueService } from '../../../modules/bullmq-queue/api-last-modified-queue.service';
import { FileAttachmentQueueService } from '../../../modules/bullmq-queue/file-queue.service';
import * as Generator from '../../../modules/link/collection/test/faker';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { FileService } from '../file-attachment.service';

const mS3Instance = {
  upload: jest.fn().mockReturnThis(),
  promise: jest.fn().mockResolvedValueOnce({ Body: 'asdas' }),
  getObject: jest.fn().mockReturnThis(),
  putObject: jest.fn().mockReturnThis()
};
const repoTrashMockFactory = jest.fn(() => ({
  findOne: jest.fn(entity => entity),
}));

const linkedCollectionObjectRepository: () => MockType<LinkedCollectionObjectRepository> = jest.fn(() => ({
  findByObjUid: jest.fn(entity => entity),
  find: jest.fn(entity => entity),
  findOne: jest.fn((id: number) => id),
  save: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  insert: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  remove: jest.fn(entity => entity),
  LinkedCollectionObjectRepository: jest.fn(entity => ([
    Generator.fakeEntity(OBJ_TYPE.VCARD),
    Generator.fakeEntity(OBJ_TYPE.EMAIL)
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
  getCollectionIdByObjectUid: jest.fn().mockReturnValue(1234123)
}));

const repoMockFactory = jest.fn(() => ({
  save: jest.fn(entity => {
    entity.id = 1;
    return entity;
  }),
  find: jest.fn(entity => entity),
  findOne: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  findShareMembers: jest.fn(entity => []),
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
  jest.fn(() => ({
    addJob: jest.fn(entity => entity),
    addJobCollection: jest.fn(entity => entity)
  }));

const fileAttachmentQueueServiceMockFactory: () => MockType<FileAttachmentQueueService> =
  jest.fn(() => ({ addJob: jest.fn(entity => entity) }));



jest.mock('aws-sdk', () => {
  return { S3: jest.fn(() => mS3Instance) };
});

const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({}));

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockImplementationOnce((arg: any) => {
    return arg;
  });
  res.set = jest.fn().mockImplementationOnce((arg: any) => {
    return arg;
  });
  return res;
};

describe('FileService', () => {
  let app: INestApplication;
  let fileService: FileService;
  let loggerService: LoggerService;
  let repo: MockType<FileAttachmentRepository>;
  let shareMemberRepo: MockType<ShareMemberRepository>;
  let trashRepo: MockType<Repository<TrashEntity>>;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let deletedItemService: DeletedItemService;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;
  let fileAttachmentQueueService: MockType<FileAttachmentQueueService>;
  let linkedCollectionObjectRepo: MockType<LinkedCollectionObjectRepository>;

  const user_id = 1;
  const email = 'test@flomail.net'
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        DeletedItemService,
        LoggerService,
        {
          provide: FileAttachmentRepository,
          useFactory: repoMockFactory
        },
        {
          provide: ShareMemberRepository,
          useFactory: repoMockFactory
        },
        {
          provide: getRepositoryToken(TrashEntity),
          useFactory: repoTrashMockFactory
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
          provide: FileAttachmentQueueService,
          useFactory: fileAttachmentQueueServiceMockFactory
        },
        {
          provide: LinkedCollectionObjectRepository,
          useFactory: linkedCollectionObjectRepository
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

    fileService = module.get<FileService>(FileService);
    repo = module.get(FileAttachmentRepository);
    shareMemberRepo = module.get(ShareMemberRepository);
    trashRepo = module.get(getRepositoryToken(TrashEntity));
    databaseUtilitiesService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    deletedItemService = module.get<any>(DeletedItemService);
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    fileAttachmentQueueService = module.get(FileAttachmentQueueService);
    deletedItemService = module.get<any>(DeletedItemService);
    loggerService = module.get<any>(LoggerService);
    linkedCollectionObjectRepo = module.get(LinkedCollectionObjectRepository);
  });

  it('should be defined', () => {
    expect(fileService).toBeDefined();
  });

  it('should get all files', async () => {
    databaseUtilitiesService.getAll = jest.fn().mockReturnValueOnce([]);
    deletedItemService.findAll = jest.fn().mockReturnValueOnce([]);
    const result = await fileService.getAllFiles({ has_del: 1 } as BaseGetDTO, user_id);
    expect(databaseUtilitiesService.getAll).toBeCalledTimes(1);
    expect(deletedItemService.findAll).toBeCalledTimes(1);
    expect(result.data).toEqual([]);
    expect(result.data_del).toEqual([]);
  });

  it('should download single file and fail', async () => {

    fileService.findItemFile = jest.fn()
      .mockResolvedValueOnce(null);
    try {
      await fileService.downloadSingleFile({ uid: 1, object_uid: 'abc' } as any, fakeReq);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });

  it('should download single file and success', async () => {
    mS3Instance.promise = jest.fn().mockResolvedValueOnce({ Body: 'fake' });
    fileService.findItemFile = jest.fn()
      .mockResolvedValueOnce({ ext: 'mp3' });
    const { PassThrough } = require('stream');
    const mockedStream = new PassThrough();
    mockedStream.emit('data', 'fake');
    fileService.getReadableStream = jest.fn().mockReturnValueOnce(mockedStream);
    await fileService.downloadSingleFile({ uid: 1, object_uid: 'abc' } as any, fakeReq);
  });

  it('should upload single file with uid and return Object uid is trashed', async () => {
    const file = {
      size: 1,
      mimetype: 'audio',
      filename: 'test'
    };
    trashRepo.findOne = jest.fn().mockResolvedValueOnce({ id: 100 });
    try {
      await fileService.fileSingleUpload({ uid: true, object_uid: 'abc' } as any,
        file as any, '', fakeReq);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });

  it('should upload single file with uid and return Object uid is deleted', async () => {
    const file = {
      size: 1,
      mimetype: 'audio',
      filename: 'test'
    };
    trashRepo.findOne = jest.fn().mockResolvedValueOnce(false);
    deletedItemService.findOneByUid = jest.fn().mockResolvedValueOnce(true);
    try {
      await fileService.fileSingleUpload({ uid: true, object_uid: 'abc' } as any,
        file as any, '', fakeReq);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });

  it('should upload single file with uid and not found item', async () => {
    const file = {
      size: 1,
      mimetype: 'audio',
      filename: 'test'
    };
    trashRepo.findOne = jest.fn().mockResolvedValueOnce(false);
    deletedItemService.findOneByUid = jest.fn().mockResolvedValueOnce(false);
    fileService.findItemFile = jest.fn().mockResolvedValueOnce(false);
    try {
      await fileService.fileSingleUpload({ uid: true, object_uid: 'abc' } as any,
        file as any, '', fakeReq);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
    expect(fileService.findItemFile).toBeCalledTimes(1);
  });

  it('should upload single file with uid and fail when upload', async () => {
    const file = {
      size: 1,
      mimetype: 'audio',
      filename: 'test'
    };
    trashRepo.findOne = jest.fn().mockResolvedValueOnce(false);
    deletedItemService.findOneByUid = jest.fn().mockResolvedValueOnce(false);
    fileService.findItemFile = jest.fn().mockResolvedValueOnce(true);
    fileService.uploadPrivateFile = jest.fn().mockResolvedValueOnce(false);
    try {
      await fileService.fileSingleUpload({ uid: true, object_uid: 'abc' } as any,
        file as any, '', fakeReq);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
    expect(fileService.findItemFile).toBeCalledTimes(1);
    expect(fileService.uploadPrivateFile).toBeCalledTimes(1);
  });

  it('should upload single file with uid and success', async () => {
    const file = {
      size: 1,
      mimetype: 'audio',
      filename: 'test'
    };
    trashRepo.findOne = jest.fn().mockResolvedValueOnce(false);
    deletedItemService.findOneByUid = jest.fn().mockResolvedValueOnce(false);
    fileService.findItemFile = jest.fn().mockResolvedValueOnce(true);
    fileService.uploadPrivateFile = jest.fn().mockResolvedValueOnce(true);
    repo.update = jest.fn();
    shareMemberRepo.find = jest.fn().mockResolvedValueOnce([{member_user_id: 1}]);
    apiLastModifiedQueueService.addJob = jest.fn().mockResolvedValueOnce(true);
    await fileService.fileSingleUpload({ uid: true, object_uid: 'abc' } as any,
      file as any, '', fakeReq);
    expect(fileService.findItemFile).toBeCalledTimes(1);
    expect(fileService.uploadPrivateFile).toBeCalledTimes(1);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(2);
  });

  it('should upload single file without uid and success', async () => {
    const file = {
      size: 1,
      mimetype: 'audio',
      filename: 'test'
    };
    trashRepo.findOne = jest.fn().mockResolvedValueOnce(false);
    deletedItemService.findOneByUid = jest.fn().mockResolvedValueOnce(false);
    fileService.uploadPrivateFile = jest.fn().mockResolvedValueOnce(true);
    repo.create = jest.fn().mockReturnValueOnce({});
    repo.save = jest.fn().mockResolvedValueOnce({});
    shareMemberRepo.find = jest.fn().mockResolvedValueOnce([{member_user_id: 1}]);
    apiLastModifiedQueueService.addJob = jest.fn().mockResolvedValueOnce(true);
    await fileService.fileSingleUpload({ object_uid: 'abc' } as any,
      file as any, '', fakeReq);
    expect(repo.create).toBeCalledTimes(1);
    expect(repo.save).toBeCalledTimes(1);
    expect(fileService.uploadPrivateFile).toBeCalledTimes(1);
    expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(2);
  });

  it('should upload single file without uid and upload fail', async () => {
    const file = {
      size: 1,
      mimetype: 'audio',
      filename: 'test'
    };
    trashRepo.findOne = jest.fn().mockResolvedValueOnce(false);
    deletedItemService.findOneByUid = jest.fn().mockResolvedValueOnce(false);
    fileService.uploadPrivateFile = jest.fn().mockResolvedValueOnce(false);
    try {
      await fileService.fileSingleUpload({ object_uid: 'abc' } as any,
        file as any, '', fakeReq);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
    expect(fileService.uploadPrivateFile).toBeCalledTimes(1);
  });

  it('should upload single file without uid and have internal error', async () => {
    const file = {
      size: 1,
      mimetype: 'audio',
      filename: 'test'
    };
    trashRepo.findOne = jest.fn().mockResolvedValueOnce(false);
    deletedItemService.findOneByUid = jest.fn().mockResolvedValueOnce(false);
    loggerService.logError = jest.fn();
    fileService.uploadPrivateFile = jest.fn().mockRejectedValueOnce('fail');
    try {
      await fileService.fileSingleUpload({ object_uid: 'abc' } as any,
        file as any, '', fakeReq);
    } catch (e) {
      expect(e).toBeInstanceOf(InternalServerErrorException);
    }
    expect(fileService.uploadPrivateFile).toBeCalledTimes(1);
  });

  it('should upload private file and success', async () => {
    const rs = await fileService.uploadPrivateFile('fake' as any, 'img', '');
    expect(mS3Instance.upload).toBeCalledTimes(1);
    expect(rs).toEqual(true);
  });

  it('should upload private file and fail', async () => {
    mS3Instance.promise = jest.fn().mockRejectedValue('fail');
    loggerService.logError = jest.fn();
    await fileService.uploadPrivateFile('fake' as any, 'img', '')
      .then((rs) => {
        expect(rs).toEqual(false);
        expect(mS3Instance.promise).rejects.toEqual('fail');
      });
  });


  it('should find item file', async () => {
    repo.findOne = jest.fn();
    fileService.findItemFile('fake');
    expect(repo.findOne).toBeCalledTimes(1);
  });

  it('should get readable stream', async () => {
    fileService.getReadableStream('fake' as any);
  });

  it('should delete file wasabi', async () => {
    fileAttachmentQueueService.addJob = jest.fn();
    await fileService.deleteFileWasabi(1, '1', 'img');
    expect(fileAttachmentQueueService.addJob).toBeCalledTimes(1);
  });

  it('should delete file', async () => {
    const data = [
      {
        "id": "0441e3c7-6469-4a9a-b1fc-637e8c881fa1",
        "mod": 0
      },
      {
        "id": "0441e3c7-6469-4a9a-b1fc-637e8c881fa2",
        "mod": 1
      },
      {
        "id": "0441e3c7-6469-4a9a-b1fc-637e8c881fa3",
        "mod": 0
      },
      {
        "id": "0441e3c7-6469-4a9a-b1fc-637e8c881fa4",
        "mod": 1
      }
    ];
    loggerService.logError = jest.fn();
    fileService.findItemFile = jest.fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce('fail');
    fileService.deleteFileWasabi = jest.fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    deletedItemService.create = jest.fn().mockReturnValueOnce(true);
    repo.delete = jest.fn().mockResolvedValueOnce(true);
    apiLastModifiedQueueService.addJob = jest.fn().mockResolvedValueOnce(true);
    const rs = await fileService.deleteFile(data, fakeReq);
    expect(fileService.findItemFile).toBeCalledTimes(4);
    expect(fileService.deleteFileWasabi).toBeCalledTimes(2);
    expect(deletedItemService.create).toBeCalledTimes(1);
    expect(repo.delete).toBeCalledTimes(1);
    expect(rs.itemPass.length).toEqual(1);
    expect(rs.itemFail.length).toEqual(3);
  });

  afterAll(async () => {
    await app.close();
  });
});
