import { ApiProperty, ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsDefined,
  IsEnum, IsInt, IsNotEmpty, IsNumber, IsPositive, IsString,
  Min, ValidateNested
} from 'class-validator';
import { COLLECTION_ALLOW_TYPE, CollectionFavorite, CollectionIsHide } from '../../../common/constants/common';
import { IsHexColorCustom, IsOptionalCustom, IsType, IsUUIDWithDomain } from '../../../common/decorators';
import { AlertParam } from '../../../common/dtos/alertParam';
import { IsTrashDto } from '../../../common/dtos/isTrash.dto';
import { transformColor, transformName } from '../../../common/utils/common';

export enum CollectionType {
  General = -1,
  Home = -2,
  Play = -3,
  Sample = -4,
  Work = -5,
  UserDefined = 0,
  SystemBookmark = 1,
  UserBookmark = 2,
  SharedCollection = 3
}

export enum CollectionKanbanMode {
  ListView = 0,
  KanbanView = 1,
}

export enum CollectionIsExpand {
  NotExpanded = 0,
  Expanded = 1,
}

export enum CollectionViewMode {
  ShowListView = 0,
  ShowKanbanView = 1,
}

export class CollectionParam extends IsTrashDto {
  @IsOptionalCustom()
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional({ example: 'ic_sport_1', description: 'Icon of collection' })
  @Expose()
  public icon: string;

  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  @ApiPropertyOptional({ example: 0, description: 'Parent collection ID of this collection' })
  @Expose()
  public parent_id?: number;

  @IsOptionalCustom()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 1618486501.812,
    description: 'Deadline of this collection in UNIX timestamp' })
  @Expose()
  public due_date?: number;

  @IsOptionalCustom()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 1618486501.812,
    description: 'Recent time having activity of this collection in UNIX timestamp' })
  @Expose()
  public recent_time?: number;

  @IsOptionalCustom()
  @IsEnum(CollectionFavorite)
  @ApiPropertyOptional({ example: 0,
    description: 'Flag of this collection' })
  @Expose()
  public flag?: CollectionFavorite;

  @IsOptionalCustom()
  @IsInt()
  @IsEnum(CollectionIsHide)
  @ApiPropertyOptional({ example: 0,
    description: 'Indicate if this collection should be hidden or not' })
  @Expose()
  public is_hide?: CollectionIsHide;

  @IsOptionalCustom()
  @IsArray()
  @ApiPropertyOptional({ type: AlertParam, isArray: true })
  @ValidateNested({ each: true })
  @ArrayMaxSize(50)
  @Type(() => AlertParam)
  @Expose()
  public alerts?: AlertParam[];

  @IsOptionalCustom()
  @IsInt()
  @IsEnum(CollectionKanbanMode)
  @ApiPropertyOptional({ example: 0, description: 'Indicates if this collection is in kanban mode or list mode' })
  @Expose()
  public kanban_mode?: CollectionKanbanMode;

  @IsOptionalCustom()
  @IsInt()
  @IsEnum(CollectionIsExpand)
  @ApiPropertyOptional({ example: 0, description: 'Indicates if this collection is expanded or not in Collection Picker' })
  @Expose()
  public is_expand?: CollectionIsExpand;

  @IsInt()
  @IsOptionalCustom()
  @Expose()
  @IsEnum(CollectionViewMode)
  @ApiPropertyOptional({ example: 0, description: '0 is show listview, 1 is show kanban view' })
  public view_mode?: CollectionViewMode;
}

export class CreateCollectionParam extends CollectionParam {
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'General', description: 'Name of collection'})
  @Transform(transformName)
  @Expose()
  public name: string;

  @IsOptionalCustom()
  @ApiPropertyOptional({ example: 'e067ad52-a8b5-11eb-b7a0-f78ff48c69fd', description: 'Calendar URI' })
  @IsUUIDWithDomain()
  @Expose()
  public calendar_uri?: string;

  @IsOptionalCustom()
  @IsEnum(COLLECTION_ALLOW_TYPE)
  @ApiPropertyOptional({ example: 0,
    description: 'Collection type' })
  @Expose()
  public type?: CollectionType;

  @IsNotEmpty()
  @IsDefined()
  @IsHexColorCustom()
  @ApiProperty({ example: '#007aff', description: 'Color of collection' })
  @Transform(transformColor)
  @Expose()
  public color: string;

  @IsOptionalCustom()
  @ApiPropertyOptional({ example: "" })
  @Expose()
  @IsType(['string' , 'number'])
  public ref?: string | number;
}

export class UpdateCollectionParam extends CollectionParam {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @IsDefined()
  @ApiProperty({ example: 1 })
  @Expose()
  public id: number;

  @IsNotEmpty()
  @IsOptionalCustom()
  @IsString()
  @ApiProperty({ example: 'General', description: 'Name of collection'})
  @Transform(transformName)
  @Expose()
  public name: string;

  @IsNotEmpty()
  @IsOptionalCustom()
  @ApiProperty()
  @IsHexColorCustom()
  @ApiProperty({ example: '#007aff', description: 'Color of collection' })
  @Transform(transformColor)
  @Expose()
  public color: string;
}

export class DeleteCollectionParam extends
  PartialType(PickType(UpdateCollectionParam, ['id'] as const)) {
}
export class DeleteCollectionDTO {
  @IsInt()
  @Expose()
  id: number;
}