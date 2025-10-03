import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cloud } from '../../common/entities/cloud.entity';
import { LoggerModule } from '../../common/logger/logger.module';
import appConfig from '../../configs/app';
import cfgRedis from '../../configs/redis';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { SortObjectsModule } from '../sort-object/sort-object.module';
import { ThirdPartyAccountModule } from '../third-party-account/third-party-account.module';
import { CloudController } from './cloud.controller';
import { CloudService } from './cloud.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Cloud
    ]),
    DeletedItemModule,
    BullMqQueueModule,
    DatabaseModule,
    LoggerModule,
    ThirdPartyAccountModule,
    SortObjectsModule,
    ConfigModule.forFeature(cfgRedis),
    BullModule.forRootAsync({
      imports: [ConfigModule.forFeature(appConfig)],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          db: configService.get('redis.db'),
          password: configService.get('redis.password'),
          tls: configService.get('redis.tls')
        },
        defaultJobOptions: {
          removeOnComplete: configService.get('redis.removeOnComplete'),
          removeOnFail: configService.get('redis.removeOnFail')
        }
      }),
      inject: [ConfigService]
    })
  ],
  controllers: [CloudController],
  providers: [CloudService],
  exports: [CloudService],
})
export class CloudModule { }
