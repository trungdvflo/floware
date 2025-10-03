import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateCommon } from '../date.common';
import { DatabaseName } from '../constant';

export enum SendItemStatus {
  UNSENT = 0,
  SENT = 1,
  READ = 2,
}
@Entity({ name: DatabaseName.MESSAGE_SEND_ITEM })
export class MessageSendItem extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'int', name: 'id' })
  id: number;

  @Column('int', { name: 'message_uid' })
  message_uid: string;

  @Column('varchar', { name: 'to' })
  to: string;

  @Column({ type: 'enum', enum: SendItemStatus })
  status: SendItemStatus;

  @Column('int', { name: 'send_by', nullable: true })
  send_by: number;

  @Column('int', { name: 'sent_time', nullable: true })
  sent_time: number;

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
