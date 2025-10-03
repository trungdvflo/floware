import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SUBSCRIPTION_FEATURE_TABLE_NAME } from '../utils/typeorm.util';

@Entity({ name: SUBSCRIPTION_FEATURE_TABLE_NAME, synchronize : true })
export class SubscriptionFeatureEntity {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { length: 255, nullable: false })
  name: string;

  @Column('tinyint', { width: 1, unsigned: true, nullable: true, default: 0 })
  feature_type: number;
}