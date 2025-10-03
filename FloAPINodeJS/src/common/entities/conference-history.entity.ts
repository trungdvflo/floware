import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { InviteeParam } from '../../modules/conference-invite/dtos';
import { TABLE_CONFERENCE_HISTORY } from '../constants';
import { DateCommon } from './date-common.entity';

@Entity({ name: TABLE_CONFERENCE_HISTORY })
export class ConferenceHistoryEntity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @Column("bigint", { name: 'member_id', width: 20, nullable: false })
  member_id: number;

  @Column('varchar', { length: 100, nullable: false })
  invitee: string;

  @Column('text', { name: 'attendees', nullable: false })
  lsAttendees: string;

  @Column('tinyint', { width: 1, unsigned: true, nullable: false, default: 0 })
  type: number;

  @Column('tinyint', { width: 1, unsigned: true, nullable: false, default: 0 })
  status: number;

  @Column('tinyint', { width: 1, unsigned: true, nullable: false, default: 0 })
  is_reply: number;

  @Column('varchar', { name: 'organizer', length: 100 })
  organizer: string;

  @Column('bigint', { name: 'conference_meeting_id', width: 20, select: false })
  conference_meeting_id: number;

  @Column('varchar', { name: 'meeting_id', length: 1000 })
  meeting_id: string;

  @Column('varchar', { name: 'external_meeting_id', length: 1000 })
  external_meeting_id: string;

  @Column('double', { name: 'start_time', precision: 13, scale: 3, nullable: false })
  start_time: number;

  @Column('double', { name: 'end_time', precision: 13, scale: 3, nullable: false })
  end_time: number;

  @Column('double', { name: 'action_time', precision: 13, scale: 3, nullable: false })
  action_time: number;

  attendees: InviteeParam[];
  durations?: any;
  duration?: number;
}