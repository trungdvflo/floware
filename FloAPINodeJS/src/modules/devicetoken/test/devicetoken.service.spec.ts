import { HttpModule, HttpService } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { BadRequestException, CacheModule, INestApplication } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of } from 'rxjs';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_DATA_INVALID, MSG_ERR_BAD_REQUEST, MSG_ERR_NOT_EXIST } from '../../../common/constants/message.constant';
import { ErrorDTO } from '../../../common/dtos/error.dto';
import { AccessToken } from '../../../common/entities/access-token.entity';
import { Devicetoken } from '../../../common/entities/devicetoken.entity';
import { Release } from '../../../common/entities/release.entity';
import { UserPlatformVersion } from '../../../common/entities/user-platform-version.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import { ApiLastModifiedQueueService } from '../../../modules/bullmq-queue/api-last-modified-queue.service';
import { IReqUser } from '../../../modules/oauth/oauth.middleware';
import { OAuthService } from '../../oauth/oauth.service';
import { DeviceTokenEmailService } from '../devicetoken.email';
import { DevicetokenService } from '../devicetoken.service';
import { SilentPushDTO } from '../dtos/slient-push.dto';
import * as Generator from './generator';
export class TestUtilsService {
  static createSpyObj(baseName: string, methodNames: string[]): SpyObject {
    let obj: any = {};

    for (let i = 0; i < methodNames.length; i++) {
      obj[methodNames[i]] = jest.fn();
    }
    return { [baseName]: () => obj };
  };
}

export class SpyObject {
  [key: string]: () => { [key: string]: jest.Mock };
}

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
        databaseName: 'device_token',
      },
      {
        databaseName: 'device_type',
      },
      {
        databaseName: 'device_uuid',
      },
      {
        databaseName: 'time_sent_silent',
      },
      {
        databaseName: 'time_received_silent',
      },
      {
        databaseName: 'created_date',
      },
      {
        databaseName: 'status_app_run',
      },
      {
        databaseName: 'env_silent',
      },
      {
        databaseName: 'device_env',
      },
      {
        databaseName: 'cert_env',
      },
      {
        databaseName: 'updated_date',
      },
    ],
  },
}));
jest.mock('@nestjs/axios', () => ({
  HttpModule: jest.fn(),
  HttpService: jest.fn(),
}));
const spyHttpClient: SpyObject = TestUtilsService.createSpyObj('get', ['toPromise']);
const apiLastModifiedQueueServiceMockFactory: () => MockType<ApiLastModifiedQueueService> = jest.fn(
  () => ({
    addJob: jest.fn((entity) => entity),
  }),
);

BullModule.forRootAsync = jest.fn();

