import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DatabaseName } from '../constant';
import { DateCommon } from '../date.common';

@Entity({ name: DatabaseName.REALTIME_MESSAGE_CHANNEL })
export class MessageChannel extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'message_uid' })
  message_uid: string;

  @Column('varchar', { name: 'channel_name' })
  channel_name: string;

  @BeforeInsert()
  createDates() {
    if (!this.created_date) {
      this.created_date = new Date().getTime() / 1000;
      this.updated_date = this.created_date;
    }
  }
  @BeforeUpdate()
  updateDates() {
    if (!this.updated_date) {
      this.updated_date = new Date().getTime() / 1000;
    }
  }
}
