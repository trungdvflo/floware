import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum, IsNotEmpty, IsNumber, IsString, ValidateNested
} from 'class-validator';
import { PURCHASE_STATUS, PURCHASE_TYPE } from '../../../common/constants';
import { IsOptionalCustom } from '../../../common/decorators';
import { RequestParam } from '../../../common/swaggers/system-collection.swagger';

export class CreateSubcriptionDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty(RequestParam.name)
  @Expose()
  sub_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty(RequestParam.type)
  @Expose()
  transaction_id: string;

  @IsString()
  @ApiProperty(RequestParam.enable_mini_month)
  @Expose()
  receipt_data: string;

  @IsOptionalCustom()
  @IsString()
  @ApiProperty(RequestParam.enable_quick_view)
  @Expose()
  description: string;

  @IsNumber()
  @IsEnum(PURCHASE_TYPE)
  @ApiProperty(RequestParam.show_mini_month)
  @Expose()
  purchase_type: number;

  @IsNumber()
  @IsEnum(PURCHASE_STATUS)
  @ApiProperty(RequestParam.show_mini_month)
  @Expose()
  purchase_status: number;

  @IsOptionalCustom()
  @IsString()
  @ApiProperty({ required: false, example: '6D63D672D2C-3700A1BD-EB0E-4B8E-84F9' })
  @Expose()
  ref?: string;
}

export class CreateSubcriptionSwagger {
  @IsNotEmpty()
  @ApiProperty({
    type: CreateSubcriptionDTO
  })
  @ValidateNested()
  @Type(() => CreateSubcriptionDTO)
  @Expose()
  data: CreateSubcriptionDTO;
  errors: any[];
}