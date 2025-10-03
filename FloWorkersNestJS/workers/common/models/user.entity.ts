import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';

@Entity({ name: NAME_ENTITY.USER})
export class UserEntity {
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
}
