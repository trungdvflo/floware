import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CalendarInstance } from '../../../commons/entities/calendar-instance.entity';
import { CalendarObject } from '../../../commons/entities/calendar-object.entity';

import { VARBINARY_STRING_TRANSFORMER } from '../../../commons/constants/constant';

@Entity('calendars')
export class Calendar {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('int', { name: 'synctoken', unsigned: true, default: () => "'1'" })
  synctoken: number;

  @Column('varbinary', {
    name: 'components',
    nullable: true,
    length: 255,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  components: string | null;

  @OneToMany(() => CalendarInstance, (ci) => ci.calendar)
  calendarInstances: CalendarInstance[];

  @OneToMany(() => CalendarObject, (ins) => ins.calendar)
  calendarObjects: CalendarObject[];
}
