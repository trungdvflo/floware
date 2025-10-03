import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { ErrorCode } from '../../../common/constants/error-code';
import {
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_NOT_EXIST
} from '../../../common/constants/message.constant';
import { ErrorDTO } from '../../../common/dtos/error.dto';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { MetadataEmail } from '../../../common/entities/metadata-email.entity';
import { ThirdPartyAccount } from '../../../common/entities/third-party-account.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import { DatabaseUtilitiesService } from '../../../modules/database/database-utilities.service';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { MetadataEmailService } from '../metadata-email.service';
import * as Generator from './generator';

const repoMockFactory = jest.fn(() => ({
  save: jest.fn((entity) => {
    entity.id = 1;
    return entity;
  }),
  find: jest.fn((entity) => entity),
  findOne: jest.fn((entity) => entity),
  create: jest.fn((entity) => entity),
  update: jest.fn((entity) => entity),
  delete: jest.fn((entity) => entity),
  metadata: {
    ownColumns: [
      {
        databaseName: 'id',
      },
      {
        databaseName: 'user_id',
      },
      {
        databaseName: 'account_id',
      },
      {
        databaseName: 'from',
      },
      {
        databaseName: 'to',
      },
      {
        databaseName: 'cc',
      },
      {
        databaseName: 'bcc',
      },
      {
        databaseName: 'object_uid',
      },
      {
        databaseName: 'snippet',
      },
      {
        databaseName: 'subject',
      },
      {
        databaseName: 'created_date',
      },
      {
        databaseName: 'received_date',
      },
      {
        databaseName: 'sent_date',
      },
      {
        databaseName: 'updated_date',
      },
    ],
  },
}));
const repoMockThirdPartyAccountFactory = jest.fn(() => ({
  find: jest.fn((entity) => entity),
}));

const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({
  create: jest.fn((entity) => entity),
  save: jest.fn((entity) => entity),
}));

const apiLastModifiedServiceMockFactory: () => MockType<ApiLastModifiedQueueService> = jest.fn(
  () => ({ addJob: jest.fn((entity) => entity) }),
);

const deletedItemServiceMockFactory: () => MockType<DeletedItemService> = jest.fn(() => ({
  findAll: jest.fn((e) => e),
  create: jest.fn((e) => e),
}));

