import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('user_id_and_is_current_and_sub_id', ['user_id', 'is_current', 'sub_id'], { unique: true })
@Entity('subscription_purchase')
export class SubscriptionPurchase {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column('bigint', {
    width: 20
  })
  user_id: number;

  @Column('varchar', { length: 255 })
  sub_id: string;

  @Column('varchar', { length: 500 })
  description: string;

  @Column('varchar', { length: 500 })
  transaction_id: string;

  @Column('text')
  receipt_data: string;

  @Column('tinyint', { width: 1 })
  is_current: number;

  @Column('tinyint', { width: 1 })
  purchase_type: number;

  @Column('tinyint', { width: 1 })
  purchase_status: number;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3
  })
  created_date: number;
}
