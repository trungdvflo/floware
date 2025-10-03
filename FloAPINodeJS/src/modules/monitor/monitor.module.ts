import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicKey } from '../../common/entities/dynamic-key.entity';
import { Users } from '../../common/entities/users.entity';
import { LoggerModule } from '../../common/logger/logger.module';
import floConfig from '../../configs/flo';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { MonitorController } from './monitor.controller';
import { MonitorService } from './monitor.service';

@Module({
  imports: [
    ConfigModule,
    ConfigModule.forFeature(floConfig),
    TypeOrmModule.forFeature([
      Users,
      DynamicKey
    ]),
    DeletedItemModule,
    DatabaseModule,
    LoggerModule
  ],
  controllers: [MonitorController],
  providers: [MonitorService]
})
export class MonitorModule { }
