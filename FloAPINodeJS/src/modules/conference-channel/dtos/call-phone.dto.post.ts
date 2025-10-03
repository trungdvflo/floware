import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsString, Matches, ValidateNested } from 'class-validator';
import * as Re2 from "re2";

export const MEETING_REGEX = new Re2(/[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}/);
export const PHONE_REGEX = new Re2(/^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})\s*$/);

export class CallPhoneDTO {
  @Expose()
  @IsString()
  @IsNotEmpty()
  @Matches(MEETING_REGEX)
  meeting_id: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_REGEX)
  phone_number: string;
}

export class CallPhoneDTOs {
  @ApiProperty({
    type: [CallPhoneDTO]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  data: CallPhoneDTO[];

  errors: any[];
}