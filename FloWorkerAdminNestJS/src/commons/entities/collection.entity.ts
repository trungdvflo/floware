import {
  Column,
  Entity, PrimaryColumn
} from 'typeorm';

@Entity()
export class Collection {
  @PrimaryColumn('bigint', { type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('bigint', {
    name: 'user_id',
    width: 20,
  })
  user_id: number;

  @Column('varchar', {
    name: 'calendar_uri',
    nullable: true,
    length: 255,
    default: null
  })
  calendar_uri: string | null;

  @Column('bigint', {
    name: 'parent_id',
    nullable: true,
    width: 20,
    default: 0
  })
  parent_id: number;

  @Column('varchar', {
    name: 'name',
    length: 255
  })
  name: string;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
    default: () => 0,
  })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: true,
    default: null,
  })
  updated_date: number | null;

  @Column('varchar', {
    name: 'color',
    length: 255
  })
  color: string;

  @Column('tinyint', {
    name: 'type',
    width: 1,
    default: 0,
  })
  type: number;

  @Column('double', {
    name: 'due_date',
    precision: 13,
    scale: 3,
    nullable: true,
    default: 0,
  })
  due_date: number;

  @Column('tinyint', {
    name: 'flag',
    width: 1,
    default: 0,
  })
  flag: number;

  @Column('tinyint', {
    name: 'is_hide',
    width: 1,
    default: 0,
  })
  is_hide: number;

  @Column('json', {
    name: 'alerts',
    nullable: true,
    default: null,
  })
  alerts: object;

  @Column('double', {
    name: 'recent_time',
    precision: 13,
    scale: 3,
    nullable: true,
    default: 0,
  })
  recent_time: number;

  @Column('tinyint', {
    name: 'kanban_mode',
    width: 1,
    default: 0,
  })
  kanban_mode: number;

  @Column('tinyint', {
    name: 'is_trashed',
    width: 1,
    default: 0,
  })
  is_trashed: number;

  @Column('tinyint', {
    name: 'is_expand',
    width: 1,
    default: 0,
  })
  is_expand: number;

  @Column('tinyint', {
    name: 'view_mode',
    width: 1,
    default: 0,
    nullable: false
  })
  view_mode: number;

}