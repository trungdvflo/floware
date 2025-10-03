import { ApiProperty, ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import {
  IsDefined,
  IsIn, IsInt, IsNotEmpty, IsNumber, IsPositive,
  IsString, Min
} from 'class-validator';
import { OBJ_TYPE } from '../../../../common/constants/common';
import { CheckObjectHref, CheckObjectId, IsOptionalCustom } from '../../../../common/decorators';
import { IsType } from '../../../../common/decorators/multiple-types-validation.decorator';
import { IsTrashDto } from '../../../../common/dtos/isTrash.dto';
import { LINK_OBJ_TYPE, LINK_OBJ_TYPE_ARRAY } from '../../../../common/dtos/object-uid';
import { TRIM_STRING_TRANSFORMER } from '../../../../common/transformers/trim-string.transformer';
import { FloObjectUid } from '../../../../common/types/object-uid';
import { LinkHelper } from '../../helper/link.helper';
export class LinkedCollectionObjectDto extends IsTrashDto {
  @IsInt()
  @IsOptionalCustom()
  id?: number;

  @IsInt()
  @IsPositive()
  @Expose()
  @ApiProperty({example: 1024})
  collection_id: number;

  @IsNotEmpty()
  @IsDefined()
  @Expose()
  @CheckObjectId('object_type')
  @Transform(({ value, key, obj, type }) => {
    return LinkHelper.transformObjectUid(value, obj, 'object_type');
  })
  @ApiProperty({example: 'abc2324'})
  object_uid: FloObjectUid;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @Expose()
  @Transform(TRIM_STRING_TRANSFORMER)
  @IsIn(LINK_OBJ_TYPE_ARRAY)
  @ApiProperty({example: OBJ_TYPE.VCARD})
  object_type: LINK_OBJ_TYPE;

  @ApiPropertyOptional({example: 123456.234})
  @IsNumber()
  @IsOptionalCustom()
  @Expose()
  email_time: number;

  @IsInt()
  @Min(0)
  @IsOptionalCustom()
  @Expose()
  @ApiPropertyOptional({example: 1024})
  account_id: number;

  @Expose()
  @Transform(TRIM_STRING_TRANSFORMER)
  @CheckObjectHref('object_type')
  @ApiPropertyOptional({example: '/calendarserver.php/calendars/tamvo@flodev.net/102df010-084d-0138-92d8-0242ac130003'})
  object_href: string;

  @IsOptionalCustom()
  @Expose()
  @ApiPropertyOptional({example: '6D63D672D2C-3700A1BD-EB0E-4B8E-84F7'})
  @IsType(['string' , 'number'])
  ref?: string | number;
}

export class LinkedCollectionObjectResponse {
  @ApiResponseProperty({ example: 1 })
  id: number;

  @Exclude()
  user_id: number;

  @ApiProperty({example: 1024})
  collection_id: number;

  @ApiResponseProperty({ example: 'df2d9d38-06aa-41d7-b5a7-d16965a7df1d' })
  object_uid: string | object;

  @ApiResponseProperty({ example: OBJ_TYPE.VTODO })
  object_type: LINK_OBJ_TYPE;

  @ApiResponseProperty({ example: 1024 })
  account_id: number;

  @ApiResponseProperty({ example: '/calendarserver.php/calendars/tamvo@flodev.net/102df010-084d-0138-92d8-0242ac130003' })
  object_href: string;

  @ApiResponseProperty({ example: 0 })
  is_trashed: number;

  @ApiResponseProperty({ example: 1618297281.265 })
  created_date: number;

  @ApiResponseProperty({ example: 1618297281.333 })
  updated_date: number;

  constructor(partial: Partial<LinkedCollectionObjectResponse>) {
    Object.assign(this, partial);
  }
}
