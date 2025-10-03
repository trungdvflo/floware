import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallingHistory } from '../../common/entities/call-history.entity';
import { Users } from '../../common/entities/users.entity';
import { LoggerModule } from '../../common/logger/logger.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { CallingHistoryController } from './call-history.controller';
import { CallingHistoryService } from './call-history.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([CallingHistory, Users]),
    DeletedItemModule,
    DatabaseModule,
    LoggerModule
  ],
  controllers: [CallingHistoryController],
  providers: [CallingHistoryService]
})
export class CallingHistoryModule {}
