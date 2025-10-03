import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { MSG_ERR_LINK, MSG_ERR_NOT_EXIST } from '../../../common/constants/message.constant';
import { Collection, DeletedItem, GlobalSetting } from '../../../common/entities';
import { IUser } from '../../../common/interfaces';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { GlobalSettingService } from '../setting.service';

const repoMockFactory = jest.fn(() => ({
  findOne: jest.fn(entity => {
    return {
      data: {
        somesetting: 'hash',
        updated_date: 1
      }
    };
  }),
  update: jest.fn((a, entity) => {
    return entity;
  }),
  metadata: { name: 'ENTITY_ALIAS', ownColumns: [{ databaseName: 'id', propertyName: 'id' }] },
}));
const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({}));
const apiLastModifiedServiceMockFactory: () =>
  MockType<ApiLastModifiedQueueService> = jest.fn(() => ({}));

const repoMockCollectionFactory: () => MockType<Repository<Collection>> = jest.fn(() => ({
  findOne: jest.fn(entity => entity),
}));

const dataUpdate: any = {
  keep_state: { 'somekey': 'somevalue' },
  working_time: [],
  dw_show: 1,
  default_folder: 0,
  is_archived: 0,
  updated_date: 1,
  todo_collection_id: 0,
  todo_ask: 1,
  default_cal: '2483a860-ec92-0135-2afb-005056030716',
  timezone: 'Asia/Jakarta',
  omni_cal_id: '784fb20-6a6d-0137-34db-005056030716',
  signature: '<div class=”FLO_d944424393cf309e125cbfaf0e70f1ba”>Best Regards, Flo Team</div>'
};

describe('Setting', () => {
  let app: INestApplication;
  let settingService: GlobalSettingService;
  let repo: MockType<Repository<GlobalSetting>>;
  let collectionRepo: MockType<Repository<Collection>>;
  let deletedItemService: DeletedItemService;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let apiLastModifiedQueueService: MockType<ApiLastModifiedQueueService>;

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
        GlobalSettingService,
        DeletedItemService,
        DatabaseUtilitiesService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(GlobalSetting),
          useFactory: repoMockFactory,
        },
        {
          provide: getRepositoryToken(Collection),
          useFactory: repoMockCollectionFactory
        },
        {
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory,
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory,
          useValue: {
            addJob: jest.fn((e) => e),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    settingService = module.get<GlobalSettingService>(GlobalSettingService);
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    databaseUtilitiesService = module.get<DatabaseUtilitiesService>(DatabaseUtilitiesService);
    repo = module.get(getRepositoryToken(GlobalSetting));
    collectionRepo = module.get(getRepositoryToken(Collection));
    apiLastModifiedQueueService = module.get(ApiLastModifiedQueueService);
  });

  it('should be defined', () => {
    expect(settingService).toBeDefined();
    expect(deletedItemService).toBeDefined();
    expect(databaseUtilitiesService).toBeDefined();
    expect(apiLastModifiedQueueService).toBeDefined();
  });

  it('should call checkCollectionExisted', async () => {
    const dataUpdate: any = {
      keep_state: { 'somekey': 'somevalue' },
      working_time: [],
      dw_show: 1,
      default_folder: 0,
      updated_date: 1,
      todo_collection_id: 1234,
      todo_ask: 1,
      default_cal: '2483a860-ec92-0135-2afb-005056030716',
      timezone: 'Asia/Jakarta',
      omni_cal_id: '784fb20-6a6d-0137-34db-005056030716',
      signature: '<div class=”FLO_d944424393cf309e125cbfaf0e70f1ba”>Best Regards, Flo Team</div>'
    };
    try {
      collectionRepo.findOne = jest.fn().mockReturnValue(false);
      await settingService.checkCollectionExisted(123, 1, dataUpdate);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.response.message).toEqual(MSG_ERR_LINK.COLLECTION_NOT_EXIST)
    }
  });

  describe('get setting instances', () => {
    it('should return empty array', async () => {
      repo.findOne = jest.fn().mockReturnValue([]);
      const result = await settingService.findAll(user.userId, { fields: ['id'] });
      expect(result.data).toHaveLength(0);
    });
    it('should return throw error', async () => {
      repo.findOne = jest.fn().mockRejectedValue({});
      try {
        const result = await settingService.findAll(user.userId, { fields: ['id'] });
        expect(result.data).toHaveLength(0);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });
  });

  describe('update setting instances', () => {
    it('should return the item does not exist', async () => {
      try {
        repo.findOne = jest.fn().mockReturnValue(false);
        await settingService.updateSetting(dataUpdate, fakeReq);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.response.message).toEqual(MSG_ERR_NOT_EXIST)
      }
    });

    it('should return collection id is root or not', async () => {
      try {
        dataUpdate.default_folder = 1;
        repo.findOne = jest.fn().mockReturnValue(true);
        collectionRepo.findOne = jest.fn().mockReturnValue(false);
        const rs = await settingService.updateSetting(dataUpdate, fakeReq);
      } catch (e) {
        expect(e).not.toBeNull();
      }
    });

    it('should return sucess', async () => {
      dataUpdate.default_folder = 1;
      dataUpdate.note_collection_id = 1;
      dataUpdate.todo_collection_id = 1;
      repo.findOne = jest.fn().mockReturnValue(true);
      collectionRepo.findOne = jest.fn().mockReturnValue(true);

      repo.create = jest.fn().mockReturnValue(dataUpdate);
      repo.save = jest.fn().mockReturnValue(dataUpdate);
      const rs = await settingService.updateSetting(dataUpdate, fakeReq);
      expect(rs.data.default_folder).toEqual(dataUpdate.default_folder);
      expect(rs.data.updated_date).toEqual(dataUpdate.updated_date);
    });
  });

  describe('findOneByUserId', () => {
    it('should return empty array', async () => {
      repo.findOne = jest.fn().mockReturnValue([]);
      const result = await settingService.findOneByUserId(1, { fields: 'id' })
      expect(result).toHaveLength(0);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
