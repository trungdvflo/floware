import { HttpService } from '@nestjs/axios';
import { CacheModule, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { UserDeleted } from '../../../common/entities/user-deleted.entity';
import { Users } from '../../../common/entities/users.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import { UsersRepository } from '../../../common/repositories/user.repository';
import { ApiLastModifiedQueueService } from '../../../modules/bullmq-queue/api-last-modified-queue.service';
import { SpyObject, TestUtilsService } from '../../../modules/devicetoken/test/devicetoken.service.spec';
import { UsersService } from '../users.service';
import * as faker from './faker';
jest.mock('@nestjs/axios', () => ({
  HttpModule: jest.fn(),
  HttpService: jest.fn(),
}));

const createQueryBuilderMock = {
  leftJoin: jest.fn(),
  where: jest.fn(),
  select: jest.fn(),
  getRawOne: jest.fn(),
};

const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(() => ({
  createQueryBuilder: jest.fn(() => createQueryBuilderMock),
  find: jest.fn((entity) => entity),
  save: jest.fn((entity) => entity),
  insert: jest.fn((e) => e),
  update: jest.fn((entity) => entity),
  remove: jest.fn((entity) => entity),
  create: jest.fn((e) => e),
  findOne: jest.fn((e) => e),
  disableUserAndReport: jest.fn((e) => e),
}));

const spyHttpClient: SpyObject = TestUtilsService.createSpyObj('get', ['toPromise']);

const userRepositoryMock: jest.Mocked<Repository<Users>> = {
  findOne: jest.fn(),
} as any;


const apiLastModifiedServiceMockFactory: () => MockType<ApiLastModifiedQueueService> = jest.fn(
  () => ({
    addJob: jest.fn((entity) => entity),
  }),
);
const fakeUserProfile = {
  email: 'nguyenvana@flomail.net',
  fullname: 'Nguyen Van A',
  description: 'Description of flo account',
  birthday: '110986d9200',
  gender: 0,
  quota_limit_bytes: 0,
  disabled: 0,
  updated_date: 1619428034.369,
};

describe('UsersService', () => {
  let app: INestApplication;
  let userService: UsersService;
  let userRepository: MockType<Repository<Users>>;
  let userDeletedRepository: MockType<Repository<UserDeleted>>;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;
  let cache: { get; set; store; del };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({}),
      ],
      providers: [
        UsersService,
        LoggerService,
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory,
        },
        {
          provide: HttpService,
          useValue: spyHttpClient
        },
        {
          // how you provide the injection token in a test instance
          provide: UsersRepository,
          useFactory: repositoryMockFactory,
        },
        {
          provide: getRepositoryToken(UserDeleted),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    userRepository = module.get(UsersRepository);
    userDeletedRepository = module.get(getRepositoryToken(UserDeleted));
    userService = module.get<UsersService>(UsersService);
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
    cache = module.get<{ get; set; store; del }>('CACHE_MANAGER');
  });

  it('should be userService defined', () => {
    expect(userService).toBeDefined();
  });

  it('should getUserProfileByEmail', async () => {
    const fakedUserProfile: Users = faker.fakeUserProfile();
    const profile = await userService.getUserProfileByEmail(fakedUserProfile.email);
    expect(profile).not.toBeNull();
    expect(profile['where'].email).toEqual(fakedUserProfile.email);
  });

  it('should find and return the user profile', async () => {
    const fakedUserProfile: Users = faker.fakeUserProfile();
    createQueryBuilderMock.leftJoin.mockReturnThis();
    createQueryBuilderMock.where.mockReturnThis();
    createQueryBuilderMock.select.mockReturnThis();
    createQueryBuilderMock.getRawOne.mockResolvedValue(fakedUserProfile);

    const profile = await userService.getUserProfileById(fakedUserProfile.id);
    expect(profile).toEqual(fakedUserProfile);

  });

  it("should not return user profile when the user doesn't exist", async () => {
    userRepositoryMock.findOne.mockResolvedValue(undefined);
    const profile = await userService.getUserProfileById(1);
    expect(profile).not.toBeNull();
  });


  it('should find and update matching user profile', async () => {
    const fake: Users = faker.fakeUserProfile();
    userService.getUserProfileById = jest.fn().mockResolvedValue(fakeUserProfile);

    const user = await userService.updateUserProfile(fake, fakeReq);
    expect(userService.getUserProfileById).toBeCalledTimes(1);
    expect(userService.getUserProfileById).toHaveBeenCalledWith(fakeReq.user.id);
    if (user) {
      expect(apiLastModifiedQueueService.addJob).toBeCalledTimes(1);
      // expect(apiLastModifiedQueueService.addJob).toHaveBeenCalledWith({
      //   apiName: ApiLastModifiedName.USER,
      //   userId: fake.id
      // });
    }
    expect(user.birthday).toEqual(fake.birthday);
    expect(user.description).toEqual(fake.description);
    expect(user.fullname).toEqual(fake.fullname);
  });

  it('should not found user profile to update', async () => {
    UsersService.prototype.updateUserProfile = jest.fn().mockImplementationOnce(async () => {
      return null;
    });
    const fakedUserProfile: Users = faker.fakeUserProfile();
    const user = await userService.updateUserProfile(
      fakedUserProfile, fakeReq
    );
    expect(user).toBeNull();
  });

  it('should terminate', async () => {
    const fakedUserProfile: Users = faker.fakeUser();
    const res = await userService.terminateAcc(
      fakedUserProfile
    );
    expect(res).not.toBeNull();
    expect(userRepository['disableUserAndReport']).toBeCalledTimes(1);
    expect(userDeletedRepository.insert).toBeCalledTimes(1);
  });

  it('should get token', async () => {
    const fakedUserProfile: Users = faker.fakeUser();
    const res = await userService.getToken(
      fakedUserProfile,
      'e70f1b125cbad944424393cf309efaf0',
      '719b74f3-0eb9-4514-9eb5-6acd74fb90d9'
    );
    expect(res).not.toBeNull();
  });

  afterAll(async () => {
    await app.close();
  });

});
