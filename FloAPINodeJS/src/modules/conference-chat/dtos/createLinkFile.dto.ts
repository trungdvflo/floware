import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize,
  IsArray, IsIn, IsInt, IsNotEmpty, IsString, ValidateNested
} from 'class-validator';
import { CheckMessageType, IsOptionalCustom } from '../../../common/decorators';
export class LinkFileDTO {
  @IsString()
  @ApiPropertyOptional({ example: "328392dsjdskdj032dskjdsj" })
  @Expose()
  message_uid: string;

  @IsString()
  @ApiPropertyOptional({ example: "hello" })
  @Expose()
  message_text: string;

  @IsInt()
  @IsIn([0,1])
  @CheckMessageType()
  @Expose()
  @ApiPropertyOptional({
      example: 1
  })
  message_type: number;

  @IsInt()
  @IsOptionalCustom()
  @Expose()
  @ApiPropertyOptional({
      example: 1
  })
  file_common_id: number;

  @IsInt()
  @Expose()
  @ApiPropertyOptional({
      example: 1
  })
  channel_id: number;

  @IsOptionalCustom()
  @ApiProperty({ required: false})
  @Expose()
  ref?: string | number;
}

export class LinkFileDTOs {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: LinkFileDTO[];
  errors: LinkFileDTO[];
}