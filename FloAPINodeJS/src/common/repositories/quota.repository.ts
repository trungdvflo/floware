import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { QuotaEntity } from '../entities/quota.entity';
import { GetOptionInterface } from '../interfaces/collection.interface';
import { QUOTA_COMMON_BYTES } from '../utils/typeorm.util';

@Injectable()
@CustomRepository(QuotaEntity)
export class QuotaRepository extends Repository<QuotaEntity> {
  async getQuotaByOptions(options: GetOptionInterface<QuotaEntity>){
    const quotaItem = this.findOne({
      select: options.fields,
      where: options.conditions
    });
    return quotaItem;
  }

  /**
   * Change(Add/Sub) quota of the field in quota table
   * @param field  ex: file_common_bytes, file_bytes
   * @param bytes  bytes > 0 : add, bytes < 0 : sub
   * @param username quota of the user
   * @returns
   */
  changeQuota(field: string, bytes: number, username: string) {
    let changeSt = `${field} + ${bytes}`;
    if (bytes < 0) {
      changeSt = `${field} - ${Math.abs(bytes)}`;
    }
    const upExpression = {
      [field]: () => changeSt
    };
    return this.manager.createQueryBuilder()
    .update(QuotaEntity)
    .set(upExpression)
    .where("username = :username", { username })
    .execute();
  }

  /**
   * Change(Add/Sub) quota of the file_common_bytes in quota table
   * @param bytes bytes > 0 : add, bytes < 0 : sub
   * @param username quota of the user
   * @returns
   */
  changeQuotaFileCommon(bytes: number, username: string) {
    return this.changeQuota(QUOTA_COMMON_BYTES, bytes, username);
  }

}