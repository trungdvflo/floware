import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmExModule } from 'modules/database/typeorm-ex.module';
import { MeetingAttendeeRepository } from 'repositories/meeting-attendee.repository';
import { MeetingInfoRepository } from 'repositories/meeting-info.repository';
import { MeetingRepository } from 'repositories/meeting.repository';
import { AttendeeMeetingController } from './attendee-meeting.controller';
import { AttendeeMeetingService } from './attendee-meeting.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmExModule.forCustomRepository([
      MeetingRepository, 
      MeetingAttendeeRepository,
      MeetingInfoRepository]),
  ],
  controllers: [AttendeeMeetingController],
  providers: [AttendeeMeetingService],
})
export class AttendeeMeetingModule {}
