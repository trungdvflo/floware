import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber, IsPositive,
  IsString,
  ValidateNested
} from 'class-validator';
import { OBJ_TYPE, TRACKING_STATUS } from '../../../common/constants/common';
import { CheckObjectId, IsOptionalCustom, IsTrackingRepliedTime } from '../../../common/decorators';
import { EmailDTO } from '../../../common/dtos/email.dto';
import {
  Email365ObjectId, EmailObjectId, GeneralObjectId,
  GmailObjectId
} from '../../../common/dtos/object-uid';
import { OBJECT_UID_TRANSFORMER } from '../../../common/transformers/object-uid.transformer';
export class UpdateTrackingDTO {
  @IsInt()
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @IsInt()
  @IsOptionalCustom()
  @ApiProperty({ example: 0 })
  @Expose()
  account_id: number;

  @IsString()
  @IsOptionalCustom()
  @ApiPropertyOptional({ example: "123" })
  @Expose()
  message_id: string;

  @IsOptionalCustom()
  @IsString()
  @IsIn([OBJ_TYPE.EMAIL, OBJ_TYPE.GMAIL, OBJ_TYPE.EMAIL365])
  @ApiProperty({ required: false, example: 'EMAIL' })
  @Expose()
  public object_type: OBJ_TYPE.EMAIL | OBJ_TYPE.GMAIL | OBJ_TYPE.EMAIL365;

  @IsOptionalCustom()
  @ApiProperty({ required: false, example: { "uid": 123, "path": "INBOX" } })
  @CheckObjectId('object_type')
  @Transform((opts)=> OBJECT_UID_TRANSFORMER(opts, true))
  @Expose()
  public object_uid: Email365ObjectId | EmailObjectId | GmailObjectId | GeneralObjectId;

  @IsOptionalCustom()
  @IsArray()
  @ApiProperty({ type: EmailDTO, isArray: true, required: false, example: [{ email: 'tester01@gmail.com' }, { email: 'tester02@gmail.com' }] })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => EmailDTO)
  @Expose()
  emails: EmailDTO[];

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiProperty({ required: false, example: 1713432931.272 })
  @Expose()
  time_send: number;

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiProperty({ required: false, example: 1713432931.272 })
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
  @ApiProperty({ required: false, example: 1713432931.272 })
  @Expose()
  replied_time: number;

  constructor(partial?: Partial<UpdateTrackingDTO>) {
    Object.assign(this, partial);
  }
}

export class UpdateTrackingDTOs {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [UpdateTrackingDTO]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: UpdateTrackingDTO[];

  errors: any[];
}