import { getRepository } from 'typeorm';
import { AppToken } from '../entities/app-token.entity';

export interface AppTokenServiceOptions {
  fields: (keyof AppToken)[];
}
export class AppTokenService {
  private readonly sub = getRepository(AppToken);
  /**
   * Get third party account
   * @param userId
   * @returns
   */
  findOneByUserId(userId: number, options: AppTokenServiceOptions) {
    return this.sub.findOne({
      select: options?.fields,
      where: { user_id: userId },
      order: { id: 'DESC' }
    });
  }
}
