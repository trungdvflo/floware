import { getRepository } from 'typeorm';
import { SubscriptionPurchase } from '../entities/subscription-purchase.entity';

export interface SubscriptionPurchaseServiceOptions {
  fields: (keyof SubscriptionPurchase)[];
}
export class SubscriptionPurchaseService {
  private readonly sub = getRepository(SubscriptionPurchase);
  /**
   * Get third party account
   * @param userId
   * @returns
   */
  findOneByUserId(userId: number, isCurrent: number, options: SubscriptionPurchaseServiceOptions) {
    return this.sub.findOne({
      select: options?.fields,
      where: { user_id: userId, is_current: isCurrent },
      order: { id: 'DESC' }
    });
  }

  /**
   * Delete items by user id
   * @param userId
   * @returns
   */
  deleteByUserId(userId: number) {
    return this.sub.delete({ user_id: userId });
  }
}
