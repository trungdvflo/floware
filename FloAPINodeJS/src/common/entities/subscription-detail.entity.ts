import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SUBSCRIPTION_DETAIL_TABLE_NAME } from '../utils/typeorm.util';

@Entity({ name: SUBSCRIPTION_DETAIL_TABLE_NAME, synchronize : true })
export class SubscriptionDetailEntity {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { length: 255, nullable: false })
  sub_id: string;

  @Column('int', { width: 11, unsigned: true, nullable: false, default: 0 })
  com_id: number;

  @Column('int', { width: 11, unsigned: true, nullable: false, default: 0 })
  sub_value: number;

  @Column("varchar", { length: 255, nullable: false })
  description: string;
}