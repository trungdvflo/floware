import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber, IsString,
  ValidateNested
} from 'class-validator';
import { TRASH_TYPE } from '../../../common/constants/common';
import { CheckObjectHref, IsOptionalCustom, IsTrashObjectId, IsTrashObjectUid } from '../../../common/decorators';
import { EmailObjectId, GeneralObjectId } from '../../../common/dtos/object-uid';
import {
  OBJECT_UID_OLD_TRASH_TRANSFORMER,
  OBJECT_UID_TRASH_TRANSFORMER
} from '../../../common/transformers/object-uid.transformer';
import { TRIM_STRING_TRANSFORMER } from '../../../common/transformers/trim-string.transformer';

export class TrashCreateDto {
  @ApiPropertyOptional({
    example: 3313
  })
  @IsTrashObjectId()
  @Expose()
  object_id: number;

  @ApiPropertyOptional({
    example: "4bab9469-f06c-4508-a857-b7b4df4df42f"
  })
  @IsTrashObjectUid()
  @Expose()
  @Transform(OBJECT_UID_TRASH_TRANSFORMER)
  object_uid: EmailObjectId | GeneralObjectId;

  @ApiPropertyOptional({
    description: "Old object_uid: {uid:123, path:'INBOX'}, it is used for worker update link",
    example: {
      uid: 123456,
      path: 'INBOX'
    }
  })
  @IsOptionalCustom()
  @IsTrashObjectUid()
  @Expose()
  @Transform(OBJECT_UID_OLD_TRASH_TRANSFORMER)
  old_object_uid: EmailObjectId;

  @IsNotEmpty()
  @ApiProperty({
    example: "VTODO"
  })
  @IsString()
  @Expose()
  @IsEnum(TRASH_TYPE)
  object_type: TRASH_TYPE;

  @ApiPropertyOptional({
    example: "/calendarserver.php/calendars/tamvo@flodev.net/102df010-084d-0138-92d8-0242ac130003"
  })
  @Transform(TRIM_STRING_TRANSFORMER)
  @CheckObjectHref('object_type')
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
  @ApiPropertyOptional({
    description: 'Time object move to trash'
  })
  @Expose()
  trash_time: number;

  @ApiPropertyOptional({
    example: "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C"
  })
  @IsString()
  @IsOptionalCustom()
  @Expose()
  ref: string;
}

export class TrashCreateDtos {
  @ApiProperty({
    type: [TrashCreateDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  // @Type(() => TrashCreateDto)
  data: TrashCreateDto[];

  errors: any[];
}