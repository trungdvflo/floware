import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { PlatformSetting } from '../../../common/entities/platform-setting.entity';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { PlatformSettingService } from '../platform-setting.service';
import * as Generator from './gen';

const apiLastModifiedQueueServiceMockFactory: (
) => MockType<ApiLastModifiedQueueService> = jest.fn(() => ({
  addJob: jest.fn(entity => entity)
}));

const xupdateDto = Generator.updateEntity();
const repoMockFactory: () => MockType<Repository<PlatformSetting>> = jest.fn(() => ({
  save: jest.fn(entity => {
    if (entity['no_push']) {
      return null;
    }
    return entity;
  }),
  find: jest.fn(entity => {
    return [xupdateDto];
  }),
  findOne: jest.fn(entity => {
    return xupdateDto;
  }),
  count: jest.fn(entity => {
    return (entity.id) ? 1 : 0;
  }),
  update: jest.fn((id, entity) => {
    if (id !== 0) {
      entity.affected = 1;
    }
    return entity;
  }),
  create: jest.fn((entity) => {
    return entity;
  }),

}));

describe('PlatformSettingService', () => {
  let app: INestApplication;
  let service: PlatformSettingService;
  let repo: MockType<Repository<PlatformSetting>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlatformSettingService, {
        // how you provide the injection token in a test instance
        provide: getRepositoryToken(PlatformSetting),
        useFactory: repoMockFactory
      }, {
          // how you provide the injection token in a test instance
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedQueueServiceMockFactory
        }],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    repo = module.get(getRepositoryToken(PlatformSetting));
    service = module.get<PlatformSettingService>(PlatformSettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be success get by app_version', async () => {
    const dto = await service.find(Generator.app_version());
    expect(dto).toEqual([
      xupdateDto
    ]);
  });

  it('should be success created settings', async () => {
    const createDto = Generator.createEntity();
    const ping = await service.ping(createDto);
    expect(ping).toEqual(0);
    const created = await service.create(createDto, fakeReq);
    expect(created).toEqual(createDto);
  });

  // it('should be success created settings not push to worker', async () => {
  //   const createDto = Generator.createEntity();
  //   const ping = await service.ping(createDto);
  //   expect(ping).toEqual(0);
  //   createDto['no_push'] = true;
  //   const created = await service.create(createDto);
  //   expect(created).toBeNull();
  // });

  it('should be success update settings push to worker', async () => {
    const dataUpdate = Generator.updateEntity(1);
    const ping = repo.count(dataUpdate);
    expect(ping).toEqual(1);
    const updated = await service.update(dataUpdate, fakeReq);
    expect(updated).not.toBeNull();
  });

  it('should be success update not push to worker', async () => {
    const dataUpdate = Generator.updateEntity(0);
    dataUpdate.id = 0;
    const updated = await service.update(dataUpdate, fakeReq);
    expect(updated).not.toBeNull();
  });

  afterAll(async () => {
    await app.close();
  });
});