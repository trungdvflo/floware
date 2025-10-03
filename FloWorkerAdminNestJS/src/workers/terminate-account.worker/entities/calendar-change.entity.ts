import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('calendarchanges')
export class CalendarChange {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column('int', { width: 11 })
  calendarid: number;
}
