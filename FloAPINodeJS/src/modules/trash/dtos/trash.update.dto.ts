import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum, IsInt, IsNotEmpty,
  IsNumber, IsString, ValidateNested
} from 'class-validator';
import { TRASH_TYPE } from '../../../common/constants/common';
import { IsOptionalCustom, IsTrashObjectUid } from '../../../common/decorators';
import { EmailObjectId, GeneralObjectId } from '../../../common/dtos/object-uid';
import { OBJECT_UID_TRASH_TRANSFORMER } from '../../../common/transformers/object-uid.transformer';

export class TrashUpdateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiPropertyOptional({
    example: 3313
  })
  @IsOptionalCustom()
  @IsInt()
  @Expose()
  object_id: number;

  @ApiPropertyOptional({
    example: "4bab9469-f06c-4508-a857-b7b4df4df42f"
  })
  @IsOptionalCustom()
  // @IsUUID()
  @IsTrashObjectUid()
  @Expose()
  @Transform(OBJECT_UID_TRASH_TRANSFORMER)
  object_uid: EmailObjectId | GeneralObjectId;

  @IsNotEmpty()
  @ApiProperty({
    example: "VTODO"
  })
  @IsString()
  @IsEnum(TRASH_TYPE)
  @Expose()
  object_type: TRASH_TYPE;

  @ApiPropertyOptional({
    example: "/calendarserver.php/calendars/tamvo@flodev.net/102df010-084d-0138-92d8-0242ac130003"
  })
  @IsString()
  @IsOptionalCustom()
  @Expose()
  object_href: string;

  // @IsNumber()
  // @IsOptionalCustom()
  // @ApiPropertyOptional()
  // sync_token: number;

  // @ApiPropertyOptional()
  // @IsEnum(TRASH_STATUS)
  // @IsOptionalCustom()
  // status: TRASH_STATUS;

  @IsNumber()
  @IsOptionalCustom()
  @ApiPropertyOptional()
  @Expose()
  trash_time: number;

}

export class TrashUpdateDtos {
  @ApiProperty({
    type: [TrashUpdateDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  // @Type(() => TrashUpdateDto)
  data: TrashUpdateDto[];

  errors: any[];
}