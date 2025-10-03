import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { CLOUD_TABLE_NAME } from '../utils/typeorm.util';
import { DateCommon } from './date-common.entity';

@Index('idx_user_id', ['user_id'], {})
@Entity({ name: CLOUD_TABLE_NAME, synchronize : true })
export class Cloud extends DateCommon {
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
  @ApiProperty({ example: 1 })
  order_number: number;

  @Column('double', {
    name: 'order_update_time',
    precision: 13,
    scale: 3,
    nullable: true,
    default: null,
  })
  @ApiProperty({ example: 1618486501.812 })
  order_update_time: number | null;
}