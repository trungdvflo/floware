import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getCustomRepositoryToken } from '@nestjs/typeorm';
import { MockType } from 'test';
import { Repository } from 'typeorm';
import { Config } from '../../../common/entities/config.entity';
import { IUser } from '../../../common/interfaces';
import { AppRegisterRepository } from '../../../common/repositories/app-register.repository';
import { GroupsUserRepository } from '../../../common/repositories/group-user.repository';
import { ReleasesGroupRepository } from '../../../common/repositories/release-group.repository';
import { ReleasesUserRepository } from '../../../common/repositories/release-user.repository';
import { ReleaseRepository } from '../../../common/repositories/release.repository';
import { AutoUpdateService } from '../auto-update.service';
import { GetDownloadDto } from '../dtos/download.get.dto';
import { GetVersionDto } from '../dtos/version.get.dto';

class ConfigRepository extends Repository<Config> {
}

const repositoryMockFactory: () => MockType<AppRegisterRepository> = jest.fn(() => ({
  findByObjUid: jest.fn((entity) => entity),
  find: jest.fn((entity) => entity),
  findOne: jest.fn((opt) => {
    const entity = {
      app_reg_id: opt.where.app_reg_id === 'faf0e70f1bad944424393cf309e125cb' ? 1 : null,
      app_alias: 1,
    };
    return entity;
  }),
  save: jest.fn((entity) => entity),
  update: jest.fn((entity) => entity),
  insert: jest.fn((entity) => entity),
}));
const repositoryReleaseMockFactory: () => MockType<ReleaseRepository> = jest.fn(() => ({
  save: jest.fn((entity) => entity),
  findOne: jest.fn((entity) => {
    entity = {
      id: 1,
      file_uid: 'mztdw7ltkbeh2-201909259-1568620854475',
      file_name: 'test.com',
      version: '4.0',
      checksum: '123',
      release_note: 'check ky nha',
      build_number: 123,
      length: 123,
      release_time: 123456.123,
      message: 'check thay ky',
    };
    return entity;
  }),
  find: jest.fn((entity) => {
    entity = {
      id: 1,
      file_uid: 'mztdw7ltkbeh2-201909259-1568620854475',
      file_name: 'test.com',
      version: '4.0',
      checksum: '123',
      release_note: 'check ky nha',
      build_number: 123,
      length: 123,
      release_time: 123456.123,
      message: 'check thay ky',
    };
    return [entity];
  }),
}));
const repositoryGroupUserMockFactory: () => MockType<GroupsUserRepository> = jest.fn(() => ({
  save: jest.fn((entity) => entity),
  find: jest.fn((entity) => {
    entity = [
      {
        group_id: 1,
        user_id: 1,
      },
    ];
    return entity;
  }),
}));
const repositoryReleaseGroupMockFactory: () => MockType<ReleasesGroupRepository> = jest.fn(() => ({
  save: jest.fn((entity) => entity),
  find: jest.fn((entity) => {
    entity = [
      {
        release_id: 1,
        user_id: 1,
      },
    ];
    return entity;
  }),
}));
const repositoryReleaseUserMockFactory: () => MockType<ReleasesUserRepository> = jest.fn(() => ({
  save: jest.fn((entity) => entity),
  find: jest.fn((entity) => {
    entity = [
      {
        release_id: 1,
        user_id: 1,
      },
    ];
    return entity;
  }),
}));
const repositoryConfigMockFactory: () => MockType<ConfigRepository> = jest.fn(() => ({
  findOne: jest.fn((entity) => {
    return {
      value: `{
        "url": "http://example.com"
      }`
    };
  }),
}));

describe('AutoUpdateService', () => {
  let app: INestApplication;
  let service: AutoUpdateService;
  let repository: MockType<AppRegisterRepository>;
  let releaseRepository: ReleaseRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoUpdateService,
        {
          // how you provide the injection token in a test instance
          provide: getCustomRepositoryToken(AppRegisterRepository),
          useFactory: repositoryMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: getCustomRepositoryToken(GroupsUserRepository),
          useFactory: repositoryGroupUserMockFactory,
        },
        {
          provide: getCustomRepositoryToken(ReleasesGroupRepository),
          useFactory: repositoryReleaseGroupMockFactory,
        },
        {
          provide: getCustomRepositoryToken(ReleasesUserRepository),
          useFactory: repositoryReleaseUserMockFactory,
        },
        {
          provide: getCustomRepositoryToken(ReleaseRepository),
          useFactory: repositoryReleaseMockFactory,
        },
        {
          provide: getCustomRepositoryToken(ConfigRepository),
          useFactory: repositoryConfigMockFactory,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<AutoUpdateService>(AutoUpdateService);
    repository = module.get(getCustomRepositoryToken(AppRegisterRepository));
    releaseRepository = module.get(getCustomRepositoryToken(ReleaseRepository));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be get version, app_id not exist', async () => {
    const query = new GetVersionDto();
    const user = {
      userId: 1,
      appId: 'faf0e70f1bad944424393cf309e125',
    };
    const result = await service.getLatestReleaseVersion(query, user as IUser);
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      code: 422,
      data: {
        message: 'App ID not exist',
      },
    });
  });

  it('should be get version', async () => {
    const query = new GetVersionDto();
    const user = {
      userId: 2,
      appId: 'faf0e70f1bad944424393cf309e125cb',
    };
    const result = await service.getLatestReleaseVersion(query, user as IUser);
    expect(result).not.toBeNull();
    expect(result.code).toEqual('requestSuccess');
    expect(result.data).toBeDefined();
    expect(result.data.build_number).toEqual(123);
  });


  it('shouldn\'t be download', async () => {
    const query = new GetDownloadDto();
    query.type = 'auto_update';
    query.uuid = 'mztdw7ltkbwwweh2-201909259-156862085447';
    releaseRepository.findOne = jest.fn().mockResolvedValue(false);

    const result = await service.downloadAutoUpdate(query);
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      code: 'notReleaseVersion',
    });
  });

  it('should be download', async () => {
    const query = new GetDownloadDto();
    query.type = 'auto_update';
    query.uuid = 'mztdw7ltkbeh2-201909259-156862085447';
    const result = await service.downloadAutoUpdate(query);
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      code: 'badRequest',
    });
  });

  it('should be download 2', async () => {
    const query = new GetDownloadDto();
    query.type = 'auto_update';
    const result = await service.downloadAutoUpdate(query);
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      code: 'badRequest',
    });
  });

  it('should be download 3', async () => {
    const query = new GetDownloadDto();
    query.type = 'auto_update';
    query.uuid = 'mztdw7ltkbeh2-201909259-1568620854475';
    const user = {
      userId: 1,
      appId: 'faf0e70f1bad944424393cf309e125cb',
    };
    process.env.AUTO_UPDATE_PATH = '';
    const result = await service.downloadAutoUpdate(query);
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      code: 'notReleaseVersion',
    });
  }, 30000);

  it('should be getReadableStream', async () => {
    const query = Buffer.from('test');
    const result = service.getReadableStream(query);
    expect(result).not.toBeNull();
    expect(result.readable).not.toBeNull();
  });

  it('should be getConfigDownloadLink', async () => {
    const result = await service.getConfigDownloadLink();
    expect(result).not.toBeNull();
  });

  afterAll(async () => {
    await app.close();
  });
});
