import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { MEETING_REGEX } from '../../../common/utils/common.util';

export class DeleteMeetingDTO {
  @Expose()
  @IsString()
  @IsNotEmpty()
  @Matches(MEETING_REGEX)
  MeetingId: string;
}
