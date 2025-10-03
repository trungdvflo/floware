import { Column } from 'typeorm';

export class DateCommon {
  @Column('double', { name: 'created_date', precision: 13, scale: 3, nullable: false })
  created_date: number;

  @Column('double', { name: 'updated_date', precision: 13, scale: 3, nullable: false })
  updated_date: number;
}
