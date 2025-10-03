// NOSONAR
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'user_deleted' })
export class UserDeleted {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column("bigint", {
    name: "user_id",
    default: 0
  })
  user_id: number;

  @Column('varchar', {
    length: 255,
  })
  username: string;

  @Column("tinyint", {
    width: 1,
    default: 0
  })
  is_disabled: number;

  @Column("tinyint", {
    width: 1,
    default: 0
  })
  progress: number;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
  })
  created_date: number;

  @Column('double', {
    name: 'cleaning_date',
    precision: 13,
    scale: 3,
    nullable: true
  })
  cleaning_date: number | null;
}