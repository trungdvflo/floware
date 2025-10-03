import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorator/typeorm.decorator';
import { QuotaEntity } from '../models/quota.entity';

@Injectable()
@CustomRepository(QuotaEntity)
export class QuotaRepository extends Repository<QuotaEntity> {

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
    return this.changeQuota('file_common_bytes', bytes, username);
  }

  /**
   * Change(Add/Sub) quota of the file_common_bytes in quota table
   * @param bytes bytes > 0 : add, bytes < 0 : sub
   * @param userId quota of the user
   * @returns
   */
  async changeQuotaFileCommonByUserId(bytes: number, userId: number) {
    const query = await this.manager
      .query(`SELECT username FROM user WHERE id = ?`, [userId]);
    if (query[0] && query[0].username) {
      return this.changeQuotaFileCommon(bytes, query[0].username);
    }
  }
}