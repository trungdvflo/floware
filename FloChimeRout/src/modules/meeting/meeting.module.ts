import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmExModule } from 'modules/database/typeorm-ex.module';
import { ConferenceMemberRepo } from 'repositories/conference_member.repository';
import { MeetingActivitiesRepository } from 'repositories/meeting-activity.repository';
import { MeetingAttendeeRepository } from 'repositories/meeting-attendee.repository';
import { MeetingInfoRepository } from 'repositories/meeting-info.repository';
import { MeetingUserUsageRepository } from 'repositories/meeting-user-usage.repository';
import { MeetingRepository } from 'repositories/meeting.repository';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
@Module({
  imports: [
    ConfigModule,
    TypeOrmExModule.forCustomRepository([
      MeetingRepository,
      MeetingInfoRepository,
      MeetingAttendeeRepository,
      ConferenceMemberRepo,
      MeetingUserUsageRepository,
      MeetingActivitiesRepository
    ]),
  ],
  controllers: [MeetingController],
  providers: [MeetingService],
  exports: [MeetingService],
})
export class MeetingModule { }
