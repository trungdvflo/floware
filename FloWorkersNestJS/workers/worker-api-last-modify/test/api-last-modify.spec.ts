import { BullModule } from '@nestjs/bull';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MockType } from 'test';
import { WORKER_REPORT_CACHED_USER } from '../../common/constants/worker.constant';
import { RealTimeService } from '../../common/modules/communication/services';
import { CommonApiLastModifiedService } from '../../common/modules/last-modified/api-last-modify-common.service';
import {
  DeviceTokenRepository,
  LastModifyRepository
} from '../../common/repository/api-last-modify.repository';
import { PushChangeRepository } from '../../common/repository/push-change.repository';
import { ApiLastModifiedService } from '../src/api-last-modify.service';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';

const user_id = 1;
const lastModifyReposMockFactory: () => MockType<LastModifyRepository> = jest.fn(() => ({
  getItemByOptions: jest.fn(entity => entity),
}));

const pushChangeReposMockFactory: () => MockType<PushChangeRepository> = jest.fn(() => ({
  find: jest.fn(entity => entity),
  findOne: jest.fn((id: number) => id),
  save: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  select: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  where: jest.fn(entity => entity),
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
  })
}));

const deviceTokenReposMockFactory: () => MockType<DeviceTokenRepository> = jest.fn(() => ({
  find: jest.fn(entity => entity),
  findOne: jest.fn((id: number) => id),
  save: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  select: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  where: jest.fn(entity => entity),
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
  })
}));

describe('API last modify Service', () => {
  let app: INestApplication;
  let apiLastModifiedService: ApiLastModifiedService;
  let commonApiLastModifiedService: CommonApiLastModifiedService;
  let lastModifyRepository: MockType<LastModifyRepository>;
  let deviceTokenRepository: MockType<DeviceTokenRepository>;
  let pushChangeRepository: MockType<PushChangeRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BullModule.registerQueue({
          name: WORKER_REPORT_CACHED_USER.QUEUE,
        }),
      ],
      providers: [
        ApiLastModifiedService,
        CommonApiLastModifiedService,
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
          provide: RealTimeService,
          useFactory: () => ({
            setHeader: jest.fn().mockReturnThis()
          })
        },
        {
          provide: LastModifyRepository,
          useFactory: lastModifyReposMockFactory
        },
        {
          provide: DeviceTokenRepository,
          useFactory: deviceTokenReposMockFactory
        },
        {
          provide: PushChangeRepository,
          useFactory: pushChangeReposMockFactory
        }
      ],
    }).compile();

      app = module.createNestApplication();
      await app.init();

      apiLastModifiedService = module.get<ApiLastModifiedService>(ApiLastModifiedService);
      commonApiLastModifiedService = module.get<CommonApiLastModifiedService>(CommonApiLastModifiedService);
      lastModifyRepository= module.get(LastModifyRepository);
      deviceTokenRepository= module.get(DeviceTokenRepository);
      pushChangeRepository = module.get(PushChangeRepository);
  });

  it('should be defined', () => {
    expect(apiLastModifiedService).toBeDefined();
    expect(lastModifyRepository).toBeDefined();
    expect(deviceTokenRepository).toBeDefined();
    expect(pushChangeRepository).toBeDefined();
  });

  // describe('Push change', () => {
  //   it('should be return keypem invalid', async () => {
  //     const pushChageTime = null;
  //     const offset = PUSH_CHANGE_CONFIG.OFFSET;
  //     const limit = PUSH_CHANGE_CONFIG.LIMIT;
  //     process.env.KEY_MAP_PUSH_NOTIFY = deviceFake.pemDevice;

  //     const result = await apiLastModifiedService.pushChange(pushChageTime, offset, limit);
  //     expect(result).toEqual(undefined);
  //   });
  //   it('should be return list of change data as null', async () => {
  //     const pushChageTime = 1661326434.005;
  //     const offset = PUSH_CHANGE_CONFIG.OFFSET;
  //     const limit = PUSH_CHANGE_CONFIG.LIMIT;
  //     process.env.KEY_MAP_PUSH_NOTIFY = deviceFake.pemDevice;

  //     pushChangeRepository.getListPushChange = jest.fn().mockReturnValue(pushChangeFake.emptyData);

  //     const result = await apiLastModifiedService.pushChange(pushChageTime, offset, limit);
  //     expect(result).toEqual(undefined);
  //   });

  //   it('should be return list of user device as null and finish push notification', async () => {
  //     const pushChageTime = 1661326434.005;
  //     const offset = PUSH_CHANGE_CONFIG.OFFSET;
  //     const limit = PUSH_CHANGE_CONFIG.LIMIT;
  //     process.env.KEY_MAP_PUSH_NOTIFY = deviceFake.pemDevice;

  //     pushChangeRepository.getListPushChange = jest.fn().mockReturnValue(pushChangeFake.dataMock);
  //     deviceTokenRepository.getListDeviceByUser = jest.fn().mockReturnValue([]);
  //     pushChangeRepository.cleanPushChange = jest.fn().mockReturnValue(true);

  //     const result = await apiLastModifiedService.pushChange(pushChageTime, offset, limit);
  //     expect(result).toEqual(undefined);
  //   });

  //   // it('should be return finish push notification', async () => {
  //   //   const pushChageTime = 1661326434.005;
  //   //   const offset = PUSH_CHANGE_CONFIG.OFFSET;
  //   //   const limit = PUSH_CHANGE_CONFIG.LIMIT;
  //   //   process.env.KEY_MAP_PUSH_NOTIFY = deviceFake.pemDevice;

  //   //   pushChangeRepository.getListPushChange = jest.fn().mockReturnValue(pushChangeFake.dataMock);
  //   //   deviceTokenRepository.getListDeviceByUser = jest.fn().mockReturnValue(deviceFake.dataMock);
  //   //   pushChangeRepository.cleanPushChange = jest.fn().mockReturnValue(true);

  //   //   const result = await apiLastModifiedService.pushChange(pushChageTime, offset, limit);
  //   //   expect(result).toEqual(undefined);
  //   //   console.log('ss', result)
  //   // });
  // });

  afterAll(async () => {
    await app.close();
  });
});
