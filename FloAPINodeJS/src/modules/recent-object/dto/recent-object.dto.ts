import { ApiProperty, ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { OBJ_TYPE } from '../../../common/constants/common';
import { IsOptionalCustom } from '../../../common/decorators';
import { IsType } from '../../../common/decorators/multiple-types-validation.decorator';

export class RecentObjectDto {
  @IsInt()
  @Min(0)
  @IsOptionalCustom()
  @ApiPropertyOptional({ example: 1024 })
  @Expose()
  account_id: number;

  @ApiProperty({ example: 'df2d9d38-06aa-41d7-b5a7-d16965a7df1d@flodev.net' })
  @IsString()
  @IsNotEmpty()
  @Expose()
  object_uid: string;

  @ApiProperty({ example: OBJ_TYPE.VCARD })
  @IsIn([OBJ_TYPE.VCARD, OBJ_TYPE.VJOURNAL])
  @IsString()
  @IsNotEmpty()
  @Expose()
  object_type: OBJ_TYPE.VCARD | OBJ_TYPE.VJOURNAL;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '/calendarserver.php/calendars/tamvo@flodev.net/102df010-084d-0138-92d8-0242ac130003' })
  @Expose()
  object_href: string;

  @IsNumber()
  @IsOptionalCustom()
  @ApiProperty({ example: 1 })
  @Expose()
  recent_date: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({ example: '6D63D672D2C-3700A1BD-EB0E-4B8E-84F9' })
  @IsType(['string', 'number'])
  @Expose()
  ref?: string | number;
}

export class RecentObjectResponse {
  @ApiResponseProperty({ example: 1 })
  id: number;

  @ApiResponseProperty({ example: 1024 })
  account_id: number;

  @ApiResponseProperty({ example: 'df2d9d38-06aa-41d7-b5a7-d16965a7df1d@flodev.net' })
  object_uid: string;

  @ApiResponseProperty({ example: OBJ_TYPE.VCARD })
  object_type: OBJ_TYPE.VCARD | OBJ_TYPE.VJOURNAL;

  @ApiResponseProperty({ example: '/calendarserver.php/calendars/tamvo@flodev.net/102df010-084d-0138-92d8-0242ac130003' })
  object_href: string;

  @ApiResponseProperty({ example: 1618297281.265 })
  created_date: number;

  @ApiResponseProperty({ example: 1618297281.333 })
  updated_date: number;

  @ApiResponseProperty({ example: '6D63D672D2C-3700A1BD-EB0E-4B8E-84F9' })
  ref?: string | number;
}