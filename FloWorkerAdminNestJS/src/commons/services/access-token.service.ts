import { getRepository } from 'typeorm';
import { AccessToken } from '../entities/access-token.entity';

export interface AccessTokenServiceOptions {
  fields: (keyof AccessToken)[];
}
export class AccessTokenService {
  private readonly repo = getRepository(AccessToken);
  /**
   * Get access token
   * @param userId
   * @returns
   */
  findOneByUserId(userId: number, options: AccessTokenServiceOptions) {
    return this.repo.findOne({
      select: options?.fields,
      where: { user_id: userId },
      order: { id: 'DESC' }
    });
  }

  /**
   * Delete access token
   * @param userId
   * @returns
   */
  deleteByUserId(userId: number) {
    return this.repo.delete({ user_id: userId });
  }
}
