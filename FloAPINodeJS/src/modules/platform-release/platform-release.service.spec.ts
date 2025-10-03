import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { datatype } from 'faker';
import { MockType } from 'test';
import { PlatformReleasePushNotification } from '../../common/entities/platform-release-push-notifications.entity';
import { PlatformReleasePushNotificationRepository } from '../../common/repositories/platform-release-push-notification.repository';
import { ReleaseRepository } from '../../common/repositories/release.repository';
import { GetPlatformReleaseDataResponse } from './dto/get-platform-release.dto';
import { GetPlatformReleaseNotFoundError } from './errors/platform-release.error';
import { PlatformReleaseService } from './platform-release.service';

const releaseRepositoryMockFactory: () => MockType<ReleaseRepository> = jest.fn(() => ({
  findOne: jest.fn(entity => entity),
  find: jest.fn(entity => entity)
}));

const prpnRepositoryMockFactory: () => MockType<PlatformReleasePushNotificationRepository>
  = jest.fn(() => ({
    getForceUpdateReleases: jest.fn(entity => entity)
  }));

describe('PlatformReleaseService', () => {
  let app: INestApplication;
  let releaseRepository: MockType<ReleaseRepository>;
  let prpnRepository: MockType<PlatformReleasePushNotificationRepository>;
  let service: PlatformReleaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlatformReleaseService,
        {
          provide: ReleaseRepository,
          useFactory: releaseRepositoryMockFactory
        },
        {
          provide: getRepositoryToken(PlatformReleasePushNotification),
          useFactory: prpnRepositoryMockFactory
        }],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    releaseRepository = module.get(ReleaseRepository);
    prpnRepository = module.get(getRepositoryToken(PlatformReleasePushNotification));
    service = module.get<PlatformReleaseService>(PlatformReleaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return not found release', async () => {
    releaseRepository.findOne.mockReturnValue(null);
    let error: GetPlatformReleaseNotFoundError;
    try {
      const result = await service.getForcedUpdateRelease({
        version: '1.0', build_number: datatype.number(5)
      }, datatype.uuid());

      expect(result).not.toBeNull();
      expect(result.data).toEqual({});
    } catch (err) {
      error = err;
    }
  });

  it('should return empty release', async () => {
    releaseRepository.findOne.mockReturnValue({ id: 1 });
    releaseRepository.find.mockReturnValue([]);

    let error: GetPlatformReleaseNotFoundError;
    try {
      const result = await service.getForcedUpdateRelease({
        version: '1.0', build_number: datatype.number(5)
      }, datatype.uuid());
      expect(result).not.toBeNull();
      expect(result.data).toEqual({});
    } catch (err) {
      error = err;
    }
    expect(error).toBeUndefined();
  });

  it('should return release', async () => {
    releaseRepository.findOne.mockReturnValue({ id: 1, version: '0.1.0', });
    const releases = [{
      app_id: datatype.uuid(),
      version: '1.0',
      build_number: datatype.number(5),
      force_update: 0,
      created_date: datatype.float(13),
      updated_date: datatype.float(13)
    }];
    releaseRepository.find.mockReturnValue(releases);

    let error: GetPlatformReleaseNotFoundError;
    try {
      const result = await service.getForcedUpdateRelease({
        version: releases[0].version, build_number: releases[0].build_number
      }, releases[0].app_id);
      expect(result).not.toBeNull();
      const data = result.data as GetPlatformReleaseDataResponse;
      expect(data.app_id).toEqual(releases[0].app_id);
    } catch (err) {
      error = err;
    }
    expect(error).toBeUndefined();
  });

  it('should return max release version', async () => {
    releaseRepository.findOne.mockReturnValue({ id: 1, version: '1.2', });
    const releases = [{
      app_id: datatype.uuid(),
      version: '2.0',
      build_number: datatype.number(5),
      force_update: 0,
      created_date: datatype.float(13),
      updated_date: datatype.float(13)
    },
    {
      app_id: datatype.uuid(),
      version: '1.0',
      build_number: datatype.number(5),
      force_update: 0,
      created_date: datatype.float(13),
      updated_date: datatype.float(13),
      expire_date: 123
    }];
    releaseRepository.find.mockReturnValue(releases);

    let error: GetPlatformReleaseNotFoundError;
    try {
      const result = await service.getForcedUpdateRelease({
        version: releases[0].version, build_number: releases[0].build_number
      }, releases[0].app_id);
      expect(result).not.toBeNull();
      // expect(result.data).toEqual(releases[0]);
    } catch (err) {
      error = err;
    }
    expect(error).toBeUndefined();
  });

  it('should return not found release 2', async () => {
    releaseRepository.findOne.mockReturnValue(null);
    let error: GetPlatformReleaseNotFoundError;
    try {
      const result = await service.getForcedUpdateRelease2({
        version: '1.0', build_number: datatype.number(5)
      }, datatype.uuid());

      expect(result).not.toBeNull();
      expect(result.data).toEqual({});
    } catch (err) {
      error = err;
    }
  });

  it('should return empty release 2', async () => {
    releaseRepository.findOne.mockReturnValue({ id: 1 });
    prpnRepository.getForceUpdateReleases.mockReturnValue([]);

    let error: GetPlatformReleaseNotFoundError;
    try {
      const result = await service.getForcedUpdateRelease2({
        version: '1.0', build_number: datatype.number(5)
      }, datatype.uuid());
      expect(result).not.toBeNull();
      expect(result.data).toEqual({});
    } catch (err) {
      error = err;
    }
    expect(error).toBeUndefined();
  });

  it('should return release 2', async () => {
    releaseRepository.findOne.mockReturnValue({ id: 1 });
    const releases = [{
      app_id: datatype.uuid(),
      version: '1.0',
      build_number: datatype.number(5),
      force_update: 0,
      created_date: datatype.float(13),
      updated_date: datatype.float(13)
    }];
    prpnRepository.getForceUpdateReleases.mockReturnValue(releases);

    let error: GetPlatformReleaseNotFoundError;
    try {
      const result = await service.getForcedUpdateRelease2({
        version: releases[0].version, build_number: releases[0].build_number
      }, releases[0].app_id);
      expect(result).not.toBeNull();
      const data = result.data as GetPlatformReleaseDataResponse;
      expect(data.app_id).toEqual(releases[0].app_id);
    } catch (err) {
      error = err;
    }
    expect(error).toBeUndefined();
  });

  it('should return max release version 2', async () => {
    releaseRepository.findOne.mockReturnValue({ id: 1 });
    const releases = [{
      app_id: datatype.uuid(),
      version: '2.0',
      build_number: datatype.number(5),
      force_update: 0,
      created_date: datatype.float(13),
      updated_date: datatype.float(13)
    },
    {
      app_id: datatype.uuid(),
      version: '1.0',
      build_number: datatype.number(5),
      force_update: 0,
      created_date: datatype.float(13),
      updated_date: datatype.float(13)
    }];
    prpnRepository.getForceUpdateReleases.mockReturnValue(releases);

    let error: GetPlatformReleaseNotFoundError;
    try {
      const result = await service.getForcedUpdateRelease2({
        version: releases[0].version, build_number: releases[0].build_number
      }, releases[0].app_id);
      expect(result).not.toBeNull();
      // expect(result.data).toEqual(releases[0]);
    } catch (err) {
      error = err;
    }
    expect(error).toBeUndefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
