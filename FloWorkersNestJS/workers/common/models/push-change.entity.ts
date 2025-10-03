import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
@Entity({ name: NAME_ENTITY.PUSH_CHANGE})
export class PushChangeEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('int', { width: 20, unsigned: true, nullable: false })
  user_id: number;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
  })
  created_date: number;
}