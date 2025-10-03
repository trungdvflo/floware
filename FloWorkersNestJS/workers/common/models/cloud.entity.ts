import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { CommonEntity } from './common.entity';

@Entity({ name: NAME_ENTITY.CLOUD})
export class CloudEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id: number;

  @Column("varchar", { length: 255, nullable: false })
  uid: string;

  @Column('text', { nullable: true })
  real_filename: string | null;

  @Column("varchar", { length: 255, nullable: false })
  ext: string;

  @Column("varchar", { length: 255, nullable: false })
  device_uid: string;

  @Column("text")
  bookmark_data: string;

  @Column("int", { width: 11 })
  size: number | 0;

  @Column('tinyint', { width: 1})
  upload_status: number;

  @Column('decimal', {
    name: 'order_number',
    precision: 20,
    scale: 10,
    nullable: true,
    default: 0.0
  })
  order_number: number;

  @Column('double', {
    name: 'order_update_time',
    precision: 13,
    scale: 3,
    nullable: true,
    default: null,
  })
  order_update_time: number | null;
}