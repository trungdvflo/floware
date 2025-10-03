import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt,
  IsNotEmpty,
  IsString, ValidateNested
} from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';
import { IChatMetadata } from '../../../modules/communication/interfaces';
export class UpdateConferenceChatDTO {
  @IsString()
  @ApiPropertyOptional({ example: "hello" })
  @Expose()
  message_text: string;

  @IsInt()
  @Expose()
  @ApiPropertyOptional({
    example: 1
  })
  id: number;
}

export class UpdateConferenceChatDTOs {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [UpdateConferenceChatDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: UpdateConferenceChatDTO[];
  errors: any[];
}

export class EditMessageIntDTO {
  @Expose()
  @IsInt()
  internal_channel_id: number;

  @Expose()
  @IsInt()
  @IsIn([0, 1])
  internal_channel_type: number;

  @Expose()
  @IsString()
  internal_message_uid: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  msg: string;

  @Expose()
  @IsOptionalCustom()
  metadata?: IChatMetadata;
}
export class EditMessageIntDTOs {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: EditMessageIntDTO[];
  errors: EditMessageIntDTO[];
}