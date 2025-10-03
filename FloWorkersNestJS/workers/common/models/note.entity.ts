import {
  Column, Entity, PrimaryGeneratedColumn
} from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
@Entity({ name: NAME_ENTITY.CAL_NOTE })
export class NoteEntity {
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

  @Column('tinyint', {
    name: 'star',
    width: 1
  })
  star: number;

  @Column('text', {
    name: 'description',
  })
  description: string;

  @Column('text', {
    name: 'summary',
  })
  summary: string;

  @Column('tinyint', {
    name: 'trashed',
    width: 1
  })
  trashed: number;

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

  // @BeforeInsert()
  // createDates() {
  //   if(!this.created_date){
  //     this.created_date = TimestampDouble();
  //     this.updated_date = this.created_date;
  //   }
  // }
  // @BeforeUpdate()
  // updateDates() {
  //   if(!this.updated_date){
  //     this.updated_date = TimestampDouble();
  //   }
  // }

  // @AfterLoad()
  // afterLoad() {
  //   this.created_date = this.created_date * 1000;
  //   this.updated_date = this.updated_date * 1000;
  // }
}