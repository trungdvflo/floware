import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../test';
import { OBJECT_SHARE_ABLE } from '../../common/constants/common';
import { LinkedCollectionObject } from '../../common/entities/linked-collection-object.entity';
import { TrashEntity } from '../../common/entities/trash.entity';
import { LoggerService } from '../../common/logger/logger.service';
import { RuleRepository } from '../../common/repositories/rule.repository';
import { TrashRepository } from '../../common/repositories/trash.repository';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { TrashQueueService } from '../bullmq-queue/trash-queue.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { SieveEmailService } from '../manual-rule/sieve.email';
import { ShareMemberService } from '../share-member/share-member.service';
import { TrashMemberCreateDto } from './dtos/trash-member.create.dto';
import { TrashMemberService } from './trash-member.service';

const repositoryMockFactory: () => MockType<Repository<TrashEntity>> = jest.fn(() => ({
  findByObjUid: jest.fn((entity) => entity),
  find: jest.fn((entity) => {
    const tem = Object.assign({}, entity);
    entity.map = jest.fn((e) => {
      return tem;
    });
    return entity;
  }),
  findOne: jest.fn((entity) => {
    return {
      ...entity,
      user_id: 1,
      object_type: OBJECT_SHARE_ABLE.URL
    }
  }),
  save: jest.fn((entity) => entity),
  update: jest.fn((entity) => {
    return {
      ...entity,
      affected: 1
    }
  }),
  insert: jest.fn((entity) => {
    entity.id = 1;
    entity.raw = { insertId: 1 };
    return entity;
  }),
  create: jest.fn((entity) => entity),
  remove: jest.fn((entity) => entity),
  delete: jest.fn((entity) => entity),
  query: jest.fn((entity) => entity),
}));
const repositoryMockFactoryQueue: () => MockType<TrashQueueService> = jest.fn(() => ({
  afterCreated: jest.fn((entity) => entity),
  afterDeleted: jest.fn((entity) => entity),
  afterRecovered: jest.fn((entity) => entity),
}));
const repositoryLastApiMockFactory: () => MockType<ApiLastModifiedQueueService> = jest.fn(() => ({
  addJob: jest.fn((entity) => entity),
}));
const linkRepository: () => MockType<Repository<LinkedCollectionObject>> = jest.fn(() => ({
  findOne: jest.fn((entity) => {
    return { id: 1 }
  }),
}));
export class TestUtilsService {
  static createSpyObj(baseName: string[], methodNames: string[]): SpyObject {
    let obj: any = {};
    for (const methodName of methodNames) {
      obj[methodName] = jest.fn();
    }
    let res = {}
    for (const b of baseName) {
      res[b] = () => obj
    }
    return res;
  };
}
export class SpyObject {
  [key: string]: () => { [key: string]: jest.Mock };
}
jest.mock('@nestjs/axios', () => ({
  HttpModule: jest.fn(),
  HttpService: jest.fn(),
}));
const spyHttpClient: SpyObject = TestUtilsService.createSpyObj(['delete', 'put'], ['toPromise']);

const createTestModule = async () => {
  return await Test.createTestingModule({
    providers: [
      TrashMemberService,
      SieveEmailService,
      {
        // how you provide the injection token in a test instance
        provide: TrashRepository,
        useFactory: repositoryMockFactory,
      },
      {
        provide: RuleRepository,
        useFactory: repositoryMockFactory,
      },
      {
        provide: TrashQueueService,
        useFactory: repositoryMockFactoryQueue,
      },
      {
        provide: ShareMemberService,
        useValue: {
          getShareMembers: jest.fn((e) => e),
          getShareMembersForTrash: jest.fn((e) => e),
        },
      },
      {
        provide: ApiLastModifiedQueueService,
        useFactory: repositoryLastApiMockFactory,
      },
      {
        provide: DeletedItemService,
        useFactory: repositoryLastApiMockFactory,
      },
      {
        provide: getRepositoryToken(LinkedCollectionObject),
        useFactory: linkRepository,
      },
      {
        provide: HttpService,
        useValue: spyHttpClient
      },
      LoggerService
    ],
  }).compile();
}

