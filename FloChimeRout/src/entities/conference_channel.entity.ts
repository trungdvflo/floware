import { TABLE_CHANNEL } from 'configs/typeorm.util';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { DateCommon } from './date-common.entity';

@Index('idx_user_id', ['user_id'], {})
@Entity({ name: TABLE_CHANNEL })
export class ConferenceChannel extends DateCommon {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @Column('bigint', { name: 'user_id', width: 20, nullable: false })
  user_id: number;

  @Column('varchar', { name: 'title', length: 2000 })
  title: string;

  @Column('varchar', { name: 'uid', length: 255 })
  uid: string;

  @Column('varchar', { name: 'room_url', length: 2000, nullable: false })
  room_url: string;

  @Column('varchar', { name: 'channel_arn', length: 2000, nullable: false })
  channel_arn: string;
}
