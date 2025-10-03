import { ThirdPartyAccount } from '../../../commons/entities/third-party-account.entity';
import {  getRepository } from 'typeorm';
import { CONN_EXP_NAME } from '../constant';
import { ThirdPartyAccountExport } from '../entities/third-party-account.entity-export.entity';
import { DeleteService } from './delete.service';

export class ThirdPartyAccountService {
  private readonly thirdAccRepo = getRepository(ThirdPartyAccount);
  private readonly thirdAccExpRepo = getRepository(ThirdPartyAccountExport, CONN_EXP_NAME);
  private readonly deleteService = new DeleteService();

  async export () {
    // can not check in export data, because we need the newest data
    return;
    return await this.deleteService.export(this.thirdAccRepo, this.thirdAccExpRepo);
  }
}
