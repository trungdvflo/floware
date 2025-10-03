import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MockType, fakeReq } from '../../../../test';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_ERR_NOT_EXIST } from '../../../common/constants/message.constant';
import {
    SubscriptionPurchaseRepository, SubscriptionRepository
} from '../../../common/repositories/subscription.repository';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { SubscriptionService } from '../subscription.service';
import { fakeSubPurchaseDetail } from './faker';

const subcriptionPurchaseRepoMockFactory: () => MockType<SubscriptionPurchaseRepository> = jest.fn(() => ({
  createnAndUpdateStatusSubcriptionPurchase: jest.fn(entity => entity),
  find: jest.fn(entity => entity),
  findOne: jest.fn((id: number) => id),
  save: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  insert: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  remove: jest.fn(entity => entity),
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

const subcriptionReposMockFactory = jest.fn(() => ({
  findByObjUid: jest.fn(entity => entity),
  find: jest.fn(entity => entity),
  findOne: jest.fn((id: number) => id),
  save: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  insert: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  remove: jest.fn(entity => entity),
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
  manager: {
    query: jest.fn(entity => entity),
  }
}));

const apiLastModifiedServiceMockFactory: (
) => MockType<ApiLastModifiedQueueService> = jest.fn(() => ({
  addJob: jest.fn(entity => entity),
}));

describe('SubscriptionService', () => {
  let app: INestApplication;
  let service: SubscriptionService;
  let subcriptionPurchaseRepo: MockType<SubscriptionPurchaseRepository>;
  let subcriptionRepo: MockType<SubscriptionRepository>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        DatabaseUtilitiesService,
        {
          provide: SubscriptionRepository,
          useFactory: subcriptionReposMockFactory
        },
        {
          provide: SubscriptionPurchaseRepository,
          useFactory: subcriptionPurchaseRepoMockFactory
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory
        }
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<SubscriptionService>(SubscriptionService);
    subcriptionPurchaseRepo = module.get(SubscriptionPurchaseRepository);
    subcriptionRepo = module.get(SubscriptionRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(subcriptionRepo).toBeDefined();
    expect(subcriptionPurchaseRepo).toBeDefined();
  });

  describe('Get subscription', () => {
    it('should be return error', async () => {
      try {
        subcriptionRepo.manager['query'] = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.getAllFiles(fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should be return subscription detail by user id', async () => {
      subcriptionRepo.getSubscriptionUser = jest.fn().mockReturnValue(fakeSubPurchaseDetail);
      const result = await service.getAllFiles(fakeReq);
      expect(result['data']).toEqual(fakeSubPurchaseDetail);
    });
  });


  describe('Created subscription', () => {
    it('should be return invalidSubcription', async () => {
      const dtoSub = {
        "sub_id": "com.floware.flo.product.monthlypro",
        "transaction_id": "5a4cc0b8e563ddea0f0fa86f3320eac0a815",
        "receipt_data": "",
        "description": "Upgrade from Free to Premium account",
        "purchase_type": 0,
        "purchase_status": 1
      };
      subcriptionRepo.getSubscriptionByOptions = jest.fn().mockReturnValue(undefined);
      const result = await service.create(dtoSub, fakeReq);
      expect(result.error.code).toEqual(ErrorCode.INVALID_SUBCRIPTION)
      expect(result.error.message).toEqual(MSG_ERR_NOT_EXIST)
    });

    it('should be return invalidSubcription', async () => {
      const dtoSub = {
        "sub_id": "com.floware.flo.product.monthlypro",
        "transaction_id": "5a4cc0b8e563ddea0f0fa86f3320eac0a815",
        "receipt_data": "",
        "description": "Upgrade from Free to Premium account",
        "purchase_type": 0,
        "purchase_status": 1
      };
      subcriptionRepo.getSubscriptionByOptions = jest.fn().mockReturnValue(true);
      subcriptionPurchaseRepo.createnAndUpdateStatusSubcriptionPurchase = jest.fn().mockReturnValue(dtoSub);
      const result = await service.create(dtoSub, fakeReq);
      expect(result.data).toEqual(dtoSub);
    });

    it('should be return error', async () => {
      try {
        const dtoSub = {
          "sub_id": "com.floware.flo.product.monthlypro",
          "transaction_id": "5a4cc0b8e563ddea0f0fa86f3320eac0a815",
          "receipt_data": "",
          "description": "Upgrade from Free to Premium account",
          "purchase_type": 0,
          "purchase_status": 1
        };
        subcriptionRepo.getSubscriptionByOptions = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.create(dtoSub, fakeReq);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
