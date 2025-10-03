import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { IS_TRASHED } from '../constants/common';
import { KANBAN_TABLE_NAME } from '../utils/typeorm.util';

@Index('user_id_and_collection_id_and_order_number',
  ['user_id', 'collection_id', 'order_number'])
@Entity(KANBAN_TABLE_NAME)
export class Kanban extends BaseEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  @ApiProperty({ example: 100 })
  readonly id: number;

  @Column('bigint', {
    name: 'user_id',
    width: 20,
    select: false
  })
  user_id: number;

  @Column('bigint', {
    name: 'collection_id',
    width: 20,
  })
  @ApiProperty({ example: 100 })
  collection_id: number;

  @Column('varchar', {
    name: 'name',
    length: 255,
    nullable: false
  })
  @ApiProperty({ example: 'Untitled' })
  name: string;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
    default: 0,
  })
  @ApiProperty({ example: 1618486501.971 })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: true,
    default: null,
  })
  @ApiProperty({ example: 1618486501.971 })
  updated_date: number | null;

  @Column('varchar', {
    name: 'color',
    length: 255
  })
  @ApiProperty({ example: '#d06a65' })
  color: string;

  @Column('decimal', {
    name: 'order_number',
    precision: 20,
    scale: 10,
    nullable: true,
    default: 0.0
  })
  @ApiProperty({ example: 1 })
  order_number: number;

  @Column('tinyint', {
    name: 'archive_status',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0 })
  archive_status: number;

  @Column('double', {
    name: 'order_update_time',
    precision: 13,
    scale: 3,
    nullable: true,
    default: null,
  })
  @ApiProperty({ example: 1618486501.812 })
  order_update_time: number | null;

  @Column('tinyint', {
    name: 'show_done_todo',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0 })
  show_done_todo: number;

  @Column('tinyint', {
    name: 'add_new_obj_type',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0 })
  add_new_obj_type: number;

  @Column('tinyint', {
    name: 'sort_by_type',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0 })
  sort_by_type: number;

  @Column('double', {
    name: 'archived_time',
    precision: 13,
    scale: 3,
    nullable: true,
    default: null,
  })
  @ApiProperty({ example: 1618486501.812 })
  archived_time: number | null;

  @Column('tinyint', {
    name: 'kanban_type',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0 })
  kanban_type: number;

  @Column('tinyint', {
    name: 'is_trashed',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0 })
  is_trashed: IS_TRASHED;

}