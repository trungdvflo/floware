import { TABLE_CHANNEL_MEMBER } from 'configs/typeorm.util';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateCommon } from './date-common.entity';

@Entity({ name: TABLE_CHANNEL_MEMBER })
export class ConferenceMemberEntity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @Column('bigint', { name: 'user_id', width: 20, nullable: false })
  user_id: number;

  @Column('bigint', { name: 'channel_id', width: 20, nullable: false })
  channel_id: number;

  @Column('varchar', { length: 255, nullable: false })
  uid: string;

  @Column('varchar', { length: 2000, nullable: false })
  chat_url: string;

  @Column('varchar', { length: 100, nullable: false })
  email: string;

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

  @Column('double', {
    name: 'revoke_time',
    precision: 13,
    scale: 3,
    nullable: false,
  })
  revoke_time: number;

  @Column('tinyint', { width: 1, unsigned: true, nullable: false })
  vip: number;

  participants?: Participant[];
  type?: number;
  status?: number;
  start_time?: number;
  end_time?: number;
  action_time?: number;
}

type Participant = {
  id: number;
  email: string;
  is_creator: 0 | 1;
  revoke_time: number;
};
