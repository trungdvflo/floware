import { Expose } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ATTENDEE } from 'common/constants/system.constant';

export class CreateAttendeeDTO {
  @Expose()
  @IsString()
  @IsNotEmpty()
  MeetingId: string;

  @Expose()
  @IsOptional()
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(ATTENDEE.limitUser)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(64, { each: true })
  Attendees: string[];

  @Expose()
  @IsOptional()
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(ATTENDEE.limitUser)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(64, { each: true })
  NonAttendees: string[];
}
