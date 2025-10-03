import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  isObject, ValidateNested
} from 'class-validator';
import { IsOptionalCustom, IsTrashObjectUid } from '../../../common/decorators';
import { EmailObjectId } from '../../../common/dtos/object-uid';

export class TrashRecoverDto {
  @ApiProperty({
    example: 3313
  })
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiPropertyOptional({
    description: "New object_uid: {uid:123, path:'INBOX'}, it is used for worker update link",
    example: {
      uid: 123456,
      path: 'INBOX'
    }
  })
  @IsOptionalCustom()
  @IsTrashObjectUid()
  @Expose()
  @Transform(({ value, key, obj, type }) => {
    if(value) {
      if(!isObject(value)) return value;
      return new EmailObjectId({ ...value });
    }
  })
  new_object_uid: EmailObjectId;
}

export class TrashRecoverDtos {
  @ApiProperty({
    type: [TrashRecoverDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  // @Type(() => TrashRecoverDto)
  data: TrashRecoverDto[];

  errors: any[];
}