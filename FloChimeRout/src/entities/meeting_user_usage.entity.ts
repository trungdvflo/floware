import { TimestampDouble } from 'common/utils/datetime.util';
import { CHIME_MEETING_USER_USAGE_TABLE_NAME } from 'configs/typeorm.util';
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateCommon } from './date-common.entity';

@Entity({ name: CHIME_MEETING_USER_USAGE_TABLE_NAME })
export class MeetingUserUsageEntity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'id' })
  id: number;

  @Column('varchar', { name: 'email', length: 100 })
  email: string;

  @Column('int', { name: 'meeting_internet_spent'})
  meeting_internet_spent: number;

  @Column('int', { name: 'meeting_dial_outbound_spent'})
  meeting_dial_outbound_spent: number;

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
