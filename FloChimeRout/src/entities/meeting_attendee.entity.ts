import { MEETING_ATTENDEE_TABLE_NAME } from 'configs/typeorm.util';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateCommon } from './date-common.entity';
export enum JoinType {
  INTERNET = "INTERNET",
  DIAL = "DIAL"
}

export enum JoinStatus {
  PENDING = "PENDING",
  JOINED = "JOINED",
  LEAVED = "LEAVED",
  DROPED = "DROPED",
  INVITED = "INVITED",
  DECLINED = "DECLINED"
}

@Entity({ name: MEETING_ATTENDEE_TABLE_NAME })
export class MeetingAttendeeEntity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'id' })
  id: number;

  @Column('varchar', { name: 'attendee_id', length: 50 })
  attendee_id: string;

  @Column('varchar', { name: 'meeting_id', length: 50 })
  meeting_id: string;

  @Column('varchar', { name: 'user_email', length: 100 })
  user_email: string;

  @Column('varchar', { name: 'phone_number', length: 50 })
  phone_number: string;
  
  @Column('varchar', { name: 'join_token', length: 3000 })
  join_token: string;

  @Column('boolean', { name: 'is_flo_user'})
  is_flo_user: boolean;
  
  @Column('bigint', {
    name: 'spend_time',
  })
  spend_time: number;

  @Column('int', { name: 'add_by'})
  add_by: number;

  @Column({
    type: "enum",
    enum: JoinType,
    default: JoinType.INTERNET,
  })
  join_type: JoinType

  @Column({
    type: "enum",
    enum: JoinStatus,
    default: JoinStatus.PENDING,
  })
  status: JoinStatus

  @Column('double', {
    name: 'join_time',
    precision: 13,
    scale: 3,
    nullable: true,
  })
  join_time: number | null;

  @Column('double', {
    name: 'end_time',
    precision: 13,
    scale: 3,
    nullable: true,
  })
  end_time: number | null;
}
