import { TimestampDouble } from 'common/utils/datetime.util';
import { MEETING_ACTIVITIES_TABLE_NAME } from 'configs/typeorm.util';
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateCommon } from './date-common.entity';
export enum ActivitiesType {
  JOINED = "JOINED",
  LEAVED = "LEAVED"
}

@Entity({ name: MEETING_ACTIVITIES_TABLE_NAME })
export class MeetingActivitiesEntity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'id' })
  id: number;

  @Column('varchar', { name: 'attendee_id', length: 50 })
  attendee_id: string;

  @Column('varchar', { name: 'meeting_id', length: 50 })
  meeting_id: string;

  @Column('varchar', { name: 'phone_number', length: 50 })
  phone_number: string;
  
  @Column({
    type: "enum",
    enum: ActivitiesType,
    default: ActivitiesType.JOINED,
  })
  type: ActivitiesType

  @Column('int', {
    name: 'activity_time',
  })
  activity_time: number | null;

  @BeforeInsert()
  createDates() {
    if(!this.created_date){
      this.created_date = TimestampDouble();
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
