import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gmail_history')
export class GmailHistory extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column('bigint', { width: 20 })
  user_id: number;

  @Column('varchar', { length: 255 })
  gmail: string;
}