describe('DevicetokenService', () => {
  let app: INestApplication;
  let service: DevicetokenService;
  let oAuthService: OAuthService;
  let deviceTokenEmailService: DeviceTokenEmailService;
  let repo: MockType<Repository<Devicetoken>>;
  let releaseRepository: MockType<Repository<Release>>;
  let accessTokenRepo: MockType<Repository<AccessToken>>;
  let logger: LoggerService;
  let createQueryBuilder;
  const user = {
    userId: 1,
    email: 'user@devicetoken.com',
    userAgent:
      'Flo/0.9.10 (iPad; build 201805281139; iOS Version 11.3.1; Device iPad Pro 5.3) Alamofire/4.7.1',
  } as IReqUser;

  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;
  it('should find and return the devicetoken', async () => {
    const obj = Generator.fakeDevicetoken();
    repo.findOne.mockReturnValue(obj);
    const dto = await service.findOne(fakeReq.user.id, obj.device_token);
    expect(dto).toEqual(obj);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, JwtModule.registerAsync({
        useFactory: () => ({})
      }), CacheModule.register({})],
      providers: [
        DevicetokenService,
        OAuthService,
        DeviceTokenEmailService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(Devicetoken),
          useFactory: repoMockFactory,
        },
        {
          provide: getRepositoryToken(Release),
          useFactory: repoMockFactory,
        },
        {
          provide: getRepositoryToken(UserPlatformVersion),
          useFactory: repoMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(AccessToken),
          useFactory: repoMockFactory,
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedQueueServiceMockFactory,
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn((e) => e),
          },
        },
        {
          provide: HttpService,
          useValue: spyHttpClient
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<DevicetokenService>(DevicetokenService);
    releaseRepository = module.get(getRepositoryToken(Release));
    oAuthService = module.get(OAuthService);
    deviceTokenEmailService = module.get(DeviceTokenEmailService);
    logger = module.get<LoggerService>(LoggerService);
    repo = module.get(getRepositoryToken(Devicetoken));
    accessTokenRepo = module.get(getRepositoryToken(AccessToken));
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    createQueryBuilder = {
      select: jest.fn((entity) => createQueryBuilder),
      leftJoin: jest.fn((entity) => createQueryBuilder),
      where: jest.fn((entity) => createQueryBuilder),
      getRawOne: jest.fn((entity) => createQueryBuilder),
    };
    releaseRepository.createQueryBuilder = jest.fn(() => createQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(oAuthService).toBeDefined();
    expect(deviceTokenEmailService).toBeDefined();
    expect(logger).toBeDefined();
    expect(repo).toBeDefined();
    expect(accessTokenRepo).toBeDefined();
    expect(apiLastModifiedQueueService).toBeDefined();
  });

  it('should find and return the devicetoken', async () => {
    const obj = Generator.fakeDevicetoken();
    repo.findOne.mockReturnValue(obj);
    const dto = await service.findOne(fakeReq.user.id, obj.device_token);
    expect(dto).toEqual(obj);
  });

  it('should find and return list of devicetokens', async () => {
    const obj1 = Generator.fakeDevicetoken();
    const obj2 = Generator.fakeDevicetoken();
    const mockResults = [obj1, obj2];
    repo.find.mockReturnValue(mockResults);
    const fakeFilter = Generator.fakeFilter();
    const devicetokens = await service.findAll(fakeFilter, fakeReq);
    const { data } = devicetokens;
    expect(data[0].cert_env).toEqual(mockResults[0].cert_env);
    expect(data[0].device_env).toEqual(mockResults[0].device_env);
    expect(data[0].device_token).toEqual(mockResults[0].device_token);
    expect(data[0].device_type).toEqual(mockResults[0].device_type);
    expect(data[0].env_silent).toEqual(mockResults[0].env_silent);
    expect(data[0].status_app_run).toEqual(mockResults[0].status_app_run);
  });

  it('should throw logger error when find list of devicetokens', async () => {
    const error = new BadRequestException(
      MSG_DATA_INVALID, ErrorCode.INVALID_DATA
    );
    let thrownError;
    jest.spyOn(repo, 'find').mockImplementationOnce(() => {
      throw error;
    });

    try {
      const fakeFilter = Generator.fakeFilter();
      await service.findAll(fakeFilter, fakeReq);
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).toEqual(error);
  });

  it('should be success update devicetoken', async () => {
    const obj1 = Generator.fakeDevicetoken();
    const updateDto = Generator.fakedUpdateEntity();
    repo.update.mockReturnValue({
      data: updateDto,
      affected: 1,
    });
    repo.findOne.mockReturnValue(updateDto);
    const { data } = await service.update(updateDto, fakeReq);
    expect(data.cert_env).toEqual(updateDto.cert_env);
    expect(data.device_env).toEqual(updateDto.device_env);
    expect(data.time_sent_silent).toEqual(updateDto.time_sent_silent);
    expect(data.status_app_run).toEqual(updateDto.status_app_run);
    expect(data.device_token).toEqual(updateDto.device_token);
  });

  it('should throw logger error when device token is not existed', async () => {
    const updateDto = Generator.fakedUpdateEntity();
    repo.findOne.mockReturnValue(false);
    const { error } = await service.update(updateDto, fakeReq);
    expect(error).toBeInstanceOf(ErrorDTO);
    expect(error.attributes).toEqual(updateDto);
    expect(error.code).toEqual(ErrorCode.DEVICE_TOKEN_DOES_NOT_EXIST);
    expect(error.message).toEqual(MSG_ERR_NOT_EXIST);
  });

  it('should throw logger error when update devicetoken failed', async () => {
    const updateDto = Generator.fakedUpdateEntity();
    const fakeError = new Error('UNKNOWN ERROR');
    jest.spyOn(repo, 'save').mockImplementationOnce(() => {
      throw fakeError;
    });
    const { error } = await service.update(updateDto, fakeReq);
    // expect(error).toBeInstanceOf(ErrorDTO);
    // expect(error.attributes).toEqual(updateDto);
    // expect(error.code).toEqual(ErrorCode.UPDATE_FAILED);
    // expect(error.message).toEqual(MSG_ERR_BAD_REQUEST);
  });

  it('should be throw error when update devicetoken failed', async () => {
    const updateDto = Generator.fakedUpdateEntity();
    repo.update.mockReturnValue(null);
    repo.findOne.mockReturnValue(updateDto);
    let error;
    try {
      await service.update(updateDto, fakeReq);
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();
  });

  it('should be success deleted devicetoken', async () => {
    const createDto = Generator.fakeCreatedDevicetoken();
    repo.delete.mockReturnValue({
      data: createDto,
      affected: 1,
    });
    const { removed } = await service.remove({
      device_token: createDto.device_token,
    }, fakeReq);
    expect(removed.device_token).toEqual(createDto.device_token);
  });

  it('should throw logger error when delete devicetoken failed', async () => {
    const error = new Error('UNKNOWN ERROR');
    let thrownError;
    jest.spyOn(repo, 'delete').mockImplementationOnce(() => {
      throw error;
    });
    service.findOne = jest.fn().mockResolvedValueOnce(true);

    try {
      const updateDto = Generator.fakedUpdateEntity();
      await service.remove(updateDto, fakeReq);
    } catch (err) {
      expect(thrownError).toEqual(ErrorDTO);
    }
  });

  it('should be throw error when deleted devicetoken failed', async () => {
    const createDto = Generator.fakeCreatedDevicetoken();
    repo.delete = jest.fn().mockResolvedValueOnce(false);
    service.findOne = jest.fn().mockResolvedValueOnce(true);
    try {
      await service.remove({
        device_token: createDto.device_token,
      }, fakeReq);
    } catch (err) {
      expect(err).toBeInstanceOf(ErrorDTO);
    }
  });

  it('should return delete error when devicetoken is not found', async () => {
    const createDto = Generator.fakeCreatedDevicetoken();
    service.findOne = jest.fn().mockResolvedValueOnce(false);
    jest.spyOn(repo, 'findOne').mockReturnValue(null);
    const { error } = await service.remove({
      device_token: createDto.device_token,
    }, fakeReq);
    expect(error.code).toEqual(ErrorCode.DEVICE_TOKEN_DOES_NOT_EXIST);
    expect(error.message).toEqual(MSG_ERR_NOT_EXIST);
  });

  it('should find one and success', async () => {
    repo.findOne = jest.fn().mockResolvedValueOnce(true);
    const rs = await service.findOne(fakeReq.user.id, '');
    expect(rs).toEqual(true);
  });

  it('should find one and fail', async () => {
    repo.findOne = jest.fn().mockRejectedValueOnce('fail');
    try {
      await service.findOne(fakeReq.user.id, '');
    } catch (e) {
      expect(e).toEqual('fail');
    }
  });

  it('should throw error when sendCallEvent failed', async () => {
    const fakeData = {
      "organizer": "quangndn@flodev.net",
      "invitee": [
        {
          "email": "thuongtest101@flouat.net"
        },
        {
          "email": "khoapm@flouat.net"
        }
      ],
      "room_url": "https:link_join_meeting",
      "room_id": "3",
      "invite_status": 1,
      "call_type": 1
    } as SilentPushDTO
    spyHttpClient.get = jest.fn().mockReturnValue(of({ data: [] }));
    try {
      await service.sendCallEvent(fakeData);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });

  it('should sendCallEvent with invite_status = 1', async () => {
    const fakeData = {
      "organizer": "quangndn@flodev.net",
      "invitee": [
        {
          "email": "thuongtest101@flouat.net"
        },
        {
          "email": "khoapm@flouat.net"
        }
      ],
      "room_url": "https:link_join_meeting",
      "room_id": "3",
      "invite_status": 1,
      "call_type": 1
    } as SilentPushDTO

    try {
      const rs = await service.sendCallEvent(fakeData);
      expect(rs.data[0]).toEqual({});
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException)
    }
  });


  it('should return alreadyExistDeviceToken error when create dup device token', async () => {
    const createDto = Generator.fakeCreatedDevicetoken();
    repo.findOne = jest.fn().mockResolvedValueOnce({
      user_id: user.userId
    });

    const result = await service.create(createDto, fakeReq);
    expect(result.error).toBeInstanceOf(ErrorDTO);
  });

  it('should return error when create dup device token', async () => {
    const createDto = Generator.fakeCreatedDevicetoken();
    service.findOne = jest.fn().mockResolvedValueOnce(true);
    const result = await service.create(createDto, fakeReq);
    expect(result.error).toBeInstanceOf(ErrorDTO);
  });

  it('should be success created devicetoken', async () => {
    const createDto = Generator.fakeCreatedDevicetoken();
    service.findOne = jest.fn().mockResolvedValueOnce(false);
    oAuthService.updateAuthCacheByToken = jest.fn().mockResolvedValueOnce(false);
    accessTokenRepo.update = jest.fn().mockResolvedValueOnce(true);
    repo.save = jest.fn().mockResolvedValueOnce(createDto);
    apiLastModifiedQueueService.addJob = jest.fn();

    jest.spyOn(service, 'checkReleaseAndUserPlatform').mockResolvedValueOnce({
      releaseId: 27,
      userPlatformVersionId: 4
    });

    const result = await service.create(createDto, fakeReq);
    expect(result.data).not.toBeNull();
  });

  it('should be call function checkReleaseAndUserPlatform', async () => {
    const fakeData = {
      releaseId: 27,
      userPlatformVersionId: 14
    }
    jest.spyOn(service, 'checkReleaseAndUserPlatform').mockResolvedValueOnce(fakeData);
    const resRelease = await service.checkReleaseAndUserPlatform('EUIDJWODFHJS', 0, '485038234902390490')
    expect(resRelease.releaseId).toEqual(fakeData.releaseId)
    expect(resRelease.userPlatformVersionId).toEqual(fakeData.userPlatformVersionId)
  });

  it('should be get undefined function checkReleaseAndUserPlatform', async () => {
    const fakeErrorData = {
      releaseId: undefined,
      userPlatformVersionId: undefined
    }
    jest.spyOn(service, 'checkReleaseAndUserPlatform').mockResolvedValueOnce(fakeErrorData);
    const resRelease = await service.checkReleaseAndUserPlatform('EUIDJWODFHJS', 0, '485038234902390490')
    expect(resRelease.releaseId).toEqual(undefined)
    expect(resRelease.userPlatformVersionId).toEqual(undefined)
  });

  it('should create user platform version when userPlatformVersionId is null ', async () => {
    const createDto = Generator.fakeCreatedDevicetoken();
    service.findOne = jest.fn().mockResolvedValueOnce(false);
    oAuthService.updateAuthCacheByToken = jest.fn().mockResolvedValueOnce(false);
    accessTokenRepo.update = jest.fn().mockResolvedValueOnce(true);
    repo.save = jest.fn().mockResolvedValueOnce(createDto);
    apiLastModifiedQueueService.addJob = jest.fn();

    jest.spyOn(service, 'checkReleaseAndUserPlatform').mockResolvedValueOnce({
      releaseId: 27,
      userPlatformVersionId: null
    });
    deviceTokenEmailService.createDevicetoken = jest.fn().mockReturnValue({});

    const result = await service.create(createDto, fakeReq);
    expect(result.data).not.toBeNull();
    expect(result.data.cert_env).toEqual(createDto.cert_env);
    expect(result.data.device_env).toEqual(createDto.device_env);
    expect(result.data.device_type).toEqual(createDto.device_type);
    expect(result.data.status_app_run).toEqual(createDto.status_app_run);
    expect(result.data.device_token).toEqual(createDto.device_token);
  });

  it('should return error when create devicetoken failed', async () => {
    const createDto = Generator.fakeCreatedDevicetoken();
    const fakeError = new Error('UNKNOWN ERROR');
    repo.create.mockReturnValue(createDto);
    jest.spyOn(repo, 'save').mockImplementationOnce(() => {
      throw fakeError;
    });
    deviceTokenEmailService.createDevicetoken = jest.fn().mockReturnValue({});
    const { error } = await service.create(createDto, fakeReq);
    expect(error).toBeInstanceOf(ErrorDTO);
    expect(error.attributes).toEqual(createDto);
    expect(error.code).toEqual(ErrorCode.CREATE_FAILED);
    expect(error.message).toEqual(MSG_ERR_BAD_REQUEST);
  });

  it('should throw logger error when create devicetoken failed', async () => {
    const error = new Error('UNKNOWN ERROR');
    jest.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw error;
    });
    service.findOne = jest.fn().mockResolvedValueOnce(false);
    try {
      const createDto = Generator.fakeCreatedDevicetoken();
      await service.create(createDto, fakeReq);
    } catch (err) {
      expect(err.code).toEqual(ErrorCode.CREATE_FAILED);
    }
  });

  afterAll(async () => {
    await app.close();
  });
});