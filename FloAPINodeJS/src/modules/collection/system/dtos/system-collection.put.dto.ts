import { ApiProperty } from '@nestjs/swagger';
import { Json } from 'aws-sdk/clients/robomaker';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEnum,
  IsNotEmpty, IsNumber, IsString, ValidateNested
} from 'class-validator';
import {
  ENABLE_SYSTEM_COLLECTION,
  SYSTEM_COLLECTION
} from '../../../../common/constants';
import { IsOptionalCustom } from '../../../../common/decorators';
import {
  CalendarSystemCollectionDTO,
  ContactSystemCollectionDTO,
  EmailSystemCollectionDTO,
  FileSystemCollectionDTO,
  NoteSystemCollectionDTO,
  OrganizerSystemCollectionDTO,
  TodoSystemCollectionDTO,
  WebsitetSystemCollectionDTO
} from '../../../../common/dtos/sub-filter-system-collection.dto';
import { requestBodyUpdateSystemCollecion, RequestParam } from '../../../../common/swaggers/system-collection.swagger';

export class UpdateSystemCollectionDTO {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;

  @IsNumber()
  @IsEnum(SYSTEM_COLLECTION)
  @ApiProperty(RequestParam.type)
  @Expose()
  type: number;

  checksum?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.update_name)
  @Expose()
  name: string;

  @IsOptionalCustom()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Transform(({ obj }) => {
    if (obj.local_filter) {
      if(obj.type === 1) {
        return new EmailSystemCollectionDTO(obj.local_filter);
      } else if (obj.type === 2) {
        return new CalendarSystemCollectionDTO(obj.local_filter);
      } else if (obj.type === 3) {
        return new TodoSystemCollectionDTO(obj.local_filter);
      } else if (obj.type === 4) {
        return new ContactSystemCollectionDTO(obj.local_filter);
      } else if (obj.type === 5) {
        return new NoteSystemCollectionDTO(obj.local_filter);
      } else if (obj.type === 6) {
        return new WebsitetSystemCollectionDTO(obj.local_filter);
      } else if (obj.type === 7) {
        return new FileSystemCollectionDTO(obj.local_filter);
      } else {
        return new OrganizerSystemCollectionDTO(obj.local_filter);
      }
    }
  })
  @Expose()
  local_filter: Json;

  @IsOptionalCustom()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Transform(({ obj }) => {
    if (obj.sub_filter) {
      if(obj.type === 1) {
        return new EmailSystemCollectionDTO(obj.sub_filter);
      } else if (obj.type === 2) {
        return new CalendarSystemCollectionDTO(obj.sub_filter);
      } else if (obj.type === 3) {
        return new TodoSystemCollectionDTO(obj.sub_filter);
      } else if (obj.type === 4) {
        return new ContactSystemCollectionDTO(obj.sub_filter);
      } else if (obj.type === 5) {
        return new NoteSystemCollectionDTO(obj.sub_filter);
      } else if (obj.type === 6) {
        return new WebsitetSystemCollectionDTO(obj.sub_filter);
      } else if (obj.type === 7) {
        return new FileSystemCollectionDTO(obj.sub_filter);
      } else {
        return new OrganizerSystemCollectionDTO(obj.sub_filter);
      }
    }
  })
  @Expose()
  sub_filter: Json;

  @IsOptionalCustom()
  @IsNumber()
  @IsEnum(ENABLE_SYSTEM_COLLECTION)
  @ApiProperty(RequestParam.enable_mini_month)
  @Expose()
  readonly enable_mini_month: number;

  @IsOptionalCustom()
  @IsNumber()
  @IsEnum(ENABLE_SYSTEM_COLLECTION)
  @ApiProperty(RequestParam.enable_quick_view)
  @Expose()
  enable_quick_view: number;

  @IsOptionalCustom()
  @IsNumber()
  @IsEnum(ENABLE_SYSTEM_COLLECTION)
  @ApiProperty(RequestParam.show_mini_month)
  @Expose()
  show_mini_month: number;
}

export class UpdateSystemCollectionSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: UpdateSystemCollectionDTO,
    example: [requestBodyUpdateSystemCollecion]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: UpdateSystemCollectionDTO[];
  errors: UpdateSystemCollectionDTO[];
}