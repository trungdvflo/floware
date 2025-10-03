import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsDefined, IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested
} from 'class-validator';
import { OBJECT_SHARE_ABLE } from '../../../common/constants/common';
import { CheckObjectHref, IsTrashObjectId, IsTrashObjectUid } from '../../../common/decorators';
import { GeneralObjectId } from '../../../common/dtos/object-uid';
import {
  OBJECT_UID_TRASH_TRANSFORMER
} from '../../../common/transformers/object-uid.transformer';
import { TRIM_STRING_TRANSFORMER } from '../../../common/transformers/trim-string.transformer';

export class TrashMemberCreateDto {
  @ApiPropertyOptional({
    example: 3313
  })
  @IsTrashObjectId()
  @Expose()
  object_id: number;
  @ApiPropertyOptional({
    example: 3313
  })
  @ApiPropertyOptional({
    example: "4bab9469-f06c-4508-a857-b7b4df4df42f"
  })
  @IsTrashObjectUid()
  @Expose()
  @Transform(OBJECT_UID_TRASH_TRANSFORMER)
  object_uid: GeneralObjectId;

  @IsNotEmpty()
  @ApiProperty({
    example: "VTODO"
  })
  @IsString()
  @Expose()
  @IsEnum(OBJECT_SHARE_ABLE)
  object_type: OBJECT_SHARE_ABLE;

  @ApiPropertyOptional({
    example: "/calendarserver.php/calendars/tamvo@flodev.net/102df010-084d-0138-92d8-0242ac130003"
  })
  @Transform(TRIM_STRING_TRANSFORMER)
  @CheckObjectHref('object_type')
  @Expose()
  object_href: string;

  @IsNumber()
  @IsOptional()
  @IsDefined()
  @IsPositive()
  @ApiPropertyOptional({
    description: 'Time object move to trash'
  })
  @Expose()
  trash_time: number;

  @ApiPropertyOptional({
    example: "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C"
  })
  @IsString()
  @IsOptional()
  @Expose()
  ref: string;
}

export class TrashCreateDtos {
  @ApiProperty({
    type: [TrashMemberCreateDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  // @Type(() => TrashCreateDto)
  data: TrashMemberCreateDto[];

  errors: any[];
}