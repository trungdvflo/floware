import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
    IsDefined,
    IsIn, IsInt, IsNotEmpty,
    IsNumber, IsString,
    IsUUID
} from 'class-validator';

export class SubTaksParam {
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @ApiProperty({ example: '0ee41c62-a40e-11eb-b9ad-8703793be382' })
  @IsUUID()
  @Expose()
  public id: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'Sub task 1', description: 'Title of subtashs' })
  @Expose()
  public title: string;

  @IsNotEmpty()
  @IsDefined()
  @IsInt()
  @IsIn([0,1])
  @ApiProperty({  example: 0, description: 'Trigger object of this collection' })
  @Expose()
  public status: number;

  @IsNotEmpty()
  @IsDefined()
  @IsNumber()
  @ApiProperty({  example: 0, description: 'Trigger object of this collection' })
  @Expose()
  public created_date: number;

  @IsNotEmpty()
  @IsDefined()
  @IsNumber()
  @ApiProperty({  example: 0, description: 'Trigger object of this collection' })
  @Expose()
  public updated_date: number;
}
