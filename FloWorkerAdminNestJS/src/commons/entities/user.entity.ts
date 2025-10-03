import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  BaseEntity
} from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('varchar', {
    length: 255
  })
  email: string;

  @Column('varchar', {
    length: 255
  })
  fullname: string;

  @Column('text')
  rsa: string;

  @Column('tinyint', {
    width: 1
  })
  disabled: number;

  @Column('double', {
    precision: 13,
    scale: 3
  })
  created_date: number;
}
