import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MockType } from 'test';
import { ProtectPageRepository } from '../../../common/repositories/protect_page.repository';
import { CryptoUtil } from '../../../common/utils/crypto.util';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { ProtectPageService } from '../protect_page.service';

const protectPageReposMockFactory: () => MockType<ProtectPageRepository> = jest.fn(() => ({
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
}));

const apiLastModifiedServiceMockFactory: (
) => MockType<ApiLastModifiedQueueService> = jest.fn(() => ({
  addJob: jest.fn(entity => entity),
}));

describe('ProtectPageService', () => {
  let app: INestApplication;
  let service: ProtectPageService;
  let protectPageRepo: MockType<ProtectPageRepository>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProtectPageService,
        DatabaseUtilitiesService,
        {
          provide: ProtectPageRepository,
          useFactory: protectPageReposMockFactory
        },
        {
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory
        }
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<ProtectPageService>(ProtectPageService);
    protectPageRepo = module.get(ProtectPageRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(protectPageRepo).toBeDefined();
  });

  describe('Created protect_page', () => {
    it('should be return password not found', async () => {
      const dto = {
        "verify_code": "PAr4Il5kKusU0SxPZbviwuU/Rsd6ry1G4DfBS1pg70YhBuDsbgFFw4jgtGUu6V9nPlbVVsJxoQm4JIbMNCiAJqBF7Cy2f+jvSDj3wyOaMTGrIgRza9C1lBkL4tOEzj44/De+QvbaBfyZOBwc1Bna8bQejXqyHMjXIES30PXqiG+GQy5DTTnifrg55BULVrSF1ngeII8EJZB17fmHEGnAufW/6pPqSmZV/91hbMT2B9JcIqP1M9dG0MVjoJuUCPfekbu2TGo53h3uY9Fm03TlU/wejuUGOjfx9QVRt4k5ZjaeewI3gkbz/G3lZrMaYichpSA41V6expJXKdojYLijxw=="
      };
      const pwdNotFound = { data: { verify_status: 0 } };
      CryptoUtil.decryptRSA = jest.fn().mockReturnValue('U5WgoXs0M3');
      protectPageRepo.getProtectPwd = jest.fn().mockReturnValue(undefined);
      const result = await service.verify(dto);
      expect(result).toEqual(pwdNotFound)
    });

    it('should be return invalid password', async () => {
      const dto = {
        "verify_code": "pOZWBurFE9KYvEVLMe1UcCkwvRfjIUAmS8liNwnPSp3ApMJFbWqdLb5IDtuqtujsLyMO9sSJJizNWEtZoebOasendF68/Qfg8xlFlEiCMuzhCxot7I0A08JwuOKNW+ov2IjtgkSTeT0Rnq2lSbE6oMl9edj9co8q5u9qpqmVGemBvPM7BdSZAGmwYiLrHIkXSwY+G72M6Bc1AYIupff1eck39wY0lYJp6ORXMnP6sdRCdibFyaUVS5Ye8O74rNnhk5cpk+XOPxl131VtZi9IY6SNaGEsGhMDjafg/ugS6rYz0XIev2mvndfpMMVjWvKPEh8XX6e2x2wODLPxHifqFg=="
      };
      const pwdFound = { data: { verify_status: 0 } };
      const verifyResponse = {
        "verify_code": "PAr4Il5kKusU0SxPZbviwuU/Rsd6ry1G4DfBS1pg70YhBuDsbgFFw4jgtGUu6V9nPlbVVsJxoQm4JIbMNCiAJqBF7Cy2f+jvSDj3wyOaMTGrIgRza9C1lBkL4tOEzj44/De+QvbaBfyZOBwc1Bna8bQejXqyHMjXIES30PXqiG+GQy5DTTnifrg55BULVrSF1ngeII8EJZB17fmHEGnAufW/6pPqSmZV/91hbMT2B9JcIqP1M9dG0MVjoJuUCPfekbu2TGo53h3uY9Fm03TlU/wejuUGOjfx9QVRt4k5ZjaeewI3gkbz/G3lZrMaYichpSA41V6expJXKdojYLijxw=="
      };
      CryptoUtil.decryptRSA = jest.fn().mockImplementationOnce(() => {
        return ['U5WgoXs0M3', '1234567', '34234234'][Math.floor(Math.random() * 3)];
      })
      protectPageRepo.getProtectPwd = jest.fn().mockReturnValue(verifyResponse);
      const result = await service.verify(dto);
      expect(result).toEqual(pwdFound)
    });

    it('should be return valid password', async () => {
      const dto = {
        "verify_code": "PAr4Il5kKusU0SxPZbviwuU/Rsd6ry1G4DfBS1pg70YhBuDsbgFFw4jgtGUu6V9nPlbVVsJxoQm4JIbMNCiAJqBF7Cy2f+jvSDj3wyOaMTGrIgRza9C1lBkL4tOEzj44/De+QvbaBfyZOBwc1Bna8bQejXqyHMjXIES30PXqiG+GQy5DTTnifrg55BULVrSF1ngeII8EJZB17fmHEGnAufW/6pPqSmZV/91hbMT2B9JcIqP1M9dG0MVjoJuUCPfekbu2TGo53h3uY9Fm03TlU/wejuUGOjfx9QVRt4k5ZjaeewI3gkbz/G3lZrMaYichpSA41V6expJXKdojYLijxw=="
      };
      const pwdFound = { data: { verify_status: 1 } };
      CryptoUtil.decryptRSA = jest.fn().mockReturnValue('U5WgoXs0M3');
      protectPageRepo.getProtectPwd = jest.fn().mockReturnValue(pwdFound);
      const result = await service.verify(dto);
      expect(result).toEqual(pwdFound);
    });

    it('should be return error', async () => {
      try {
        const dto = {
          "verify_code": "PAr4Il5kKusU0SxPZbviwuU/Rsd6ry1G4DfBS1pg70YhBuDsbgFFw4jgtGUu6V9nPlbVVsJxoQm4JIbMNCiAJqBF7Cy2f+jvSDj3wyOaMTGrIgRza9C1lBkL4tOEzj44/De+QvbaBfyZOBwc1Bna8bQejXqyHMjXIES30PXqiG+GQy5DTTnifrg55BULVrSF1ngeII8EJZB17fmHEGnAufW/6pPqSmZV/91hbMT2B9JcIqP1M9dG0MVjoJuUCPfekbu2TGo53h3uY9Fm03TlU/wejuUGOjfx9QVRt4k5ZjaeewI3gkbz/G3lZrMaYichpSA41V6expJXKdojYLijxw=="
        };
        CryptoUtil.decryptRSA = jest.fn().mockReturnValue('U5WgoXs0M3');
        protectPageRepo.getProtectPwd = jest.fn().mockImplementationOnce(() => {
          throw Error;
        })
        await service.verify(dto);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
