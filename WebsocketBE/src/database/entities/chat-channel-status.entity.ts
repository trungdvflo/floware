import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DatabaseName } from '../constant';
import { DateCommon } from '../date.common';

@Entity({ name: DatabaseName.REALTIME_CHAT_CHANNEL_STATUS })
export class ChatChannelStatus extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'channel_name' })
  channel_name: string;

  @Column('varchar', { name: 'last_message_uid' })
  last_message_uid: string;

  @Column('double', { name: 'last_send_time', precision: 13, scale: 3, nullable: false })
  last_send_time: number;

  @Column('int', { name: 'msg_count' })
  msg_count: number;

  @BeforeInsert()
  createDates() {
    const currentTime = new Date().getTime() / 1000;
    if (!this.created_date) {
      this.created_date = currentTime;
      this.updated_date = this.created_date;
    }
  }
  @BeforeUpdate()
  updateDates() {
    this.updated_date = new Date().getTime() / 1000;
  }
}
