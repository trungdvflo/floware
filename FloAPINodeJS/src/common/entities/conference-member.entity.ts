import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_MEMBER } from '../constants';
export type Participant = {
  id: number;
  email: string;
  is_creator: 0 | 1 | 2;
  revoke_time: number;
  channel_id?: number;
};
@Entity({ name: TABLE_MEMBER })
export class ConferenceMemberEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @Column("bigint", { name: 'user_id', width: 20, nullable: false })
  user_id: number;

  @Column("bigint", { name: 'channel_id', width: 20, nullable: false })
  channel_id: number;

  @Column('varchar', { length: 255, nullable: false })
  uid: string;

  @Column('varchar', { length: 100, nullable: false })
  email: string;

  @Column('varchar', { length: 100, nullable: false })
  created_by: string;

  @Column('tinyint', { width: 1, unsigned: true, nullable: false, default: 0 })
  is_creator: number;

  @Column('varchar', { name: 'title', length: 2000 })
  title: string;

  @Column('varchar', { name: 'member_arn', length: 2000 })
  member_arn: string;

  @Column('varchar', { name: 'description', length: 5000 })
  description: string;

  @Column('text', { name: 'avatar', nullable: false })
  avatar: string;

  @Column('double', { name: 'updated_date', precision: 13, scale: 3, nullable: false })
  updated_date: number;

  @Column('double', { name: 'created_date', precision: 13, scale: 3, nullable: false })
  created_date: number;

  @Column('double', { name: 'revoke_time', precision: 13, scale: 3, nullable: false })
  revoke_time: number;

  @Column("varchar", { name: 'chat_url', length: 2000, nullable: false })
  chat_url: string;

  @Column('tinyint', { width: 1, unsigned: true, nullable: false })
  vip: number;

  @Column('tinyint', { width: 1, unsigned: true, default: 1 })
  view_chat_history: number;

  @Column('double', { name: 'join_time', precision: 13, scale: 3, default: 0 })
  join_time: number;

  participants?: Participant[];
  type?: number;
  status?: number;
  start_time?: number;
  end_time?: number;
  action_time?: number;
  share_title?: string;
}