describe('Trash by object_uid', () => {
  let app: INestApplication;
  let service: TrashMemberService;
  let sieveEmailService: SieveEmailService;
  let repository: MockType<TrashRepository>;
  let shareMemberService: ShareMemberService;
  let logger: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await createTestModule();
    app = module.createNestApplication();
    await app.init();

    service = module.get<TrashMemberService>(TrashMemberService);
    sieveEmailService = module.get<SieveEmailService>(SieveEmailService);
    repository = module.get(TrashRepository);
    shareMemberService = module.get<ShareMemberService>(ShareMemberService);
    logger = module.get<LoggerService>(LoggerService);

  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(logger).toBeDefined();
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
    expect(sieveEmailService).toBeDefined();
    expect(shareMemberService).toBeDefined();

  });

  // it('should be create new batch', async () => {
  //   const trashs = [];
  //   const trash = new TrashMemberCreateDto();
  //   trash.object_type = OBJECT_SHARE_ABLE.VJOURNAL;
  //   trashs.push(trash);
  //   shareMemberService.getShareMembers = jest.fn().mockResolvedValue(trashs.map(dto => ({
  //     user_id: 123
  //   })));
  //   shareMemberService.getShareMembersForTrash = jest.fn().mockResolvedValue(trashs.map(dto => {
  //     return {
  //       id: 1,
  //       user_id: 1, // owner
  //       collection_id: dto.collection_id,
  //       shared_status: 1,
  //       access: 2
  //     }
  //   }));

  //   const result = await service.saveBatch(trashs, [], {
  //     userId: 1,
  //   });
  //   expect(result).not.toBeNull();
  //   expect(result.errors).not.toBeNull();
  //   expect(result.results).not.toBeNull();
  // });

  // it('should be create new batch 2', async () => {
  //   const trashs = [];
  //   const trash = new TrashMemberCreateDto();
  //   trash.object_type = OBJECT_SHARE_ABLE.URL;
  //   trash.trash_time = 123456;
  //   trash.object_href = 'href';
  //   trashs.push(trash);
  //   shareMemberService.getShareMembers = jest.fn().mockResolvedValue(trashs.map(dto => ({
  //     user_id: 123
  //   })));
  //   shareMemberService.getShareMembersForTrash = jest.fn().mockResolvedValue(trashs.map(dto => {
  //     return {
  //       id: 1,
  //       user_id: 1, // owner
  //       shared_status: 1,
  //       access: 2
  //     }
  //   }));
  //   service.save = jest.fn().mockResolvedValueOnce(false);
  //   const result = await service.saveBatch(trashs, [], {
  //     userId: 1,
  //   });

  //   expect(result).not.toBeNull();
  //   expect(result.errors).not.toBeNull();
  //   expect(result.results).not.toBeNull();
  // });

  // it('should be create new batch 3', async () => {
  //   const trashs = [];
  //   const trash = new TrashMemberCreateDto();
  //   trash.object_type = OBJECT_SHARE_ABLE.VTODO;
  //   trashs.push(trash);
  //   shareMemberService.getShareMembers = jest.fn().mockResolvedValue(trashs.map(dto => ({
  //     user_id: 123
  //   })));
  //   shareMemberService.getShareMembersForTrash = jest.fn().mockResolvedValue(trashs.map(dto => {
  //     return {
  //       id: 1,
  //       user_id: 1, // owner
  //       collection_id: dto.collection_id,
  //       shared_status: 1,
  //       access: 2
  //     }
  //   }));
  //   service.save = jest.fn().mockRejectedValue(new Error('test'));
  //   const result = await service.saveBatch(trashs, [], {
  //     userId: 1,
  //   });
  //   expect(result).not.toBeNull();
  //   expect(result.errors).not.toBeNull();
  //   expect(result.results).not.toBeNull();
  // });

  // it('should be create new batch 4', async () => {
  //   const trashs = [];
  //   const trash = new TrashMemberCreateDto();
  //   trashs.push(trash);
  //   shareMemberService.getShareMembers = jest.fn().mockResolvedValue(trashs.map(dto => ({
  //     user_id: 123
  //   })));
  //   shareMemberService.getShareMembersForTrash = jest.fn().mockResolvedValue(trashs.map(dto => {
  //     return {
  //       id: 1,
  //       user_id: 1, // owner
  //       shared_status: 1,
  //       access: 2
  //     }
  //   }));
  //   const result = await service.saveBatch(trashs, [], {
  //     userId: 1,
  //   });
  //   expect(result).not.toBeNull();
  //   expect(result.errors).not.toBeNull();
  //   expect(result.results).not.toBeNull();
  // });

  // it('should be fail access=0', async () => {
  //   const trashs = [];
  //   const trash = new TrashMemberCreateDto();
  //   trash.object_type = OBJECT_SHARE_ABLE.VJOURNAL;
  //   trash.object_uid = new GeneralObjectId({
  //     uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
  //   });
  //   trashs.push(trash);
  //   shareMemberService.getShareMembers = jest.fn().mockResolvedValue(trashs.map(dto => ({
  //     user_id: 123
  //   })));
  //   shareMemberService.getShareMembersForTrash = jest.fn().mockResolvedValue(trashs.map(dto => {
  //     return {
  //       id: 1,
  //       user_id: 2, // member
  //       shared_status: 0,
  //       collection_id: 11,
  //       object_uid: dto.object_uid.getPlain(),
  //       object_type: dto.object_type,
  //       access: 0
  //     }
  //   }));
  //   const result = await service.saveBatch(trashs, [], {
  //     userId: 1,
  //   });
  //   expect(result).not.toBeNull();
  //   expect(result.errors).not.toBeNull();
  //   expect(result.results).not.toBeNull();
  // });

  // it('should be pass access=2', async () => {
  //   const trashs = [];
  //   const trash = new TrashMemberCreateDto();
  //   trash.object_type = OBJECT_SHARE_ABLE.VJOURNAL;
  //   trash.object_uid = new GeneralObjectId({
  //     uid: 'e9d13329-0628-49f9-8a76-6f24305cf2fd',
  //   });
  //   trash.object_href = "/calendarserver.php/calendars/anph_po@flodev.net/1bddbc76-7bfc-40f6-8a0a-fd0f53e13658/e9d13329-0628-49f9-8a76-6f24305cf2fd.ics"
  //   trashs.push(trash);
  //   shareMemberService.getShareMembers = jest.fn().mockResolvedValue(trashs.map(dto => ({
  //     user_id: 123
  //   })));
  //   shareMemberService.getShareMembersForTrash = jest.fn().mockResolvedValue(trashs.map(dto => {
  //     return {
  //       id: 1,
  //       user_id: 2, // member
  //       shared_status: 1,
  //       collection_id: 11,
  //       object_uid: dto.object_uid.getPlain(),
  //       object_type: dto.object_type,
  //       access: 2
  //     }
  //   }));
  //   const result = await service.saveBatch(trashs, [], {
  //     userId: 1,
  //   });
  //   expect(result).not.toBeNull();
  //   expect(result.errors).not.toBeNull();
  //   expect(result.results).not.toBeNull();
  // });

  // it('should be fail access=1', async () => {
  //   const trashs = [];
  //   const trash = new TrashMemberCreateDto();
  //   trash.object_type = OBJECT_SHARE_ABLE.VJOURNAL;
  //   trash.object_uid = new GeneralObjectId({
  //     uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
  //   });
  //   trashs.push(trash);
  //   shareMemberService.getShareMembers = jest.fn().mockResolvedValue(trashs.map(dto => ({
  //     user_id: 123
  //   })));
  //   shareMemberService.getShareMembersForTrash = jest.fn().mockResolvedValue(trashs.map(dto => {
  //     return {
  //       id: 1,
  //       user_id: 2, // member
  //       shared_status: 2,
  //       collection_id: 11,
  //       object_uid: dto.object_uid.getPlain(),
  //       object_type: dto.object_type,
  //       access: 1
  //     }
  //   }));

  //   const result = await service.saveBatch(trashs, [], {
  //     userId: 1,
  //   });
  //   expect(result).not.toBeNull();
  //   expect(result.errors).not.toBeNull();
  //   expect(result.results).not.toBeNull();
  // });

  // it('should be create new batch B 2', async () => {
  //   const trashs = [];
  //   const trash = new TrashMemberCreateDto();
  //   trash.object_type = OBJECT_SHARE_ABLE.VJOURNAL;
  //   trash.object_uid = new GeneralObjectId({
  //     uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
  //   });
  //   trashs.push(trash);
  //   shareMemberService.getShareMembers = jest.fn().mockResolvedValue(trashs.map(dto => ({
  //     user_id: 123
  //   })));
  //   shareMemberService.getShareMembersForTrash = jest.fn().mockResolvedValue(trashs.map(dto => {
  //     return {
  //       id: 1,
  //       user_id: 2, // member
  //       shared_status: 1,
  //       collection_id: 11,
  //       object_uid: dto.object_uid.getPlain(),
  //       object_type: dto.object_type,
  //       access: 1
  //     }
  //   }));
  //   const result = await service.saveBatch(trashs, [], {
  //     userId: 1,
  //   });
  //   expect(result).not.toBeNull();
  //   expect(result.errors).not.toBeNull();
  //   expect(result.results).not.toBeNull();
  // });

  // it('should be create new', async () => {
  //   const trash = new Trash();
  //   trash.object_type = OBJECT_SHARE_ABLE.VJOURNAL;
  //   trash.object_uid = new GeneralObjectId({
  //     uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
  //   }).objectUid;
  //   const result = await service.save(trash);
  //   expect(result).not.toBeNull();
  //   expect(result).toMatchObject({
  //     object_type: 'VJOURNAL',
  //     object_uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
  //   });

  //   try {
  //     const result2 = await service.save(trash);
  //     expect(result2).toThrow(Error);
  //   } catch (err) { }
  // });

  // it('should be create new 2', async () => {
  //   const trash = new Trash();
  //   trash.object_type = OBJECT_SHARE_ABLE.URL;
  //   trash.object_uid = new GeneralObjectId({
  //     uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
  //   }).objectUid;
  //   const result = await service.save(trash);
  //   expect(result).not.toBeNull();
  //   expect(result).toMatchObject({
  //     object_type: 'URL',
  //     object_uid: '4bab9469-f06c-4508-a857-b7b4df4df42f',
  //   });
  // });

  afterAll(async () => {
    await app.close();
  });
});

