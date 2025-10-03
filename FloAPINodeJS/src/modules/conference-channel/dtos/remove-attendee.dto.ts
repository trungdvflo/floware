import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsString, Matches, ValidateNested } from 'class-validator';
import * as Re2 from "re2";
import { MEETING_REGEX } from './call-phone.dto.post';

export const ATTENDEE_REGEX = new Re2(/[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}/);

export class RemoveAttendeeDTO {
  @Expose()
  @IsString()
  @IsNotEmpty()
  @Matches(MEETING_REGEX)
  meeting_id: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @Matches(ATTENDEE_REGEX)
  attendee_id: string;
}

export class RemoveAttendeeDTOs {
  @ApiProperty({
    type: [RemoveAttendeeDTO]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: RemoveAttendeeDTO[];

  errors: any[];
}