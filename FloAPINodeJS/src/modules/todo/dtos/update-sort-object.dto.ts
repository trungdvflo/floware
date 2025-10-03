import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray,
  IsInt,
  IsNotEmpty, IsNumber, IsString, Max, Min, ValidateNested
} from 'class-validator';
import { SortObjectDto } from '../../sort-object/dto/sort-object.dto';
export class UpdateSortObjectTodoDto {
  @ApiProperty({ example: '12.00000', required: true })
  @IsNumber({ maxDecimalPlaces: 10 })
  @Max(999999.0000000000)
  @Min(-999999.0000000000)
  @IsNotEmpty()
  @Expose()
  order_number: number;

  @ApiProperty({ example: 1566464330.816, required: true })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  order_update_time: number;

  @ApiProperty({ example: '123-a', required: true })
  @IsString()
  @IsNotEmpty()
  @Expose()
  uid: string;

  @ApiProperty({ example: 0, required: true })
  @IsInt()
  @Expose()
  account_id: number;

  @ApiProperty({ example: '/calendarserver.php/calendars/auto.api_user3@flouat.net/d213dd00-dc9f-11eb-8f7c-99c3a377cf97', required: true })
  @IsString()
  @Expose()
  object_href: string;
}

export class SortObjectTodoSwagger {
  @ApiProperty({ type: [UpdateSortObjectTodoDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayMinSize(1)
  @IsNotEmpty()
  @Type(() => UpdateSortObjectTodoDto)
  @ValidateNested({ each: true })
  data: UpdateSortObjectTodoDto[];
}

export class UpdateSortObjectNotTodoDto {
  @ApiProperty({ type: [SortObjectDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayMinSize(1)
  @IsNotEmpty()
  @Type(() => SortObjectDto)
  @ValidateNested({ each: true })
  data: SortObjectDto[];
}
