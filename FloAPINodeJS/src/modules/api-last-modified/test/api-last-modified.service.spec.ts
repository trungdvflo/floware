import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { ApiLastModifiedName } from '../../../common/constants';
import { QuotaEntity } from '../../../common/entities/quota.entity';
import { IUser } from '../../../common/interfaces';
import { LoggerService } from '../../../common/logger/logger.service';
import { ApiLastModifiedRepository } from '../../../common/repositories/api-last-modified.repository';
import { QuotaRepository } from '../../../common/repositories/quota.repository';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { ApiLastModifiedService } from '../api-last-modified.service';
import { ApiLastModifiedResponse, GetApiLastModifiedDto } from '../dto/get-api-last-modified.dto';
import { PutApiLastModifiedDto } from '../dto/put-api-last-modified.dto';
import { fakeData } from './fakeData';

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
const spyHttpClient: SpyObject = TestUtilsService.createSpyObj('post', ['toPromise']);

export class SpyObject {
  [key: string]: () => { [key: string]: jest.Mock };
}

const almReposMockFactory: () => MockType<ApiLastModifiedRepository> = jest.fn(() => ({
  findByObjUid: jest.fn(entity => entity),
  find: jest.fn(entity => entity),
  findOne: jest.fn((id: number) => id),
  save: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  insert: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  remove: jest.fn(entity => entity),
  findByApiNames: jest.fn().mockReturnValue([fakeData[0]]),

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
const repoMockQuotaRepo: () => MockType<Repository<QuotaEntity>> = jest.fn(() => ({
  update: jest.fn(() => ({}))
}));

describe('ApiLastModifiedService', () => {
  let app: INestApplication;
  let service: ApiLastModifiedService;
  let almRepo: MockType<ApiLastModifiedRepository>;
  let httpClient: HttpService;
  let loggerService: LoggerService;
  beforeEach(async () => {
    jest.useFakeTimers();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        ApiLastModifiedService,
        DatabaseUtilitiesService,
        {
          provide: ApiLastModifiedRepository,
          useFactory: almReposMockFactory
        },
        {
          provide: QuotaRepository,
          useFactory: repoMockQuotaRepo
        },
        {
          provide: HttpService,
          useValue: spyHttpClient
        },
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
    service = module.get<ApiLastModifiedService>(ApiLastModifiedService);
    almRepo = module.get(ApiLastModifiedRepository);
    httpClient = module.get<HttpService>(HttpService);
    loggerService = module.get<LoggerService>(LoggerService);
    loggerService.logError = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(almRepo).toBeDefined();
    expect(httpClient).toBeDefined();
  });

  describe('Get API Last Modified', () => {
    const fakeUser = {
      id: 1, token: '', userId: 1, userAgent: '', email: 'anph@abc.com', appId: '', deviceUid: ''
    };
    it('should be return error', async () => {
      try {
        const req = {
          api_name: ApiLastModifiedName.COLLECTION
        } as GetApiLastModifiedDto;
        almRepo.findByApiNames = jest.fn(() => Promise.reject(new Error('Failed to load')));
        await service.findAll(req, fakeUser);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be get API Last Modified', async () => {
      const req = {
        api_name: ApiLastModifiedName.COLLECTION
      } as GetApiLastModifiedDto;

      // common.throttle = jest.fn(() => Promise.reject(new Error('Failed to load')));

      httpClient.post = jest.fn()
        .mockReturnValue({
          toPromise: () => ({
            data: {
              bytes: 1
            }
          })
        });
      const result: ApiLastModifiedResponse[] = await service.findAll(req, fakeUser);

      expect(result).toBeDefined();
      expect(result).toHaveLength;
      expect(result[0].api_name).toEqual(fakeData[0].api_name);
      expect(result[0].updated_date).toEqual(fakeData[0].api_modified_date);
    });
  });

  describe('Update API Last Modified', () => {
    const user: IUser = {
      userId: 1,
      id: 1,
      email: 'tester001@flomail.net',
      appId: '',
      deviceUid: '',
      userAgent: '',
      token: '',
    };
    it('should be return duplicate API Last Modified', async () => {
      const dtoAPILastModified: PutApiLastModifiedDto[] = [{
        api_name: ApiLastModifiedName.COLLECTION,
        updated_date: Date.now() / 1000,
      }, {
        api_name: ApiLastModifiedName.COLLECTION,
        updated_date: Date.now() / 1000,
      }];
      const almUpdated = {
        api_name: ApiLastModifiedName.COLLECTION,
        api_modified_date: Date.now() / 1000
      };
      almRepo.insertLastModify = jest.fn().mockReturnValue(almUpdated);
      const result = await service
        .updateBatchModify(dtoAPILastModified, fakeReq);

      expect(result.itemPass.length).toEqual(1);
      expect(result.itemFail.length).toEqual(1);
    });
    it('should be return error API Last Modified', async () => {
      almRepo.insertLastModify = jest.fn().mockReturnValue({});
      const result = await service
        .updateBatchModify([], fakeReq);
      expect(result.itemPass.length).toEqual(0);
      expect(result.itemFail.length).toEqual(0);
    });
    it('should be return valid API Last Modified', async () => {
      const dtoAPILastModified: PutApiLastModifiedDto[] = [{
        api_name: ApiLastModifiedName.COLLECTION,
        updated_date: Date.now() / 1000,
      }];
      const almUpdated = {
        api_name: ApiLastModifiedName.COLLECTION,
        api_modified_date: Date.now() / 1000
      };
      almRepo.insertLastModify = jest.fn().mockReturnValue(almUpdated);

      const result = await service.updateBatchModify(dtoAPILastModified, fakeReq);
      expect(result.itemPass[0]).toEqual(almUpdated);
    });

    it('should be return error 1', async () => {
      try {
        const dtoAPILastModified: PutApiLastModifiedDto[] = [{
          api_name: ApiLastModifiedName.COLLECTION,
          updated_date: Date.now() / 1000,
        }];
        almRepo.insertLastModify = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.updateBatchModify(dtoAPILastModified, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return error 2', async () => {
      try {
        const dtoAPILastModified: PutApiLastModifiedDto[] = [{
          api_name: ApiLastModifiedName.COLLECTION,
          updated_date: Date.now() / 1000,
        }];
        almRepo.insertLastModify = jest.fn().mockReturnValue({
          error: {
            massage: "Internal server error"
          }
        })
        await service.updateBatchModify(dtoAPILastModified, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  afterAll(async () => {
    await app.close();
  });
});
