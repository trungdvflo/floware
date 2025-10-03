import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity, Index, PrimaryGeneratedColumn
} from 'typeorm';
import {
  CollectionIsExpand,
  CollectionKanbanMode,
  CollectionType,
  CollectionViewMode
} from '../../modules/collection/dto/collection-param';
import { CollectionFavorite, CollectionIsHide, IS_TRASHED } from '../constants/common';
import { AlertParam } from '../dtos/alertParam';

@Index('user_id', ['user_id'], {})
@Entity()
export class Collection {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  @ApiProperty({ example: 100, description: 'Unique ID record' })
  id: number;

  @Column('bigint', {
    name: 'user_id',
    width: 20,
    select: false
  })
  user_id: number;

  @Column('varchar', { name: 'realtime_channel', length: 200 })
  realtime_channel: string;

  @Column('varchar', {
    name: 'calendar_uri',
    nullable: true,
    length: 255,
    default: null
  })
  @ApiProperty({ example: '0a54bb21-a40c-11eb-bc69-bb27e9fcb7a3',
    description: 'Calendar URI related to this collection' })
  calendar_uri: string | null;

  @Column('bigint', {
    name: 'parent_id',
    nullable: true,
    width: 20,
    default: 0
  })
  @ApiProperty({ example: 0,
    description: 'Collection ID of the collection contains this collection' })
  parent_id: number;

  @Column('varchar', {
    name: 'name',
    length: 255
  })
  @ApiProperty({ example: 'General', description: 'Name of collection' })
  name: string;

  @Column('varchar', {
    name: 'icon',
    length: 255
  })
  @ApiProperty({ example: 'General', description: 'Icon of collection' })
  icon: string;
  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
    default: () => 0,
  })
  @ApiProperty({ example: 1618486501.812,
    description: 'Created time of this collection in UNIX timestamp' })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: true,
    default: null,
  })
  @ApiProperty({ example: 1618486501.812,
    description: 'Updated time of this collection in UNIX timestamp' })
  updated_date: number | null;

  @Column('varchar', {
    name: 'color',
    length: 255
  })
  @ApiProperty({ example: '#ac725e',
    description: 'Color of this collection' })
  color: string;

  @Column('tinyint', {
    name: 'type',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0,
    description: 'Type of this collection' })
  type: CollectionType;

  @Column('double', {
    name: 'due_date',
    precision: 13,
    scale: 3,
    nullable: true,
    default: 0,
  })
  @ApiProperty({ example: 1618486501.812,
    description: 'Deadline of this collection in UNIX timestamp' })
  due_date: number;

  @Column('tinyint', {
    name: 'flag',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0,
    description: 'Flag of this collection' })
  flag: CollectionFavorite;

  @Column('tinyint', {
    name: 'is_hide',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0,
    description: 'Indicate if this collection should be hidden' })
  is_hide: CollectionIsHide;

  @Column('json', {
    name: 'alerts',
    nullable: true,
    default: null,
  })
  @ApiProperty({
    type: AlertParam,
    isArray: true })
  alerts: AlertParam[] | null;

  @Column('double', {
    name: 'recent_time',
    precision: 13,
    scale: 3,
    nullable: true,
    default: 0,
  })
  @ApiProperty({ example: 1618486501.812,
    description: 'Recent operation time of this collection in UNIX timestamp' })
  recent_time: number;

  @Column('tinyint', {
    name: 'kanban_mode',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0, description: 'Inidicate if this collection is in kanban mode or list mode' })
  kanban_mode: CollectionKanbanMode;

  @Column('tinyint', {
    name: 'is_trashed',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0, description: 'Indicate if this collection is not trashed, trashed or deleted' })
  is_trashed: IS_TRASHED;

  @Column('tinyint', {
    name: 'is_expand',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0, description: 'Indicates if this collection is expanded or not in Collection Picker' })
  is_expand: CollectionIsExpand;

  @Column('tinyint', {
    name: 'view_mode',
    width: 1,
    default: 0,
    nullable: false
  })
  @ApiProperty({ example: 0 })
  view_mode: CollectionViewMode;

}