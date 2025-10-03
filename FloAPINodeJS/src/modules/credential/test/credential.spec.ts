import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_ERR_NOT_EXIST, MSG_ERR_WHEN_DELETE } from '../../../common/constants/message.constant';
import { TypeOrmErrorCode } from '../../../common/constants/typeorm-code';
import { BaseGetDTO } from '../../../common/dtos/base-get.dto';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { IUser } from '../../../common/interfaces';
import { CredentialRepository } from '../../../common/repositories/credential.repository';
import { SaltRepository } from '../../../common/repositories/salt.repository';
import { ApiLastModifiedQueueService } from '../../../modules/bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../../../modules/database/database-utilities.service';
import { DeletedItemService } from '../../../modules/deleted-item/deleted-item.service';
import { CredentialService } from '../credential.service';
import { fakeCreatedDTO, fakeEntity, fakeUpdatedDTO } from './fakeData';

const repoMockFactory = jest.fn(() => ({
  save: jest.fn((entity) => {
    entity.id = 1;
    return entity;
  }),
  transaction: jest.fn(),
  createQueryBuilder: jest.fn(e => e),
  delete: jest.fn((entity) => {
    return { ...entity, affected: true };
  }),
  find: jest.fn((entity) => entity),
  findOne: jest.fn((entity) => entity),
  create: jest.fn((entity) => entity),
  remove: jest.fn((entity) => entity),
  update: jest.fn((entity) => entity),
  where: jest.fn((entity) => entity),
  checkExistCollection: jest.fn((entity) => true),
  metadata: {
    ownColumns: [
      { databaseName: 'id' },
      { databaseName: 'user_id' },
      { databaseName: 'type' },
      { databaseName: 'data_encrypted' },
      { databaseName: 'created_date' },
      { databaseName: 'updated_date' },
    ]
  }
}));
const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({}));

const apiLastModifiedQueueServiceMockFactory: () => MockType<ApiLastModifiedQueueService> = jest.fn(
  () => ({
    addJob: jest.fn((e) => e),
  }),
);