describe('MetadataEmailService', () => {
  let app: INestApplication;
  let service: MetadataEmailService;
  let repo: MockType<Repository<MetadataEmail>>;
  let thirdPartyAccountRepo: MockType<Repository<ThirdPartyAccount>>;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let deletedItemService: MockType<DeletedItemService>;
  let logger: LoggerService;
  const userId = 1;
  const fakeDeletedDate = 1;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        MetadataEmailService,
        DeletedItemService,
        DatabaseUtilitiesService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(MetadataEmail),
          useFactory: repoMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(ThirdPartyAccount),
          useFactory: repoMockThirdPartyAccountFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: DeletedItemService,
          useFactory: deletedItemServiceMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory,
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn((e) => e),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<MetadataEmailService>(MetadataEmailService);
    repo = module.get(getRepositoryToken(MetadataEmail));
    thirdPartyAccountRepo = module.get(getRepositoryToken(ThirdPartyAccount));
    deletedItemService = module.get(DeletedItemService);
    databaseUtilitiesService = module.get<any>(DatabaseUtilitiesService);
    logger = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find and return the metadata email', async () => {
    const obj = Generator.fakeEntity();
    repo.findOne.mockReturnValue(obj);
    const dto = await service.findOne(userId, obj.id);
    expect(dto).toEqual(obj);
  });

  it('should throw logger error when find metadata email', async () => {
    const obj = Generator.fakeEntity();
    const error = new Error('UNKNOWN ERROR');
    let thrownError;
    jest.spyOn(repo, 'findOne').mockImplementationOnce(() => {
      throw error;
    });

    try {
      await service.findOne(userId, obj.id);
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).toEqual(error);
  });

  it('should find and return list of metadata email', async () => {
    const obj1 = Generator.fakeEntity();
    const obj2 = Generator.fakeEntity();
    const mockResults = [obj1, obj2];
    databaseUtilitiesService.getAll = jest.fn().mockResolvedValue(mockResults);
    const fakeFilter = Generator.fakeFilter();
    fakeFilter.ids = [obj1.id, obj2.id];
    const allItems = await service.findAll(userId, fakeFilter);
    const { data } = allItems;
    expect(data[0].account_id).toEqual(mockResults[0].account_id);
    expect(data[0].subject).toEqual(mockResults[0].subject);
    expect(data[0].from.length).toEqual(mockResults[0].from.length);
    expect(data[0].to.length).toEqual(mockResults[0].to.length);
    expect(data[0].cc.length).toEqual(mockResults[0].cc.length);
    expect(data[0].bcc.length).toEqual(mockResults[0].bcc.length);
    expect(data[0].received_date).toEqual(mockResults[0].received_date);
    expect(data[0].sent_date).toEqual(mockResults[0].sent_date);
    expect(data[0].snippet).toEqual(mockResults[0].snippet);
  });

  it('should find and return list of metadata email and deleted metadata emails', async () => {
    const obj1 = Generator.fakeEntity();
    const obj2 = Generator.fakeEntity();
    const mockResults = [obj1, obj2];
    // repo.find.mockReturnValue(mockResults);
    databaseUtilitiesService.getAll = jest.fn().mockResolvedValue(mockResults);
    const mockDeletedItem = {
      item_id: 1,
      is_recovery: 0,
    };
    deletedItemService.findAll.mockReturnValue([mockDeletedItem]);

    const fakeFilter = Generator.fakeFilter();
    fakeFilter.ids = [obj1.id, obj2.id];
    const allItems = await service.findAll(userId, { ...fakeFilter, has_del: 1 });
    const { data, data_del } = allItems;
    expect(data[0].account_id).toEqual(mockResults[0].account_id);
    expect(data[0].subject).toEqual(mockResults[0].subject);
    expect(data[0].from.length).toEqual(mockResults[0].from.length);
    expect(data[0].to.length).toEqual(mockResults[0].to.length);
    expect(data[0].cc.length).toEqual(mockResults[0].cc.length);
    expect(data[0].bcc.length).toEqual(mockResults[0].bcc.length);
    expect(data[0].received_date).toEqual(mockResults[0].received_date);
    expect(data[0].sent_date).toEqual(mockResults[0].sent_date);
    expect(data[0].snippet).toEqual(mockResults[0].snippet);

    expect(data_del[0].item_id).toEqual(mockDeletedItem.item_id);
    expect(data_del[0].is_recovery).toEqual(mockDeletedItem.is_recovery);
  });

  it('should be success created metadata email', async () => {
    const createDto = Generator.fakeCreatedDTO();
    const created = await service.create(userId, createDto, 0);
    expect(created.account_id).toEqual(createDto.account_id);
    expect(created.subject).toEqual(createDto.subject);
    expect(created.received_date).toEqual(createDto.received_date);
    expect(created.sent_date).toEqual(createDto.sent_date);
    expect(created.snippet).toEqual(createDto.snippet);
  });

  it('should be success created metadata email with correct data', async () => {
    const createDto = Generator.fakeCreatedDTO();
    delete createDto.object_uid;
    const created = await service.create(userId, createDto, 0);
    expect(created.account_id).toEqual(createDto.account_id);
    expect(created.subject).toEqual(createDto.subject);
    expect(created.received_date).toEqual(createDto.received_date);
    expect(created.sent_date).toEqual(createDto.sent_date);
    expect(created.snippet).toEqual(createDto.snippet);
    expect(created.object_uid).toBeUndefined();
  });

  // it('should throw logger error when create metadata email failed', async () => {
  //   const error = new Error('UNKNOWN ERROR');
  //   let thrownError;
  //   jest.spyOn(repo, 'create').mockImplementationOnce(() => {
  //     throw error;
  //   });

  //   try {
  //     const createDto = Generator.fakeCreatedDTO();
  //     await service.create(userId, createDto, 0);
  //   } catch (err) {
  //     thrownError = err;
  //   }
  //   expect(thrownError).toEqual(error);
  // });

  it('should throw typeorm error when create metadata email failed', async () => {
    const createDto = Generator.fakeCreatedDTO();
    const error = {
      code: 'ER_DUP_ENTRY',
      errno: 1062,
      index: 0,
      message: `ER_DUP_ENTRY: Duplicate entry '0-\\x00\\x00\\x00{\\x00\\x00\\x00\\x00INBOX' for key 'uniq_on_account_id_and_object_uid'`,
      name: 'QueryFailedError',
    };
    repo.create.mockReturnValue(createDto);
    jest.spyOn(repo, 'save').mockImplementationOnce(() => {
      throw error;
    });
    let thrownError;
    try {
      await service.create(userId, createDto, 0);
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError.code).toEqual(ErrorCode.DUPLICATE_ENTRY);
    expect(thrownError.message).toEqual(MSG_ERR_DUPLICATE_ENTRY);
  });

  it('should be success created multipe metadata emails', async () => {
    const createDto1 = Generator.fakeCreatedDTO();
    const createDto2 = Generator.fakeCreatedDTO();
    thirdPartyAccountRepo.find.mockReturnValue([
      { id: createDto1.account_id },
      { id: createDto2.account_id },
    ]);
    const { created } = await service.createMultiple([createDto1, createDto2], fakeReq);
    expect(created[0].account_id).toEqual(createDto1.account_id);
    expect(created[0].subject).toEqual(createDto1.subject);
    expect(created[0].sent_date).toEqual(createDto1.sent_date);
    expect(created[0].snippet).toEqual(createDto1.snippet);

    expect(created[1].account_id).toEqual(createDto2.account_id);
    expect(created[1].subject).toEqual(createDto2.subject);
    expect(created[1].sent_date).toEqual(createDto2.sent_date);
    expect(created[1].snippet).toEqual(createDto2.snippet);
  });

  it('should return error when create multiple metadata emails failed', async () => {
    const createDto1 = Generator.fakeCreatedDTO();
    const createDto2 = Generator.fakeCreatedDTO();
    thirdPartyAccountRepo.find.mockReturnValue([
      { id: createDto1.account_id },
      { id: createDto2.account_id },
    ]);
    const error = new Error();
    jest.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw error;
    });
    const { errors } = await service.createMultiple([createDto1, createDto2], fakeReq);
    expect(errors.length).toEqual(1);
  });

  it('should be success update metadata email', async () => {
    const updateDto = Generator.fakeUpdateDTO();
    repo.update.mockReturnValue({
      data: updateDto,
      affected: 1,
    });
    repo.findOne.mockReturnValue(updateDto);
    const updated = await service.update(userId, updateDto, 0);
    expect(updated.message_id).toEqual(updateDto.message_id);
    expect(updated.object_type).toEqual(updateDto.object_type);
    expect(updated.received_date).toEqual(updateDto.received_date);
    expect(updated.subject).toEqual(updateDto.subject);
  });

  it('should be success update metadata email with correct data', async () => {
    const updateDto = Generator.fakeUpdateDTO();
    delete updateDto.object_uid;
    repo.update.mockReturnValue({
      data: updateDto,
      affected: 1,
    });
    repo.findOne.mockReturnValue(updateDto);
    const updated = await service.update(userId, updateDto, 0);
    expect(updated.message_id).toEqual(updateDto.message_id);
    expect(updated.object_type).toEqual(updateDto.object_type);
    expect(updated.received_date).toEqual(updateDto.received_date);
  });

  it('should be throw error when update metadata email failed', async () => {
    const updateDto = Generator.fakeUpdateDTO();
    repo.update.mockReturnValue(null);
    repo.findOne.mockReturnValue(updateDto);
    let error;
    try {
      await service.update(userId, updateDto, 0);
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();
  });

  it('should throw logger error when update metadata email failed', async () => {
    const error = new Error('UNKNOWN ERROR');
    let thrownError;
    jest.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw error;
    });

    try {
      const updateDto = Generator.fakeUpdateDTO();
      await service.update(userId, updateDto, 0);
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).toBeInstanceOf(ErrorDTO);
  });

  it('should throw typeorm error when update metadata email failed', async () => {
    const updateDto = Generator.fakeUpdateDTO();
    const error = {
      code: 'ER_DUP_ENTRY',
      errno: 1062,
      index: 0,
      message: `ER_DUP_ENTRY: Duplicate entry '0-\\x00\\x00\\x00{\\x00\\x00\\x00\\x00INBOX' for key 'uniq_on_account_id_and_object_uid'`,
      name: 'QueryFailedError',
    };
    repo.create.mockReturnValue(updateDto);
    repo.findOne.mockReturnValue(updateDto);
    jest.spyOn(repo, 'update').mockImplementationOnce(() => {
      throw error;
    });
    let thrownError;
    try {
      await service.update(userId, updateDto, 0);
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError.code).toEqual(ErrorCode.DUPLICATE_ENTRY);
    expect(thrownError.message).toEqual(MSG_ERR_DUPLICATE_ENTRY);
  });

  it('should be success updated multiple metadata emails', async () => {
    const updateDto1 = Generator.fakeUpdateDTO();
    const updateDto2 = Generator.fakeUpdateDTO();
    repo.update
      .mockReturnValueOnce({
        data: updateDto1,
        affected: 1,
      })
      .mockReturnValueOnce({
        data: updateDto2,
        affected: 1,
      });
    thirdPartyAccountRepo.find.mockReturnValue([
      { id: updateDto1.account_id },
      { id: updateDto2.account_id },
    ]);
    repo.findOne.mockReturnValueOnce(updateDto1)
      .mockReturnValueOnce(updateDto2)
      .mockReturnValueOnce(updateDto1)
      .mockReturnValueOnce(updateDto2);
    const { updated } = await service.updateMultiple([updateDto1, updateDto2], fakeReq);
    expect(updated[0].account_id).toEqual(updateDto1.account_id);
    expect(updated[0].subject).toEqual(updateDto1.subject);
    expect(updated[0].sent_date).toEqual(updateDto1.sent_date);
    expect(updated[0].snippet).toEqual(updateDto1.snippet);

    expect(updated[1].account_id).toEqual(updateDto2.account_id);
    expect(updated[1].subject).toEqual(updateDto2.subject);
    expect(updated[1].sent_date).toEqual(updateDto2.sent_date);
    expect(updated[1].snippet).toEqual(updateDto2.snippet);
  });

  it('should return error when update multiple metadata emails failed', async () => {
    const updateDto1 = Generator.fakeUpdateDTO();
    const updateDto2 = Generator.fakeUpdateDTO();
    repo.update
      .mockReturnValueOnce({
        data: updateDto1,
        affected: 1,
      })
      .mockReturnValueOnce({
        data: updateDto2,
        affected: 1,
      });
    thirdPartyAccountRepo.find.mockReturnValue([
      { id: updateDto1.account_id },
      { id: updateDto2.account_id },
    ]);
    const error = new Error('UNKNOWN ERROR');
    jest.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw error;
    });
    const { errors } = await service.updateMultiple([updateDto1, updateDto2], fakeReq);
    expect(errors.length).toEqual(2);
  });

  it('should be success deleted metadata email', async () => {
    const createDto = Generator.fakeCreatedDTO();
    const created = await service.create(userId, createDto, 0);
    repo.delete.mockReturnValue({
      data: createDto,
      affected: 1,
    });
    const deleted = await service.remove(userId, created.id, fakeDeletedDate);
    expect(deleted.id).toEqual(created.id);
  });

  it('should throw logger error when delete metadata email failed', async () => {
    const error = new Error('UNKNOWN ERROR');
    let thrownError;
    jest.spyOn(repo, 'delete').mockImplementationOnce(() => {
      throw error;
    });

    try {
      const updateDto = Generator.fakeUpdateDTO();
      await service.remove(userId, updateDto.id, fakeDeletedDate);
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).toEqual(error);
  });

  it('should be success deleted multiple metadata emails', async () => {
    const createDto1 = Generator.fakeCreatedDTO();
    const created1 = await service.create(userId, createDto1, 0);

    const createDto2 = Generator.fakeCreatedDTO();
    const created2 = await service.create(userId, createDto2, 0);
    repo.delete
      .mockReturnValueOnce({
        data: createDto1,
        affected: 1,
      })
      .mockReturnValueOnce({
        data: createDto2,
        affected: 1,
      });

    const { removed } = await service.removeMultiple([
      { id: created1.id },
      { id: created2.id },
    ], fakeReq);
    expect(removed[0].id).toEqual(created1.id);
    expect(removed[1].id).toEqual(created2.id);
  });

  it('should be throw error when deleted metadata email failed', async () => {
    const createDto = Generator.fakeCreatedDTO();
    const created = await service.create(userId, createDto, 0);
    repo.delete.mockReturnValue(null);
    let error;
    try {
      await service.remove(userId, created.id, fakeDeletedDate);
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();
  });

  it('should return error when delete multiple metadata emails failed', async () => {
    const updateDto = Generator.fakeUpdateDTO();
    const error = new ErrorDTO({
      attributes: { id: updateDto.id },
      code: ErrorCode.METADATA_EMAIL_DOES_NOT_EXIST,
      message: MSG_ERR_NOT_EXIST,
    });
    jest.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw error;
    });
    const { errors } = await service.removeMultiple([updateDto], fakeReq);
    expect(errors.length).toEqual(1);
  });

  it('should be throw error when deleted multiple metadata emails failed', async () => {
    const updateDto = Generator.fakeUpdateDTO();
    let error;
    jest.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw error;
    });
    try {
      await service.removeMultiple([updateDto], fakeReq);
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();
  });

  it('should return correct error code when deleted multiple metadata emails failed', async () => {
    const updateDto = Generator.fakeUpdateDTO();
    const error = {
      code: 'TEST_CODE',
      message: 'Test error code message',
    };
    jest.spyOn(service, 'remove').mockImplementationOnce(() => {
      throw error;
    });
    const { errors } = await service.removeMultiple([updateDto], fakeReq);

    expect(errors.length).toEqual(1);
    expect(errors[0].code).toEqual(error.code);
    expect(errors[0].message).toEqual(error.message);
  });

  it('should return delete failed error when deleted multiple metadata emails failed', async () => {
    const updateDto = Generator.fakeUpdateDTO();
    const error = new Error('Test error code message');
    jest.spyOn(service, 'remove').mockImplementationOnce(() => {
      throw error;
    });
    const { errors } = await service.removeMultiple([updateDto], fakeReq);

    expect(errors.length).toEqual(1);
    expect(errors[0].code).toEqual(ErrorCode.DELETE_FAILED);
    expect(errors[0].message).toEqual(error.message);
  });

  it('should be throw error when delete metadata email failed', async () => {
    const fakeDTO = Generator.fakeUpdateDTO();
    deletedItemService.create.mockReturnValue(null);
    let error;
    try {
      await service.remove(userId, fakeDTO.id, fakeDeletedDate);
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();
  });

  it('should be throw error when delete metadata email failed when entity is not found', async () => {
    const fakeDTO = Generator.fakeUpdateDTO();
    jest.spyOn(repo, 'findOne').mockReturnValue(null);
    let error;
    try {
      await service.remove(userId, fakeDTO.id, fakeDeletedDate);
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();
  });

  it('should throw logger error when validate account id failed', async () => {
    const error = new Error('UNKNOWN ERROR');
    let thrownError;
    jest.spyOn(thirdPartyAccountRepo, 'find').mockImplementationOnce(() => {
      throw error;
    });

    try {
      const createDTO = Generator.fakeCreatedDTO();
      await service.validateAccountId(userId, [createDTO]);
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).toEqual(error);
  });

  it('should return false when validate account id failed', async () => {
    jest.spyOn(thirdPartyAccountRepo, 'find').mockReturnValue([]);
    const createDTO = Generator.fakeCreatedDTO();
    const { data, errors } = await service.validateAccountId(userId, [createDTO]);

    expect(data.length).toEqual(0);
    expect(errors.length).toEqual(1);
  });

  afterAll(async () => {
    await app.close();
  });
});
