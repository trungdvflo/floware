import { getRepository, Repository } from 'typeorm';
import { Quota } from '../../entities/mail/quota.entity';

export interface QuotaServiceOptions {
  fields: (keyof Quota)[];
}
export class MailQuotaService {
  private readonly quotaMail: Repository<Quota> = getRepository(Quota, 'mail');
  private readonly quota: Repository<Quota> = getRepository(Quota, 'default');

  async findOneByEmail(email: string, options: QuotaServiceOptions) {
    return this.quota.findOne({
      select: options?.fields,
      where: { username: email }
    });
  }

  async updateQuota(email: string, { cal_bytes, card_bytes, file_bytes }: Partial<Quota>) {
    return await this.quota.update({ username: email }, { cal_bytes, card_bytes, file_bytes });
  }

  /**
   * Delete items by user name
   * @param username
   * @returns
   */
  deleteByUserName(username: string) {
    return this.quotaMail.delete({ username });
  }
}
