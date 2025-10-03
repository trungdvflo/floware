import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { CommonEntity } from './common.entity';

@Entity({ name: NAME_ENTITY.KANBAN})
export class KanbanEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column('bigint', {
    name: 'collection_id',
    width: 20
  })
  collection_id: number;

  @Column('varchar', {
    name: 'name',
    length: 255
  })
  name: string;

  @Column('varchar', {
    name: 'color',
    length: 255
  })
  color: string;

  @Column('decimal', {
    name: 'order_number',
    precision: 20,
    scale: 10,
    nullable: true,
    default: 0.0
  })
  order_number: number;

  @Column('tinyint', {
    name: 'archive_status',
    width: 1,
    default: 0,
  })
  archive_status: number;

  @Column('double', {
    name: 'order_update_time',
    precision: 13,
    scale: 3,
    nullable: true,
    default: null,
  })
  order_update_time: number | null;

  @Column('tinyint', {
    name: 'show_done_todo',
    width: 1,
    default: 0,
  })
  show_done_todo: number;

  @Column('tinyint', {
    name: 'add_new_obj_type',
    width: 1,
    default: 0,
  })
  add_new_obj_type: number;

  @Column('tinyint', {
    name: 'sort_by_type',
    width: 1,
    default: 0,
  })
  sort_by_type: number;

  @Column('double', {
    name: 'archived_time',
    precision: 13,
    scale: 3,
    nullable: true,
    default: null,
  })
  archived_time: number | null;

  @Column('tinyint', {
    name: 'kanban_type',
    width: 1,
    default: 0,
  })
  kanban_type: number;

  @Column('tinyint', {
    name: 'is_trashed',
    nullable: true,
    unsigned: true,
    default: 0,
  })
  is_trashed: number | null;
}