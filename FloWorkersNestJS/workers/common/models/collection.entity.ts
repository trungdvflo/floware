import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IS_TRASHED } from '../constants/common.constant';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { CommonEntity } from './common.entity';

export class TriggerParam {
  public past: boolean;
  public weeks: number;
  public days: number;
  public hours: number;
  public minutes: number;
  public seconds: number;
}

export class AlertParam {
  public uid: string;
  public action: string;
  public trigger: TriggerParam;
  public description: string;
}

@Entity({ name: NAME_ENTITY.COLLECTION})
export class CollectionEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id: number;

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
    default: null
  })
  parent_id: number | null;

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
    default: null,
  })
  due_date: number | null;

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
  alerts: AlertParam[] | null;

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
  kanban_mode: number | null;

  @Column('tinyint', {
    name: 'is_trashed',
    width: 1,
    default: 0,
  })
  is_trashed: IS_TRASHED;
}