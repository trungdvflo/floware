import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SqsModule } from '@ssut/nestjs-sqs';
import { TypeOrmExModule } from 'modules/database/typeorm-ex.module';
import { MeetingModule } from 'modules/meeting/meeting.module';
import { RedisModule } from 'modules/redis/redis.module';
import { ConferenceMemberRepo } from 'repositories/conference_member.repository';
import { MeetingActivitiesRepository } from 'repositories/meeting-activity.repository';
import { MeetingAttendeeRepository } from 'repositories/meeting-attendee.repository';
import { MeetingInfoRepository } from 'repositories/meeting-info.repository';
import { MeetingUserUsageRepository } from 'repositories/meeting-user-usage.repository';
import chimeConfig from '../../configs/chime.config';
import { MeetingEventController } from './meeting-event.controller';
import { MeetingEventService } from './meeting-event.service';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    MeetingModule,
    TypeOrmExModule.forCustomRepository([
      MeetingInfoRepository,
      MeetingAttendeeRepository,
      MeetingActivitiesRepository,
      MeetingUserUsageRepository,
      ConferenceMemberRepo,
    ]),
    SqsModule.registerAsync({
      imports: [ConfigModule.forFeature(chimeConfig)],
      useFactory: async (configService: ConfigService) => {
        return {
          consumers: [{
            name: configService.get('chime.meetingEventQueue'),
            queueUrl: configService.get('chime.meetingEventQueueUrl'),
            region: configService.get('chime.region')
          }],
          producers: [],
        };
      },
      inject: [ConfigService],
    })
  ],
  controllers: [],
  providers: [
    MeetingEventService,
    MeetingEventController
  ],
  exports: [],
})
export class MeetingEventModule { }