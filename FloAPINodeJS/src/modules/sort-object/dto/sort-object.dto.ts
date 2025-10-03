import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsNumberString, IsPositive, IsString, Max, Min } from 'class-validator';

export class SortObjectBaseDto {
  @ApiProperty({ example: '12.00000', required: true })
  @IsNumberString()
  @IsNotEmpty()
  @Expose()
  order_number: string;

  @ApiProperty({ example: 1566464330.816, required: true })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  order_update_time: number;
}

export class SortObjectTodoDto extends SortObjectBaseDto {
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

/**
 * Clone from SortObjectBaseDto
 * Purpose: Avoid impacting the kanband, kanban card, url, todo API
 * TODO: if everything is ok, rename CloudSortObjectBaseDto to SortObjectBaseDto
 */
export class CustomSortObjectBaseDto {
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
}

export class CustomSortObjectDto extends CustomSortObjectBaseDto {
  @ApiProperty({ example: 1, required: true })
  @IsInt()
  @Expose()
  @IsPositive()
  id: number;
}

export class SortObjectDto extends SortObjectBaseDto {
  @ApiProperty({ example: 1, required: true })
  @IsInt()
  @Expose()
  @IsPositive()
  id: number;
}
