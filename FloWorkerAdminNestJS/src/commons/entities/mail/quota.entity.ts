import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('quota')
export class Quota {
  @PrimaryGeneratedColumn()
  username: string;

  @Column('bigint', { width: 20 })
  bytes: number;

  @Column('int', { width: 11 })
  messages: number;

  @Column('bigint', { width: 20 })
  cal_bytes: number;

  @Column('bigint', { width: 20 })
  card_bytes: number;

  @Column('bigint', { width: 20 })
  file_bytes: number;

  @Column('int', { width: 11 })
  num_sent: number;

  @Column('bigint', { width: 20 })
  qa_bytes: number;

  @Column('bigint', { width: 20 })
  file_common_bytes?: number;
}
