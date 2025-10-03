import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmExModule } from 'modules/database/typeorm-ex.module';
import { MeetingAttendeeRepository } from 'repositories/meeting-attendee.repository';
import { MeetingInfoRepository } from 'repositories/meeting-info.repository';
import { MeetingRepository } from 'repositories/meeting.repository';
import { AttendeeController } from './attendee.controller';
import { AttendeeService } from './attendee.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmExModule.forCustomRepository([MeetingRepository, MeetingInfoRepository, MeetingAttendeeRepository]),
  ],
  controllers: [AttendeeController],
  providers: [AttendeeService],
})
export class AttendeeModule {}
