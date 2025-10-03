import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SUBSCRIPTION_TABLE_NAME } from '../utils/typeorm.util';

@Entity({ name: SUBSCRIPTION_TABLE_NAME, synchronize : true })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { length: 255, nullable: false })
  name: string;

  @Column({ type: "float", default: 0 })
  price: number;

  @Column('int', { width: 11, unsigned: true, nullable: false, default: 0 })
  period: number;

  @Column('int', { width: 11, unsigned: true, nullable: false, default: 0 })
  auto_renew: number;

  @Column("varchar", { length: 255, nullable: false })
  description: string;

  @Column('int', { width: 11, unsigned: true, nullable: false, default: 0 })
  subs_type: number;

  @Column('int', { width: 11, unsigned: true, nullable: false, default: 1 })
  order_number: number;
}