describe('SystemCollectionService', () => {
  let createQueryBuilder: any;
  let app: INestApplication;
  let credentialService: CredentialService;
  let credentialRepository: CredentialRepository;
  let saltRepository: SaltRepository;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;
  let deletedItemService: DeletedItemService;
  let databaseUtilitiesService: DatabaseUtilitiesService;

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
        CredentialService,
        DeletedItemService,
        DatabaseUtilitiesService,
        {
          // how you provide the injection token in a test instance
          provide: CredentialRepository,
          useFactory: repoMockFactory
        },
        {
          provide: SaltRepository,
          useFactory: repoMockFactory
        },
        {
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory,
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedQueueServiceMockFactory,
        }
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();


    credentialService = module.get<CredentialService>(CredentialService);
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    databaseUtilitiesService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    credentialRepository = module.get(getRepositoryToken(CredentialRepository));
    saltRepository = module.get(getRepositoryToken(SaltRepository));

    createQueryBuilder = {
      select: jest.fn(entity => createQueryBuilder),
      addSelect: jest.fn(entity => createQueryBuilder),
      addOrderBy: jest.fn(entity => createQueryBuilder),
      leftJoin: jest.fn(entity => createQueryBuilder),
      innerJoin: jest.fn(entity => createQueryBuilder),
      where: jest.fn(entity => createQueryBuilder),
      andWhere: jest.fn(entity => createQueryBuilder),
      execute: jest.fn(entity => createQueryBuilder),
      limit: jest.fn(entity => createQueryBuilder),
      getMany: jest.fn(entity => createQueryBuilder),
      setQueryRunner: jest.fn(entity => createQueryBuilder)
    };
  });

  it('should be defined', () => {
    expect(credentialService).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(apiLastModifiedQueueService).toBeDefined();
    expect(databaseUtilitiesService).toBeDefined();
  });

  describe('Get Salt', () => {
    it('should get list return empty array', async () => {
      saltRepository.findOne = jest.fn().mockResolvedValue(true);

      const result = await credentialService.getSalt(user);
      expect(result.data).not.toBeNull();
    });

    it('should genenarate salt', async () => {
      saltRepository.findOne = jest.fn().mockResolvedValue(false);
      saltRepository.save = jest.fn().mockResolvedValue(true);
      const result = await credentialService.getSalt(user);
      expect(result.data).not.toBeNull();
    });
  });

  describe('Get credential', () => {
    it('should return salt user', async () => {
      const req = {
        modified_gte: 1,
        has_del: 1,
        page_size: 1,
      } as BaseGetDTO;
      databaseUtilitiesService.getAll = jest.fn().mockResolvedValue([]);
      deletedItemService.findAll = jest.fn().mockResolvedValue([]);
      const userId = fakeEntity().id;

      const result = await credentialService.getAllFiles(req, fakeReq);
      expect(databaseUtilitiesService.getAll).toBeCalledTimes(1);
      expect(result.data).not.toBeNull();
      expect(result.data_del).not.toBeNull();
      expect(result.data).toHaveLength(0);
      expect(result.data_del).toHaveLength(0);
    });

    it('should get list return empty array', async () => {
      const req = {
        modified_gte: 1,
        has_del: 1,
        page_size: 1,
      } as BaseGetDTO;
      databaseUtilitiesService.getAll = jest.fn().mockResolvedValue([]);
      deletedItemService.findAll = jest.fn().mockResolvedValue([]);
      const userId = fakeEntity().id;

      const result = await credentialService.getAllFiles(req, fakeReq);
      expect(databaseUtilitiesService.getAll).toBeCalledTimes(1);
      expect(result.data).not.toBeNull();
      expect(result.data_del).not.toBeNull();
      expect(result.data).toHaveLength(0);
      expect(result.data_del).toHaveLength(0);
    });
  });

  describe('Create credential', () => {
    const paramDtos = [fakeCreatedDTO(), fakeCreatedDTO()];
    const userId = fakeEntity().id;
    it('should throw error when having query failed error', async () => {
      credentialRepository.save = jest.fn().mockImplementationOnce(() => {
        throw Error;
      })

      createQueryBuilder.getMany.mockReturnValue([]);
      const result = await credentialService.createCredential(paramDtos, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
    });

    it('should be create data', async () => {
      const fakeTotalItem = 2;
      databaseUtilitiesService.countItemByUser = jest.fn().mockResolvedValue(fakeTotalItem);
      createQueryBuilder.getMany.mockReturnValue([]);
      const result = await credentialService.createCredential(paramDtos, fakeReq);

      paramDtos.forEach((item, idx) => {
        expect(result.itemPass[idx].id).toBeGreaterThan(0);
        expect(item.data_encrypted).toEqual(result.itemPass[idx].data_encrypted);
        expect(item.type).toEqual(result.itemPass[idx].type);
      });
    });

    it('should be QUERY error when create dubplicate', async () => {
      credentialRepository.save = jest.fn().mockResolvedValue(() => {
        throw new QueryFailedError(TypeOrmErrorCode.ER_DUP_ENTRY, undefined, new Error(TypeOrmErrorCode.ER_DUP_ENTRY));
      });
      const result = await credentialService.createCredential(paramDtos, fakeReq);
    });
  });

  describe('Update credential', () => {
    const paramDtos = [fakeUpdatedDTO(), fakeUpdatedDTO()];
    const userId = fakeEntity().id;
    it('should throw error when having query failed error', async () => {
      credentialRepository.save = jest.fn().mockImplementationOnce(() => {
        throw Error;
      })

      createQueryBuilder.getMany.mockReturnValue([]);
      const result = await credentialService.updateCredential(paramDtos, fakeReq);

      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
    });

    it('should be update data', async () => {
      const fakeTotalItem = 2;
      databaseUtilitiesService.countItemByUser = jest.fn().mockResolvedValue(fakeTotalItem);
      createQueryBuilder.getMany.mockReturnValue([]);
      const result = await credentialService.updateCredential(paramDtos, fakeReq);

      paramDtos.forEach((item, idx) => {
        expect(result.itemPass[idx].id).toBeGreaterThan(0);
        expect(item.data_encrypted).toEqual(result.itemPass[idx].data_encrypted);
        expect(item.type).toEqual(result.itemPass[idx].type);
      });
    });
  });

  describe('Delete credential', () => {
    it('should return systemNotFound', async () => {
      const data = [{ "id": 1 }];
      credentialRepository.findOne = jest.fn().mockReturnValueOnce(false);
      createQueryBuilder.getMany.mockReturnValue([]);
      const result = await credentialService.deleteCredentials(data, fakeReq);
      expect(result.itemFail[0].code).toEqual(ErrorCode.CREDENTIAL_NOT_FOUND);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_NOT_EXIST);
    });

    it('should delete item', async () => {
      const data = [{ "id": 1 }, { "id": 2 }];
      credentialRepository.findOne = jest.fn().mockReturnValue(true);
      createQueryBuilder.getMany.mockReturnValue([]);
      deletedItemService.create = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
      const result = await credentialService.deleteCredentials(data, fakeReq);

      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[0].message).toEqual(MSG_ERR_WHEN_DELETE);
      expect(result.itemPass).toHaveLength(1);
    });

    it('should throw error when having query failed error', async () => {
      const data = [{ "id": 1 }, { "id": 2 }];
      credentialRepository.findOne = jest.fn().mockReturnValue(true);
      deletedItemService.create = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(true);
      credentialRepository.delete = jest.fn().mockImplementation(() => {
        throw Error;
      })
      createQueryBuilder.getMany.mockReturnValue([]);

      const result = await credentialService.deleteCredentials(data, fakeReq);
      expect(result.itemFail).toHaveLength(2);
      expect(result.itemFail[0].code).toEqual(ErrorCode.BAD_REQUEST);
      expect(result.itemFail[1].code).toEqual(ErrorCode.BAD_REQUEST);
    });
  })

  afterAll(async () => {
    await app.close();
  });
});