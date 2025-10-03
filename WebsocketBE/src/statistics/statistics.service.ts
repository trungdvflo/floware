import { Injectable } from '@nestjs/common';
import { UserUsageRepository } from '../database/repositories';

@Injectable()
export class StatisticsService {
  constructor(private readonly userUsageRepo: UserUsageRepository) {}

  async getUsageForUser(email: string) {
    const usage = await this.userUsageRepo.findOne({
      select: [
        'message_size_usage',
        'message_count',
        'channel_count',
        'created_date',
        'updated_date',
      ],
      where: {
        email,
      },
    });
    return usage;
  }
}
