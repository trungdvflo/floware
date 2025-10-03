import { Module } from '@nestjs/common';
import { LoggerModule } from '../../common/logger/logger.module';
import { ThirdPartyAccountRepo } from '../../common/repositories/third-party-account.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { ThirdPartyAccountController } from './third-party-account.controller';
import { ThirdPartyAccountService } from './third-party-account.service';

@Module({
  imports: [
    LoggerModule,
    DeletedItemModule,
    TypeOrmExModule.forCustomRepository([ThirdPartyAccountRepo]),
    DatabaseModule,
    BullMqQueueModule
  ],
  controllers: [ThirdPartyAccountController],
  providers: [ThirdPartyAccountService],
  exports: [ThirdPartyAccountService]
})
export class ThirdPartyAccountModule {}
