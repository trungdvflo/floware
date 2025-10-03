import { getRepository, Repository } from 'typeorm';
import { ThirdPartyAccount } from '../entities/third-party-account.entity';

export interface ThirdPartyAccountServiceOptions {
  fields: (keyof ThirdPartyAccount)[];
}
export class ThirdPartyAccounService {
  private readonly repo: Repository<ThirdPartyAccount>;
  constructor() {
    this.repo = getRepository(ThirdPartyAccount);
  }

  /**
   * Get third party account
   * @param userId
   * @returns
   */
  findAllById(userId: number, options: ThirdPartyAccountServiceOptions) {
    return this.repo.find({
      select: options?.fields,
      where: { user_id: userId },
      order: { id: 'DESC' }
    });
  }

  /**
   * Delete items by user id
   * @param userId
   * @returns
   */
  deleteByUserId(userId: number) {
    return this.repo.delete({ user_id: userId });
  }
}
