import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DatabaseName } from '../constant';
import { DateCommon } from '../date.common';

@Entity({ name: DatabaseName.REALTIME_USER_USAGE })
export class UserUsage extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'email' })
  email: string;

  @Column('int', { name: 'message_size_usage' })
  message_size_usage: number;

  @Column('int', { name: 'message_count' })
  message_count: number;

  @Column('int', { name: 'attachment_size_usage' })
  attachment_size_usage: number;

  @Column('int', { name: 'attachment_count' })
  attachment_count: number;

  @Column('int', { name: 'channel_count' })
  channel_count: number;

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
    if (!this.updated_date) {
      this.updated_date = new Date().getTime() / 1000;
    }
  }
}
