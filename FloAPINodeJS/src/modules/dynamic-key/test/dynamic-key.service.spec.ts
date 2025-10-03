import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MockType } from 'test';
import { Repository } from 'typeorm';
import { DynamicKey } from '../../../common/entities/dynamic-key.entity';
import { AppRegisterRepo } from '../../../common/repositories/app.repository';
import { DynamicKeyRepo } from '../../../common/repositories/dynamic.repository';
import { DynamicKeyService } from '../dynamic-key.service';

const repoMockFactory: () => MockType<Repository<DynamicKey>> = jest.fn(() => ({
  findOne: jest.fn(entity => {
    return entity;
  }),
  count: jest.fn(entity => {
    return entity;
  }),
  ping: jest.fn(entity => {
    return entity === 'app_id' ? 1 : 0;
  }),
  AesEncrypted: jest.fn(entity => {
    return {
      pkey: 'hash',
      updated_date: 1
    };
  })
}));
describe('DynamicKeyService', () => {
  let app: INestApplication;
  let dkService: DynamicKeyService;
  let appRepo: MockType<Repository<AppRegisterRepo>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        DynamicKeyService,
        {
          provide: DynamicKeyRepo,
          useFactory: repoMockFactory
        }, {
          provide: AppRegisterRepo,
          useFactory: repoMockFactory
        }],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    appRepo = module.get(AppRegisterRepo);
    dkService = module.get<DynamicKeyService>(DynamicKeyService);
  });

  it('should be defined', () => {
    expect(dkService).toBeDefined();
  });

  it('should be success get [public key]', async () => {
    appRepo.count.mockReturnValue(1);
    const pkey = await dkService.AesEncrypted('app_id');
    expect(pkey).toMatchObject({ pkey: 'hash', updated_date: 1 });
  });


  it('should be not success get [public key]', async () => {
    appRepo.count.mockReturnValue(0);
    const pkey = await dkService.AesEncrypted('app_id_x');
    expect(pkey).toEqual(null);
  });

  afterAll(async () => {
    await app.close();
  });
});