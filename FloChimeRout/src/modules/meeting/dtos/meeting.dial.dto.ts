import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { MEETING_REGEX, PHONE_REGEX } from 'common/utils/common.util';

export class MeetingDialDTO {
  @Expose()
  @IsString()
  @IsNotEmpty()
  @Matches(MEETING_REGEX)
  MeetingId: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_REGEX)
  PhoneNumber: string;
}