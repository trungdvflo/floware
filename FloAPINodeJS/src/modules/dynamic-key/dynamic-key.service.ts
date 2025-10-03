import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppRegisterRepo } from '../../common/repositories/app.repository';
import { DynamicKeyRepo } from '../../common/repositories/dynamic.repository';

@Injectable()
export class DynamicKeyService {
  constructor(
    @InjectRepository(AppRegisterRepo) private readonly appRepo: AppRegisterRepo,
    @InjectRepository(DynamicKeyRepo) private readonly dynamicKeyRepo: DynamicKeyRepo) {
  }

  async AesEncrypted(appId: string) {
    const ping = await this.appRepo.ping(appId);
    if (ping < 1) {
      return null;
    }
    return this.dynamicKeyRepo.AesEncrypted();
  }
}