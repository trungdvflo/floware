import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray, IsDefined, IsInt,
  IsNotEmpty, IsNumber, IsPositive, IsString, Min, ValidateNested
} from 'class-validator';
import { IsCommentObjectUid, IsOptionalCustom } from '../../../common/decorators';
import { GeneralObjectId } from '../../../common/dtos/object-uid';
import { RequestParam } from '../../../common/swaggers/collection.swagger';
import { OBJECT_UID_TRANSFORMER } from '../../../common/transformers/object-uid.transformer';
import { TRIM_STRING_TRANSFORMER } from '../../../common/transformers/trim-string.transformer';

export class MoveCollectionActivityDTO {
  @IsInt()
  @IsPositive()
  @ApiProperty(RequestParam.id)
  @Expose()
  collection_activity_id: number;

  @IsInt()
  @Min(0)
  @Expose()
  @ApiProperty({example: 1024})
  collection_id: number;

  @ApiProperty({
    example: "4bab9469-f06c-4508-a857-b7b4df4df42f"
  })
  @IsCommentObjectUid()
  @Expose()
  @Transform(OBJECT_UID_TRANSFORMER)
  @IsDefined()
  object_uid: GeneralObjectId;

  @IsPositive()
  @Expose()
  @IsNumber()
  @IsOptionalCustom()
  @ApiPropertyOptional({
      description: "Notification time from client",
      example: 1670482750.042
  })
  action_time: number;

  @IsString()
  @Expose()
  @ApiProperty({
      description: "Content of notification submit by client",
      example: 'The object is created'
  })
  @IsNotEmpty()
  @IsOptionalCustom()
  @Transform(TRIM_STRING_TRANSFORMER)
  content: string;
}
export class MoveCollectionActivitySwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [MoveCollectionActivityDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: MoveCollectionActivityDTO[];
  errors: MoveCollectionActivityDTO[];
}