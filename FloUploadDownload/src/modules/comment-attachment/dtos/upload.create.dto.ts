import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';
import { SOURCE_TYPE_FILE_COMMON } from "../../../common/constants";
import { IsOptionalCustom } from '../../../common/decorators';
export class CreateFileDTO {
  @ApiProperty({
    type: 'file',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Binary file'
  })
  @Expose()
  file: any;

  @Expose()
  @ApiProperty({
    description: "Source type: COMMENT"
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(SOURCE_TYPE_FILE_COMMON)
  source_type: string;

  @Expose()
  @ApiProperty({
    description: "id of comment"
  })
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => Number(value))
  source_id: number;

  @IsOptionalCustom()
  @ApiProperty({ required: false})
  @Expose()
  ref: string | number;
}
