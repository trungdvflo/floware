import { Column } from 'typeorm';
export class CommonEntity {
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

  @Column('bigint', { width: 20, name: "user_id" })
  user_id: number;

  email?: string;
}