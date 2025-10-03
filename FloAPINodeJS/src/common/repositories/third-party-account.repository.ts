import { Injectable } from '@nestjs/common';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { ThirdPartyAccount } from '../entities/third-party-account.entity';
import { BaseRepository } from './base.repository';

@Injectable()
@CustomRepository(ThirdPartyAccount)
export class ThirdPartyAccountRepo extends BaseRepository<ThirdPartyAccount> {

  async updateAndReturn(pq?: any, data?: any) {
    try{
      const item = await this.findOne({ where: pq });
      if (!item || !item.id) { return false; }
      await this.update(item.id, data);
      return {
        ...item,
        ...data
      };
    } catch(e){
      throw e;
    }
  }

  save3rdPatrtyAccount(thirdAccount) {
    return this.save(thirdAccount);
  }

  removeNullProperties(obj) {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const hasProperties = value && Object.keys(value).length > 0;
      if (value === undefined || value === null) {
        delete obj[key];
      }
      else if ((typeof value !== "string") && hasProperties) {
        this.removeNullProperties(value);
      }
    });
    return obj;
  }
}
