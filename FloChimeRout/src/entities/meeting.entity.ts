import { JsonTransformer } from '@anchan828/typeorm-transformers';
import { MediaPlacement } from 'aws-sdk/clients/chimesdkmeetings';
import { TimestampDouble } from 'common/utils/datetime.util';
import { MEETING_TABLE_NAME } from 'configs/typeorm.util';
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateCommon } from './date-common.entity';
export enum MeetingStatus {
  STARTED = "STARTED",
  ENDED = "ENDED",
  PENDING = "PENDING",
}

export enum ExternalMeetingType {
  CONFERENCE = "CONFERENCE",
}

@Entity({ name: MEETING_TABLE_NAME })
export class MeetingEntity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'id' })
  id: number;

  @Column('json', {
    name: 'media_placement',
    nullable: true,
    transformer: new JsonTransformer<MediaPlacement>(),
  })
  media_placement: MediaPlacement;

  @Column('varchar', { name: 'meeting_id', length: 50 })
  meeting_id: string;

  @Column('varchar', { name: 'external_meeting_id', length: 100 })
  external_meeting_id: string;

  @Column('varchar', { name: 'external_meeting_type', length: 20 })
  external_meeting_type: string;

  @Column('varchar', { name: 'media_region', length: 50 })
  media_region: string;

  @Column('bigint', {
    name: 'spend_time',
  })
  spend_time: number;

  @Column('bigint', {
    name: 'host_user_id',
  })
  host_user_id: number;

  @Column('bigint', {
    name: 'channel_id',
  })
  channel_id: number;

  @Column('varchar', {
    name: 'channel_title',
  })
  channel_title: string;

  @Column({
    type: "enum",
    enum: MeetingStatus,
    default: MeetingStatus.PENDING,
  })
  status: MeetingStatus

  @Column('double', {
    name: 'start_time',
    nullable: true,
  })
  start_time: number | null;

  @Column('double', {
    name: 'end_time',
    nullable: true,
  })
  end_time: number | null;

  @BeforeInsert()
  createDates() {
    if(!this.created_date){
      this.created_date = TimestampDouble();
      this.start_time = TimestampDouble();
      this.updated_date = this.created_date;
    }
  }
  @BeforeUpdate()
  updateDates() {
    if(!this.updated_date){
      this.updated_date = TimestampDouble();
    }
  }
}
