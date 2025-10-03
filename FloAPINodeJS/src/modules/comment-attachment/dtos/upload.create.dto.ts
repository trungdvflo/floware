import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';
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
    description: "id of comment"
  })
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => Number(value))
  comment_id: number;

  @IsOptionalCustom()
  @ApiProperty({ required: false})
  @Expose()
  ref: string | number;
}
