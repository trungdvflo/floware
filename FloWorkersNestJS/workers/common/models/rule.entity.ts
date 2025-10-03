import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { CommonEntity } from './common.entity';

@Entity(NAME_ENTITY.RULE)
export class RuleEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('int', { name: 'user_id', unsigned: true })
  user_id: number;

  @Column('varchar', { name: 'name', length: 255 })
  name: string | null;

  @Column('tinyint', {
    width: 1,
  })
  match_type: number;

  @Column({ type: 'decimal', name: 'order_number', precision: 20, scale: 10, default: 0 })
  order_number: number;

  @Column('tinyint', {
    width: 1,
  })
  is_enable: number;

  @Column({ type: 'json',
    nullable: false
  })
  conditions: number;

  @Column({ type: 'json',
    nullable: false
  })
  destinations: number;

  @Column('bigint', {
    width: 20,
  })
  account_id: number;

  @Column('tinyint', {
    width: 1,
  })
  apply_all: number;

}
