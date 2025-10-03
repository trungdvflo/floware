import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gmail_accesstoken')
export class GmailAccessToken {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column('bigint', { width: 20 })
  user_id: number;

  @Column('varchar', { length: 255 })
  gmail: string;
}
