import { Column } from 'typeorm';

export class DateCommon {
  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
    nullable: true,
  })
  created_date: number | null;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: true,
  })
  updated_date: number | null;
}
