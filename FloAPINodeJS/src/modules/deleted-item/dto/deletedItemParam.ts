import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import {
  IsDefined, IsInt, IsNotEmpty, IsNumber, IsPositive, IsString,
} from 'class-validator';
import { DELETED_ITEM_TYPE } from '../../../common/constants/common';

export class DeleteItemParam {
  @IsNotEmpty()
  @IsDefined()
  @IsInt()
  @IsPositive()
  @ApiProperty()
  public item_id?: number;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @ApiProperty()
  public item_uid?: string;

  @IsNotEmpty()
  @IsDefined()
  @ApiProperty()
  @IsString()
  public item_type: DELETED_ITEM_TYPE;

  @IsNotEmpty()
  @IsDefined()
  @ApiProperty()
  @IsInt()
  public is_recovery?: number;

  @IsNumber()
  public created_date?: number;

  @IsNumber()
  public updated_date?: number;
}

export class DeleteItemResponse {
  @ApiResponseProperty({ example: 1 })
  id: number;

  @ApiResponseProperty({ example: 1024 })
  item_id: number;

  @ApiResponseProperty({ example: '0317f2ad-663b-48e5-a7d2-9d4dba074419@flodev.net' })
  item_uid: string;

  @ApiResponseProperty({ example: 1 })
  is_recovery: number;

  @ApiResponseProperty({ example: 1618297281.265 })
  created_date: number;

  @ApiResponseProperty({ example: 1618297281.333 })
  updated_date: number;
}
