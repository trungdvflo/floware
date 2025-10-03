import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  isEnum,
  IsIn, IsInt, IsNotEmpty, IsNumber,
  isObject, IsPositive, isString, IsString,
  Min,
  ValidateNested
} from 'class-validator';
import { DAV_OBJ_TYPE, OBJ_TYPE } from '../../../common/constants/common';
import { CheckObjectHref, CheckObjectId, IsOptionalCustom, IsType } from '../../../common/decorators';
import { IsTrashDto } from '../../../common/dtos/isTrash.dto';
import {
  Email365ObjectId, EmailObjectId, GeneralObjectId, GENERAL_OBJ, GmailObjectId
} from '../../../common/dtos/object-uid';
import { requestBody } from '../../../common/swaggers/call-history.swagger';

const objTypeArray = ['VTODO', 'VEVENT', 'VJOURNAL', 'VCARD', 'URL', 'CSFILE', 'EMAIL', 'GMAIL', 'EMAIL365'];
export class KanbanCardParam extends IsTrashDto {
  @IsNotEmpty()
  @IsDefined()
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 10 })
  @Expose()
  public kanban_id: number;

  @IsNumber()
  @ApiProperty({ example: 1619165718.503 })
  @IsOptionalCustom()
  @Expose()
  public recent_date: number;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @IsIn(objTypeArray)
  @ApiProperty({ example: 'VTODO' })
  @Expose()
  public object_type: OBJ_TYPE.GMAIL | OBJ_TYPE.EMAIL | OBJ_TYPE.EMAIL365 | GENERAL_OBJ;

  @IsNotEmpty()
  @IsDefined()
  @ApiProperty({ example: '6d7d4b50-9da3-11eb-94bf-9903dbcef4a2' })
  @CheckObjectId('object_type')
  @Transform(({ value, key, obj, type }) => {
    if (obj.object_type === OBJ_TYPE.EMAIL) {
      if (!isObject(value)) return value;
      return new EmailObjectId({ ...value });
    } else if (obj.object_type === OBJ_TYPE.GMAIL) {
      if (!value || !isString(value)) return value;
      return new GmailObjectId({ gmailId: value });
    } else if (obj.object_type === OBJ_TYPE.EMAIL365) {
      if (!value || !isString(value)) return value;
      return new Email365ObjectId({ id: value });
    } else {
      if (!value || !isString(value)) return value;
      return new GeneralObjectId({ uid: value }, obj.object_type);
    }
  })
  @Expose()
  public object_uid: Email365ObjectId | EmailObjectId | GeneralObjectId | GmailObjectId;

  @ApiPropertyOptional({ example: '/calendarserver.php/calendars/nghiale@flodev.net/f23de3b0-ecce-0137-541d-0242ac130004/6d7d4b50-9da3-11eb-94bf-9903dbcef4a2.ics' })
  @CheckObjectHref('object_type')
  @Transform(({ value, key, obj, type }) => {
    if (isEnum(obj.object_type, DAV_OBJ_TYPE)) {
      return isString(value) ? value.trim() : value;
    }
  })
  @Expose()
  public object_href?: string;

  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ example: 1, default: 0 })
  @Expose()
  public account_id?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({ example: '1234' })
  @Expose()
  @IsType(['string', 'number'])
  public ref?: string | number;
}

export class CreatekanbanCardSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: KanbanCardParam,
    example: [requestBody]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: KanbanCardParam[];
  errors: KanbanCardParam[];
}

export class KanbanCardParamWithOrderNumber extends KanbanCardParam {
  @Expose()
  public order_number: number;
}

export class DeleteKanbanCardParam {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @ApiProperty({ example: 100 })
  @Expose()
  public id: number;
}
