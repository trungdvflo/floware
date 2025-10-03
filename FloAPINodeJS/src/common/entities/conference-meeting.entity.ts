import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_CONFERENCE_MEETING } from '../constants';
import { DateCommon } from './date-common.entity';

@Entity({ name: TABLE_CONFERENCE_MEETING })
export class ConferenceMeetingEntity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @Column('varchar', { name: 'meeting_id', length: 1000 })
  meeting_id: string;

  @Column('varchar', { name: 'external_meeting_id', length: 1000 })
  external_meeting_id: string;

  @Column('bigint', { name: 'channel_id' })
  channel_id: number;

  @Column('bigint', { name: 'user_id', default: 0, comment: 'Id of caller' })
  user_id: number;

  @Column('text', { name: 'meeting_url', nullable: true })
  meeting_url: string;

  @Column('varchar', { name: 'provider', default: 'CHIME', length: 45 })
  provider: string;

}