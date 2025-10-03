import { JsonTransformer } from '@anchan828/typeorm-transformers';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AttendeeParam } from '../dtos/attendee-todo.dto';
import { DateCommon } from './date-common.entity';

@Entity({ name: 'calling_history', synchronize : true })
export class CallingHistory extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: "int", name: "id", unsigned: true })
  id: number;

  @Column('bigint', { width: 20, name: "user_id" })
  user_id: number;

  @Column("varchar", { name: "organizer", nullable: true, length: 255 })
  organizer: string;

  @Column("varchar", { name: "invitee", nullable: true, length: 255 })
  invitee: string;

  @Column("text", { name: "room_url" })
  room_url: string;

  @Column("text", { name: "room_id" })
  room_id: string;

  @Column('double', {
    name: 'call_start_time',
    precision: 13,
    scale: 3,
    nullable: true,
  })
  call_start_time: number;

  @Column('double', {
    name: 'call_end_time',
    precision: 13,
    scale: 3,
    nullable: true,
  })
  call_end_time: number | 0;

  @Column("tinyint", { width: 4 })
  call_status: number;

  @Column("tinyint", { width: 4 })
  call_type: number;

  @Column("tinyint", { width: 1 })
  is_owner: number | 0;

  @Column('json', {
    name: 'attendees',
    nullable: true,
    transformer: new JsonTransformer<AttendeeParam[]>(),
  })
  attendees: AttendeeParam[];
}