import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { MEETING_REGEX } from '../common/utils/common.util';

export class AttendeeParamDTO {
  @Expose()
  @IsString()
  @IsNotEmpty()
  @Matches(MEETING_REGEX)
  MeetingId: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @Matches(MEETING_REGEX)
  AttendeeId: string;
}
