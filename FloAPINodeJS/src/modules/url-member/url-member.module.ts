import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeletedItem } from '../../common/entities/deleted-item.entity';
import { ShareMember } from '../../common/entities/share-member.entity';
import { LoggerModule } from '../../common/logger/logger.module';
import { UrlRepository } from '../../common/repositories/url.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import appConfig from '../../configs/app';
import cfgRedis from '../../configs/redis';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { SortObjectsModule } from '../sort-object/sort-object.module';
import { UrlMembersController } from './url-member.controller';
import { UrlMembersService } from './url-member.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShareMember,
      DeletedItem,
    ]),
    TypeOrmExModule.forCustomRepository([
      UrlRepository
    ]),
    BullMqQueueModule,
    DeletedItemModule,
    DatabaseModule,
    LoggerModule,
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
  providers: [
    UrlMembersService
  ],
  controllers: [UrlMembersController],
  exports: [UrlMembersService],
})
export class UrlMembersModule { }
