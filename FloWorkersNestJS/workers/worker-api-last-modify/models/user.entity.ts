import { Column, Entity, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@Entity('user')
export class User extends BaseEntity {
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

  @Column('double', {
    precision: 13,
    scale: 3
  })
  updated_date: number;
}
