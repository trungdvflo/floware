import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { CredentialController } from './credential.controller';
import { CredentialService } from './credential.service';
import { CredentialRepository } from '../../common/repositories/credential.repository';
import { SaltRepository } from '../../common/repositories/salt.repository';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      CredentialRepository,
      SaltRepository
    ]),
    DeletedItemModule,
    DatabaseModule,
    BullMqQueueModule,
  ],
  controllers: [CredentialController],
  providers: [ CredentialService ],
  exports: [CredentialService],
})
export class CredentialModule { }
