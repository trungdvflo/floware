import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('schedulingobjects')
export class SchedulingObject {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column('varchar', { length: 255 })
  principaluri: string;
}
