import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserUsageRepository } from '../database/repositories';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [AuthModule],
  controllers: [StatisticsController],
  providers: [StatisticsService, UserUsageRepository],
})
export class StatisticsModule {}
