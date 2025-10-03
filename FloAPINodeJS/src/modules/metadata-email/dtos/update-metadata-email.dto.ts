import { ApiProperty } from '@nestjs/swagger';
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
import { OBJ_TYPE } from '../../../common/constants/common';
import { CheckObjectId, IsOptionalCustom } from '../../../common/decorators';
import { EmailDTO } from '../../../common/dtos/email.dto';
import {
  Email365ObjectId, EmailObjectId,
  GeneralObjectId,
  GmailObjectId
} from '../../../common/dtos/object-uid';
import { OBJECT_UID_TRANSFORMER } from '../../../common/transformers/object-uid.transformer';

export class UpdateMetadataEmailDTO {
  @IsInt()
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @IsInt()
  @IsOptionalCustom()
  @ApiProperty({ required: false, example: 1 })
  @Expose()
  account_id: number;

  @IsOptionalCustom()
  @IsString()
  @IsIn([OBJ_TYPE.EMAIL, OBJ_TYPE.GMAIL, OBJ_TYPE.EMAIL365])
  @ApiProperty({ required: false, example: 'EMAIL' })
  @Expose()
  public object_type: OBJ_TYPE.EMAIL | OBJ_TYPE.GMAIL | OBJ_TYPE.EMAIL365;

  @IsOptionalCustom()
  @ApiProperty({ required: false, example: { "uid": 123, "path": "INBOX" } })
  @CheckObjectId('object_type')
  @Transform(OBJECT_UID_TRANSFORMER)
  @Expose()
  public object_uid: Email365ObjectId | EmailObjectId | GmailObjectId | GeneralObjectId;

  @IsOptionalCustom()
  @IsArray()
  @ApiProperty({ type: EmailDTO, isArray: true, required: false })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => EmailDTO)
  @Expose()
  from: EmailDTO[];

  @IsOptionalCustom()
  @IsArray()
  @ApiProperty({ type: EmailDTO, isArray: true, required: false })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => EmailDTO)
  @Expose()
  to: EmailDTO[];

  @IsOptionalCustom()
  @IsArray()
  @ApiProperty({ type: EmailDTO, isArray: true, required: false })
  @ValidateNested({ each: true })
  @Type(() => EmailDTO)
  @Expose()
  cc: EmailDTO[];

  @IsOptionalCustom()
  @IsArray()
  @ApiProperty({ type: EmailDTO, isArray: true, required: false })
  @ValidateNested({ each: true })
  @Type(() => EmailDTO)
  @Expose()
  bcc: EmailDTO[];

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiProperty({ required: false, example: 1617932931.247 })
  @Expose()
  received_date: number;

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiProperty({ required: false, example: 1617932931.247 })
  @Expose()
  sent_date: number;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty({ required: false, example: 'Sample Subject' })
  @Expose()
  subject: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty({ required: false, example: 'Sample Snippet' })
  @Expose()
  snippet: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty({ required: false, example: 'aaa' })
  @Expose()
  message_id: string;

  constructor(partial?: Partial<UpdateMetadataEmailDTO>) {
    Object.assign(this, partial);
  }
}

export class UpdateMetadataEmailDTOs {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [UpdateMetadataEmailDTO]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: UpdateMetadataEmailDTO[];

  errors: any[];
}