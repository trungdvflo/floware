import { Expose } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ATTENDEE } from 'common/constants/system.constant';

export class CreateMeetingDTO {
  @Expose()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(64)
  Organizer: string;

  @Expose()
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  ExternalMeetingId: string;

  @Expose()
  @IsOptional()
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(ATTENDEE.limitUserMeeting)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(64, { each: true })
  Attendees: string[];

  @Expose()
  @IsOptional()
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(ATTENDEE.limitUserMeeting)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(64, { each: true })
  NonAttendees: string[];

  @IsOptional()
  @Expose()
  @IsNumber()
  ChannelId?: number;

  @IsOptional()
  @Expose()
  @IsString()
  ChannelTitle?: string;
}
