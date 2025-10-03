import { ApiProperty } from '@nestjs/swagger';
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
import { OBJ_TYPE } from '../../../common/constants/common';
import { CheckObjectId, IsOptionalCustom, IsType } from '../../../common/decorators';
import { EmailDTO } from '../../../common/dtos/email.dto';
import {
  Email365ObjectId, EmailObjectId,
  GeneralObjectId,
  GmailObjectId
} from '../../../common/dtos/object-uid';
import { OBJECT_UID_TRANSFORMER } from '../../../common/transformers/object-uid.transformer';

export class CreateMetadataEmailDTO {
  @IsInt()
  @IsOptionalCustom()
  @ApiProperty({ required: false, example: 0 })
  @Expose()
  account_id: number;

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

  @IsString()
  @IsOptionalCustom()
  @ApiProperty({ required: false, example: 'Sample subject' })
  @Expose()
  subject: string;

  @IsArray()
  @ApiProperty({ type: EmailDTO, isArray: true, example: [{ email: 'tester01@gmail.com' }, { email: 'tester02@gmail.com' }] })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => EmailDTO)
  @Expose()
  from: EmailDTO[];

  @IsArray()
  @ApiProperty({ type: EmailDTO, isArray: true, example: [{ email: 'tester03@gmail.com' }, { email: 'tester04@gmail.com' }] })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => EmailDTO)
  @Expose()
  to: EmailDTO[];

  @IsString()
  @ApiProperty({ example: 'Sample snippet' })
  @Expose()
  snippet: string;

  @IsOptionalCustom()
  @IsArray()
  @ApiProperty({ type: EmailDTO, isArray: true, required: false, example: [{ email: 'tester05@gmail.com' }, { email: 'tester06@gmail.com' }] })
  @ValidateNested({ each: true })
  @Type(() => EmailDTO)
  @Expose()
  cc: EmailDTO[];

  @IsOptionalCustom()
  @IsArray()
  @ApiProperty({ type: EmailDTO, isArray: true, required: false, example: [{ email: 'tester07@gmail.com' }, { email: 'tester08@gmail.com' }] })
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
  @ApiProperty({ required: false, example: 'aaa' })
  @Expose()
  message_id: string;

  @IsOptionalCustom()
  @ApiProperty({ required: false, example: '6D63D672D2C-3700A1BD-EB0E-4B8E-84F9' })
  @IsType(['string', 'number'])
  @Expose()
  ref?: string | number;

  constructor(partial?: Partial<CreateMetadataEmailDTO>) {
    Object.assign(this, partial);
  }
}

export class CreateMetadataEmailDTOs {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [CreateMetadataEmailDTO]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: CreateMetadataEmailDTO[];

  errors: any[];
}