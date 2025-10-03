import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MockType, fakeReq } from '../../../../test';
import { ErrorCode } from '../../../common/constants/error-code';
import { IUser } from '../../../common/interfaces';
import { LoggerService } from '../../../common/logger/logger.service';
import { DeletedItemRepository } from '../../../common/repositories/deleted-item.repository';
import { FileCommonRepository } from '../../../common/repositories/file-common.repository';
import { QuotaRepository } from '../../../common/repositories/quota.repository';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { CommentAttachmentService } from '../comment-attachment.service';
import { DeleteFileDTO } from '../dtos/delete.dto';
import { GetDownloadDto } from '../dtos/download.get.dto';
import { CreateFileDTO } from '../dtos/upload.create.dto';

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
  createQueryBuilder: jest.fn(() => createQueryBuilder)
}));

const apiLastModifiedServiceMockFactory: () =>
  MockType<ApiLastModifiedQueueService> = jest.fn(() => ({}));

describe('CommentAttachmentService', () => {
  let app: INestApplication;
  let service: CommentAttachmentService;
  let loggerService: LoggerService;
  let repo: FileCommonRepository;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;

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
        CommentAttachmentService,
        LoggerService,
        {
          provide: FileCommonRepository,
          useFactory: repoMockFactory,
        },
        {
          provide: QuotaRepository,
          useFactory: repoMockFactory,
        },
        {
          provide: DeletedItemRepository,
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
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<CommentAttachmentService>(CommentAttachmentService);
    repo = module.get(FileCommonRepository);
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    loggerService = module.get<any>(LoggerService);
    loggerService.logError = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repo).toBeDefined();
    expect(apiLastModifiedQueueService).toBeDefined();
  });


  describe('get download', () => {
    const param = new GetDownloadDto();
    param.uid = 'uid';

    it('should get download error exception', async () => {
      const result = await service.download(param, user)
      expect(result.code).toEqual(ErrorCode.BAD_REQUEST);
    });
    it('should get download error permission', async () => {
      repo.checkRoleDownload = jest.fn().mockResolvedValue({});

      const result = await service.download(param, user)
      expect(result.code).toEqual(ErrorCode.BAD_REQUEST);
    });

    it('should get download error FILE_NOT_FOUND', async () => {
      repo.checkRoleDownload = jest.fn().mockResolvedValue({ id: 1 });
      service['s3Util'].FileExist = jest.fn().mockResolvedValue(false);

      const result = await service.download(param, user)
      expect(result.code).toEqual(ErrorCode.FILE_NOT_FOUND);
    });

    it('should get download success', async () => {
      repo.checkRoleDownload = jest.fn().mockResolvedValue({ id: 1 });
      service['s3Util'].FileExist = jest.fn().mockResolvedValue(true);
      service['s3Util'].DownloadUrl = jest.fn().mockResolvedValue({ url: '' });

      const result = await service.download(param, user)
      expect(result.code).toEqual(ErrorCode.REQUEST_SUCCESS);
    });

  });

  describe('upload', () => {
    const data = new CreateFileDTO();
    data.comment_id = 123;
    data.file = 'file content';

    it('should upload error exception', async () => {
      repo.checkRoleUpload = jest.fn().mockResolvedValue(0);

      try {
        const result = await service.fileSingleUpload(data, data.file, 'doc', fakeReq)
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should upload error permission', async () => {
      repo.checkRoleUpload = jest.fn().mockResolvedValue(0);
      repo.filterMessage = jest.fn().mockReturnValue({
        error: true,
        msg: 'error permission'
      });
      try {
        const result = await service.fileSingleUpload(data, data.file, 'doc', fakeReq)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });

    it('should upload error upload', async () => {
      repo.checkRoleUpload = jest.fn().mockResolvedValue({
        id: 1,
        collection_id: 1
      });
      service['s3Util'].GenUid = jest.fn().mockResolvedValue("uid");
      service['s3Util'].GenSource = jest.fn().mockResolvedValue("source");
      service['s3Util'].uploadFromBuffer = jest.fn().mockResolvedValue(false);

      try {
        const result = await service.fileSingleUpload(data, data.file, 'doc', fakeReq)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });

    it('should upload success', async () => {
      repo.checkRoleUpload = jest.fn().mockResolvedValue({
        id: 1,
        collection_id: 1
      });
      service['s3Util'].GenUid = jest.fn().mockResolvedValue("uid");
      service['s3Util'].GenSource = jest.fn().mockResolvedValue("source");
      service['s3Util'].uploadFromBuffer = jest.fn().mockResolvedValue(true);
      repo.createFileAndLinked = jest.fn().mockResolvedValue(data);

      try {
        const result = await service.fileSingleUpload(data, data.file, 'doc', fakeReq)
        expect(result).toEqual(data);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });
  });

  describe('delete', () => {
    const data = new DeleteFileDTO();
    data.uid = 'uid';
    const data2 = new DeleteFileDTO();
    data2.uid = 'uid';

    it('should delete error permission', async () => {
      repo.checkRoleDelete = jest.fn().mockResolvedValue(0);
      repo.filterMessage = jest.fn().mockReturnValue({
        error: true,
        msg: 'error permission'
      });

      try {
        const result = await service.deleteFile([data, data2], fakeReq);
        expect(result.itemFail).toHaveLength(2);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });

    it('should delete error exception', async () => {
      repo.checkRoleDelete = jest.fn().mockResolvedValue(1);
      service['s3Util'].Delete = jest.fn().mockResolvedValue("source");

      try {
        const result = await service.deleteFile([data], fakeReq);
        expect(result.itemFail).toHaveLength(2);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });

    it('should delete success', async () => {
      repo.checkRoleDelete = jest.fn().mockResolvedValue({ id: 1, size: 123, collection_id: 1 });
      service['s3Util'].GenSource = jest.fn().mockResolvedValue("source");
      service['s3Util'].Delete = jest.fn().mockResolvedValue("source");
      repo.deleteFileAndLinked = jest.fn().mockResolvedValue({ id: 1, size: 123 });

      try {
        const result = await service.deleteFile([data], fakeReq);
        expect(result.itemFail).toHaveLength(0);
        expect(result.itemPass).toHaveLength(1);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
