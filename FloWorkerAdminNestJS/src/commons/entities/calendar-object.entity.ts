import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Calendar } from '../../workers/terminate-account.worker/entities/calendar.entity';
import { CALDAV_OBJ_TYPE, VARBINARY_STRING_TRANSFORMER } from '../constants/constant';

@Index('calendarid', ['calendarid', 'uri'], { unique: true })
@Index('uri', ['uri'], {})
@Index('uid', ['uid'], {})
@Index('componenttype', ['componenttype'], {})
@Index('calendarid_2', ['calendarid'], {})
@Index('calendardata', ['calendardata'], { fulltext: true })
@Entity('calendarobjects', { schema: 'flodata_uat_new' })
export class CalendarObject {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('longtext', { name: 'calendardata', nullable: true })
  calendardata: string | null;

  @Column('varbinary', {
    name: 'uri',
    nullable: true,
    length: 200,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  uri: string | null;

  @Column('int', { name: 'calendarid', unsigned: true })
  calendarid: number;

  @Column('int', { name: 'lastmodified', nullable: true, unsigned: true })
  lastmodified: number | null;

  @Column('varbinary', {
    name: 'etag',
    nullable: true,
    length: 32,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  etag: string | null;

  @Column('int', { name: 'size', unsigned: true })
  size: number;

  @Column('varbinary', {
    name: 'componenttype',
    length: 255,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  componenttype: CALDAV_OBJ_TYPE;

  @Column('int', { name: 'firstoccurence', nullable: true, unsigned: true })
  firstoccurence: number | null;

  @Column('int', { name: 'lastoccurence', nullable: true, unsigned: true })
  lastoccurence: number | null;

  @Column('varchar', { name: 'uid', nullable: true, length: 200 })
  uid: string | null;

  @Column('int', { name: 'invisible', default: () => "'0'" })
  invisible: number;

  @ManyToOne((type) => Calendar)
  @JoinColumn({ name: 'calendarid', referencedColumnName: 'id' })
  calendar: Calendar;
}
