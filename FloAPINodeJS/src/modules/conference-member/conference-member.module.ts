import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConferenceChannelEntity } from '../../common/entities/conference-channel.entity';
import { ConferenceMemberRepository, ConferenceRepository } from '../../common/repositories';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { ApiLastModifiedModule } from '../api-last-modified/api-last-modified.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { ChimeChatService } from '../communication/services';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { UsersModule } from '../users/users.module';
import { ConferenceMemberController } from './conference-member.controller';
import { ConferenceMemberService } from './conference-member.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([
      ConferenceChannelEntity
    ]),
    TypeOrmExModule.forCustomRepository([
      ConferenceMemberRepository,
      ConferenceRepository
    ]),
    ApiLastModifiedModule,
    UsersModule,
    DatabaseModule,
    BullMqQueueModule,
    DeletedItemModule

  ],
  controllers: [ConferenceMemberController],
  providers: [ConferenceMemberService, ChimeChatService],
  exports: [ConferenceMemberService]
})
export class ConferenceMemberModule { }
