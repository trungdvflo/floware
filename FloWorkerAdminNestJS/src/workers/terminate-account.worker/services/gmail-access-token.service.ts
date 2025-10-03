import { getRepository } from 'typeorm';
import { GmailAccessToken } from '../entities/gmail-access-token.entity';

export interface GmailAccessTokenServiceOptions {
  fields: (keyof GmailAccessToken)[];
}

export class GmailAccessTokenService {
  private readonly repo = getRepository(GmailAccessToken);

  /**
   * Get access token
   * @param userId
   * @returns
   */
  findByUserId(userId: number, options: GmailAccessTokenServiceOptions) {
    return this.repo.find({
      select: options?.fields,
      where: { user_id: userId },
      order: { id: 'DESC' }
    });
  }

  /**
   * Delete cloud storage by user id
   * @param userId
   * @returns
   */
  deleteByUserId(userId: number) {
    return this.repo.delete({ user_id: userId });
  }
}
