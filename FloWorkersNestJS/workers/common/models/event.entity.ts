import { AfterLoad, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';

@Entity({ name: NAME_ENTITY.CAL_EVENT })
export class EventEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id?: number;

  @Column('varchar', {
    name: 'uid',
    length: 255
  })
  uid: string;

  @Column('int', {
    name: 'calendarid',
    width: 11
  })
  calendarid: number;

  @Column('int', {
    name: 'calendar_object_id',
    width: 11
  })
  calendar_object_id: number;

  @Column('varchar', {
    name: 'uri',
    length: 255
  })
  uri: string;

  @Column('text', {
    name: 'summary',
  })
  summary: string;

  @Column('varchar', {
    name: 'location',
    length: 255
  })
  location: string;

  @Column('double', {
    name: 'start',
    precision: 13,
    scale: 3,
  })
  start: number;

  @Column('double', {
    name: 'end',
    precision: 13,
    scale: 3,
  })
  end: number;

  @Column('varchar', {
    name: 'color',
    length: 255,
    nullable: true,
  })
  color: string | null;

  @Column('tinyint', {
    name: 'allday',
    width: 1,
    default: 0
  })
  allday: number;

  @Column('varchar', {
    name: 'timezone',
    length: 255,
    nullable: true,
  })
  timezone: string | null;

  @Column('tinyint', {
    name: 'mi',
    default: 0,
  })
  mi: number;

  @Column('varchar', {
    name: 'repeat_rule',
    length: 1000,
    nullable: true,
  })
  repeat_rule: string | null;

  @Column('double', {
    name: 'recurid',
    precision: 13,
    scale: 3,
  })
  recurid: number | null;

  @Column('json', {
    nullable: true
  })
  exdates: number[] | null;

  @Column('tinyint', {
    name: 'trashed',
    nullable: false,
    default: 0,
  })
  trashed: number | 0;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
  })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: true,
  })
  updated_date: number | null;
  @AfterLoad()
  afterLoad() {
    this.start = this.start * 1000;
    this.end = this.end * 1000;
    this.recurid = this.recurid * 1000;
    if (this.exdates && this.exdates.length) {
      this.exdates = this.exdates.map(exdate => exdate * 1000);
    }
  }
}