describe('Trash by object_id', () => {
  let app: INestApplication;
  let service: TrashMemberService;
  let repository: MockType<TrashRepository>;
  let shareMemberService: ShareMemberService;
  let logger: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await createTestModule();
    app = module.createNestApplication();
    await app.init();

    service = module.get<TrashMemberService>(TrashMemberService);
    repository = module.get(TrashRepository);
    shareMemberService = module.get<ShareMemberService>(ShareMemberService);
    logger = module.get<LoggerService>(LoggerService);

  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(logger).toBeDefined();
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
    expect(shareMemberService).toBeDefined();

  });



  it('should be fail access=0', async () => {
    const trashs = [];
    const trash = new TrashMemberCreateDto();
    trash.object_type = OBJECT_SHARE_ABLE.VJOURNAL;
    trash.object_id = 123;
    trashs.push(trash);
    shareMemberService.getShareMembers = jest.fn().mockResolvedValue(trashs.map(dto => ({
      user_id: 123
    })));
    shareMemberService.getShareMembersForTrashByObjectId = jest.fn().mockResolvedValue(trashs.map(dto => {
      return {
        id: 1,
        user_id: 2, // member
        shared_status: 0,
        collection_id: 11,
        object_id: dto.object_id,
        object_type: dto.object_type,
        access: 0
      }
    }));
    const result = await service.saveBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be pass access=2', async () => {
    const trashs = [];
    const trash = new TrashMemberCreateDto();
    trash.object_type = OBJECT_SHARE_ABLE.VJOURNAL;
    trash.object_id = 123;
    trash.object_href = "/calendarserver.php/calendars/anph_po@flodev.net/1bddbc76-7bfc-40f6-8a0a-fd0f53e13658/e9d13329-0628-49f9-8a76-6f24305cf2fd.ics"
    trashs.push(trash);
    shareMemberService.getShareMembers = jest.fn().mockResolvedValue(trashs.map(dto => ({
      user_id: 123
    })));
    shareMemberService.getShareMembersForTrashByObjectId = jest.fn().mockResolvedValue(trashs.map(dto => {
      return {
        id: 1,
        user_id: 2, // member
        shared_status: 1,
        collection_id: 11,
        object_id: dto.object_id,
        object_type: dto.object_type,
        access: 2
      }
    }));
    const result = await service.saveBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be fail access=1', async () => {
    const trashs = [];
    const trash = new TrashMemberCreateDto();
    trash.object_type = OBJECT_SHARE_ABLE.VJOURNAL;
    trash.object_id = 123;
    trashs.push(trash);
    shareMemberService.getShareMembers = jest.fn().mockResolvedValue(trashs.map(dto => ({
      user_id: 123
    })));
    shareMemberService.getShareMembersForTrashByObjectId = jest.fn().mockResolvedValue(trashs.map(dto => {
      return {
        id: 1,
        user_id: 2, // member
        shared_status: 2,
        collection_id: 11,
        object_id: dto.object_id,
        object_type: dto.object_type,
        access: 1
      }
    }));

    const result = await service.saveBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be create new batch B 2', async () => {
    const trashs = [];
    const trash = new TrashMemberCreateDto();
    trash.object_type = OBJECT_SHARE_ABLE.VJOURNAL;
    trash.object_id = 123;
    trashs.push(trash);
    shareMemberService.getShareMembers = jest.fn().mockResolvedValue(trashs.map(dto => ({
      user_id: 123
    })));
    shareMemberService.getShareMembersForTrashByObjectId = jest.fn().mockResolvedValue(trashs.map(dto => {
      return {
        id: 1,
        user_id: 2, // member
        shared_status: 1,
        collection_id: 11,
        object_id: dto.object_id,
        object_type: dto.object_type,
        access: 1
      }
    }));
    const result = await service.saveBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  it('should be create new batch by object_id', async () => {
    const trashs = [];
    const trash = new TrashMemberCreateDto();
    trash.object_type = OBJECT_SHARE_ABLE.VJOURNAL;
    trash.object_id = 123;
    trashs.push(trash);
    shareMemberService.getShareMembers = jest.fn().mockResolvedValue(trashs.map(dto => ({
      user_id: 123
    })));
    shareMemberService.getShareMembersForTrashByObjectId = jest.fn().mockResolvedValue(trashs.map(dto => {
      return {
        id: 1,
        user_id: 2, // member
        shared_status: 1,
        collection_id: 11,
        object_id: dto.object_id,
        object_type: dto.object_type,
        access: 1
      }
    }));
    const result = await service.saveBatch(trashs, [], fakeReq);
    expect(result).not.toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.results).not.toBeNull();
  });

  afterAll(async () => {
    await app.close();
  });
});