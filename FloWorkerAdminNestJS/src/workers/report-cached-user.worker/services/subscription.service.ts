import { getRepository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';

export interface SubscriptionServiceOptions {
  fields: (keyof Subscription)[];
}
export class SubscriptionService {
  private readonly sub = getRepository(Subscription);
  /**
   * Get third party account
   * @param userId
   * @returns
   */
  findOneById(subId: string, options: SubscriptionServiceOptions) {
    return this.sub.findOne({
      select: options?.fields,
      where: { id: subId },
      order: { id: 'DESC' }
    });
  }
}
