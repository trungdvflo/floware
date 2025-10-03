import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DatabaseName } from '../constant';
import { DateCommon } from '../date.common';

@Entity({ name: DatabaseName.REALTIME_MESSAGE_CHANNEL_SENT })
export class MessageChannelSent extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'message_uid' })
  message_uid: string;

  @Column('varchar', { name: 'to_channel' })
  to_channel: string;

  @Column('tinyint', { name: 'status' })
  status: number;

  @Column('double', { name: 'sent_time', precision: 13, scale: 3, nullable: false })
  sent_time: number;

  @Column('varchar', { name: 'send_by_email' })
  send_by_email: string;

  @BeforeInsert()
  createDates() {
    const currentTime = new Date().getTime() / 1000;
    if (!this.created_date) {
      this.created_date = currentTime;
      this.updated_date = this.created_date;
    }

    if (!this.sent_time) {
      this.sent_time = currentTime;
    }
  }
  @BeforeUpdate()
  updateDates() {
    if (!this.updated_date) {
      this.updated_date = new Date().getTime() / 1000;
    }
  }
}
