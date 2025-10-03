import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SUBSCRIPTION_COMPONENT_TABLE_NAME } from '../utils/typeorm.util';

@Entity({ name: SUBSCRIPTION_COMPONENT_TABLE_NAME, synchronize : true })
export class SubscriptionComponentEntity {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { length: 255, nullable: false })
  name: string;

  @Column('int', { width: 11, unsigned: true, nullable: false, default: 1 })
  comp_type: number;
}