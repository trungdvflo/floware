import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber, IsPositive,
  IsString,
  ValidateNested
} from 'class-validator';
import { OBJ_TYPE, TRACKING_STATUS } from '../../../common/constants/common';
import { CheckObjectId, IsOptionalCustom, IsTrackingRepliedTime, IsType } from '../../../common/decorators';
import { EmailDTO } from '../../../common/dtos/email.dto';
import {
  Email365ObjectId, EmailObjectId, GeneralObjectId,
  GmailObjectId
} from '../../../common/dtos/object-uid';
import { OBJECT_UID_TRANSFORMER } from '../../../common/transformers/object-uid.transformer';

export class CreateTrackingDTO {
  @IsInt()
  @Transform(({ value }) => { return value ? value : 0; })
  @ApiProperty({ example: 0 })
  @Expose()
  account_id: number;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({ example: "123" })
  @Expose()
  message_id: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @IsIn([OBJ_TYPE.EMAIL, OBJ_TYPE.GMAIL, OBJ_TYPE.EMAIL365])
  @ApiProperty({ example: 'EMAIL' })
  @Expose()
  public object_type: OBJ_TYPE.EMAIL | OBJ_TYPE.GMAIL | OBJ_TYPE.EMAIL365;

  @IsNotEmpty()
  @IsDefined()
  @ApiProperty({ example: { "uid": 123, "path": "INBOX" } })
  @CheckObjectId('object_type')
  @Transform(OBJECT_UID_TRANSFORMER)
  @Expose()
  public object_uid: Email365ObjectId | EmailObjectId | GmailObjectId | GeneralObjectId;

  @IsArray()
  @ApiProperty({ type: EmailDTO, isArray: true, example: [{ email: 'tester01@gmail.com' }, { email: 'tester02@gmail.com' }] })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => EmailDTO)
  @Expose()
  emails: EmailDTO[];

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiProperty({ required: false, example: 1617932931.247 })
  @Expose()
  time_send: number;

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiProperty({ required: false, example: 1617932931.247 })
  @Expose()
  time_tracking: number;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty({ required: false, example: 'Sample Subject' })
  @Expose()
  subject: string;

  @IsInt()
  @IsOptionalCustom()
  @IsIn([TRACKING_STATUS.WAITING, TRACKING_STATUS.REPLIED, TRACKING_STATUS.LATE])
  @ApiProperty({ required: false, example: 1 })
  @Expose()
  status: number;

  @IsTrackingRepliedTime()
  @ApiProperty({ required: false, example: 1617932931.247 })
  @Expose()
  replied_time: number;

  @IsOptionalCustom()
  @ApiProperty({ required: false, example: '6D63D672D2C-3700A1BD-EB0E-4B8E-84F9' })
  @IsType(['string', 'number'])
  @Expose()
  ref?: string | number;

  constructor(partial?: Partial<CreateTrackingDTO>) {
    Object.assign(this, partial);
  }
}

export class CreateTrackingDTOs {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [CreateTrackingDTO]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: CreateTrackingDTO[];

  errors: any[];
}