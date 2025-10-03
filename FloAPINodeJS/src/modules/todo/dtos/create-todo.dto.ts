import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject, IsPositive,
  IsString, Max, Min,
  ValidateNested
} from 'class-validator';
import { MAX_DATE_INTEGER } from "../../../common/constants";
import { IsOptionalCustom, IsType } from '../../../common/decorators';
import { AlertParam } from '../../../common/dtos/alertParam';
import { OrganizerParam } from '../../../common/dtos/organizer-todo.dto';
import { requestBody, RequestParam } from "../../../common/swaggers/todo.swagger";
import { SubTaksParam } from './subtask-todo.dto';
// No need to check dup annotation here
// NOSONAR
export class CreateTodoDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '3b0ea370-a40c-11eb-9b52-cfb7a3ad9eee' })
  @Expose()
  calendar_uri: string;

  @IsInt()
  @Min(0)
  @Max(MAX_DATE_INTEGER)
  @IsOptionalCustom()
  @ApiProperty(RequestParam.star)
  @Expose()
  star: number;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.description)
  @Expose()
  description: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.summary)
  @Expose()
  summary: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.location)
  @Expose()
  location: string;

  @IsInt()
  @IsOptionalCustom()
  @Min(0)
  @Max(MAX_DATE_INTEGER)
  @IsPositive()
  @ApiProperty(RequestParam.completed_date)
  @Expose()
  completed_date: number;

  @IsInt()
  @IsOptionalCustom()
  @Min(0)
  @Max(MAX_DATE_INTEGER)
  @IsPositive()
  @ApiProperty(RequestParam.due_date)
  @Expose()
  due_date: number;

  @IsInt()
  @IsPositive()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.duration)
  @Expose()
  duration: number;

  @IsOptionalCustom()
  @IsArray()
  @ApiProperty(RequestParam.subtasks)
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => SubTaksParam)
  @Expose()
  public subtasks: SubTaksParam[];

  @IsOptionalCustom()
  @IsArray()
  @ApiProperty(RequestParam.alerts)
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => AlertParam)
  @Expose()
  public alerts: AlertParam[];

  @IsInt()
  @IsIn([0, 1])
  @ApiProperty(RequestParam.stodo)
  @Expose()
  stodo: number;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.status)
  @Expose()
  status: string;

  @IsOptionalCustom()
  @IsObject()
  @ApiProperty(RequestParam.organizer)
  @ValidateNested()
  @Type(() => OrganizerParam)
  @Expose()
  public organizer: OrganizerParam;

  @IsInt()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.sequence)
  @Expose()
  sequence: number;

  @IsInt()
  @IsOptionalCustom()
  @Min(0)
  @Max(MAX_DATE_INTEGER)
  @ApiProperty(RequestParam.start)
  @Expose()
  start: number;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.repeat_rule)
  @Expose()
  repeat_rule: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.timezone)
  @Expose()
  timezone: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.tzcity)
  @Expose()
  tzcity: string;

  // @IsInt()
  // @IsPositive()
  // @IsOptionalCustom()
  // @Min(0)
  // @Max(MAX_DATE_INTEGER)
  // @ApiProperty({ example: 1617932931 , default: null})
  // @Expose()
  // recurid: number | null;

  @IsArray()
  @IsInt({each: true})
  @IsPositive({each: true})
  @Min(0, {each: true})
  @Max(MAX_DATE_INTEGER, {each: true})
  @IsOptionalCustom()
  @ApiProperty({ example: [1605435302, 1605348902, 1605521702], default: null })
  @Expose()
  exdates: number[] | null;

  @IsInt()
  @IsIn([0, 1])
  @IsOptionalCustom()
  @ApiProperty(RequestParam.is_trashed)
  @Expose()
  is_trashed: number;

  @IsOptionalCustom()
  @ApiProperty(RequestParam.ref)
  @IsType(['string', 'number'])
  @Expose()
  ref?: string | number;
}

export class CreateTodoSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: CreateTodoDTO,
    example: [requestBody]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: CreateTodoDTO[];
  errors: CreateTodoDTO[];
}