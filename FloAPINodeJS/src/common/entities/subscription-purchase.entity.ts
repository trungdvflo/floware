import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SUBSCRIPTION_PURCHASE_TABLE_NAME } from '../utils/typeorm.util';
import { DateCommon } from './date-common.entity';

@Entity({ name: SUBSCRIPTION_PURCHASE_TABLE_NAME, synchronize : true })
export class SubscriptionPurchaseEntity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { length: 255, nullable: false })
  sub_id: string;

  @Column("varchar", { length: 500, nullable: false })
  description: string;

  @Column("varchar", { length: 500, nullable: false })
  transaction_id: string;

  @Column("text", { name: "receipt_data", nullable: false })
  receipt_data: string;

  @Column('tinyint', { width: 1, unsigned: true, nullable: true, default: 0 })
  is_current: number;

  @Column('tinyint', { width: 1, unsigned: true, nullable: true, default: 0 })
  purchase_type: number;

  @Column('tinyint', { width: 1, unsigned: true, nullable: false, default: 1 })
  purchase_status: number;
}