import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('subscription')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('float')
  price: number;

  @Column('int', { width: 11 })
  period: number;

  @Column('int', { width: 11 })
  auto_renew: number;

  @Column('varchar', { length: 255 })
  description: string;

  @Column('int', { width: 11 })
  subs_type: number;

  @Column('int', { width: 11 })
  order_number: number;
}
