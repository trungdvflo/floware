import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { MockType } from "test";
import { Repository } from "typeorm";
import { GetAllFilterPlatFormSettingDefault } from "../../../common/dtos/get-all-filter";
import { PlatformSettingDefault } from "../../../common/entities/platform-setting-default.entity";
import { IUser } from "../../../common/interfaces";
import { PlatformSettingDefaultService } from "../platform-setting-default.service";

const createQueryBuilder = {
  select: jest.fn(entity => createQueryBuilder),
  addSelect: jest.fn(entity => createQueryBuilder),
  where: jest.fn(entity => createQueryBuilder),
  andWhere: jest.fn(entity => createQueryBuilder),
  addOrderBy: jest.fn(entity => createQueryBuilder),
  getMany: jest.fn(entity => []),
  getRawMany: jest.fn(entity => entity),
  getRawAndEntities: jest.fn(entity => {
    return {
      entities: [entity],
      raw: [entity]
    };
  }),
  limit: jest.fn(entity => createQueryBuilder),
  innerJoin: jest.fn(entity => createQueryBuilder),
};
const repoMockFactory = jest.fn(() => ({
  metadata: {
    name: 'platform-setting-default',
    ownColumns: []
  },
  createQueryBuilder: jest.fn(e => createQueryBuilder),
}));
describe('PlatformSettingDefaultService', () => {
  let app: INestApplication;
  let service: PlatformSettingDefaultService;
  let repo: MockType<Repository<PlatformSettingDefault>>;
  const user: IUser = {
    userId: 1,
    id: 1,
    email: 'tester001@flomail.net',
    appId: 'e70f1b125cbad944424393cf309efaf0',
    deviceUid: '',
    userAgent: '',
    token: '',
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformSettingDefaultService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(PlatformSettingDefault),
          useFactory: repoMockFactory,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<PlatformSettingDefaultService>(PlatformSettingDefaultService);
    repo = module.get(getRepositoryToken(PlatformSettingDefault));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repo).toBeDefined();
  });

  describe('get collection instances', () => {
    it('should get collection instance list return empty array', async () => {
      const req:GetAllFilterPlatFormSettingDefault<PlatformSettingDefault> = {
        page_size: 1100,
        modified_gte: 123,
        modified_lt: 12,
        min_id: 1,
        ids: [45,682],
        fields: ["id", "app_version"],
        app_version: "1.0.1",
        app_reg_id: "abc"
      };
      const result = await service.getAllFilters(req, user);
      expect(result.data).not.toBeNull();
      expect(result.data).toHaveLength(0);
    });
  
    it('should get collection instance list', async () => {
      const req = {
        page_size: 1100
      };
      const result = await service.getAllFilters(req, user);
      expect(result.data).not.toBeNull();
      expect(result.data).toHaveLength(0);
    });
  });
})