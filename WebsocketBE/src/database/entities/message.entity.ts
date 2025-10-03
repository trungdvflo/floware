import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { QoS, SendType, Status, Type } from '../../interface/message.interface';
import { DatabaseName } from '../constant';
import { DateCommon } from '../date.common';

@Entity({ name: DatabaseName.REALTIME_MESSAGE })
export class Message extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'from' })
  from: string;

  @Column({ type: 'enum', enum: Type })
  type: Type;

  @Column('varchar', { name: 'uid' })
  uid: string;

  @Column('varchar', { name: 'code' })
  code: string;

  @Column('text', { name: 'content' })
  content: string;

  @Column('text', { name: 'metadata' })
  metadata: string;

  @Column({ type: 'enum', enum: SendType })
  send_type: SendType;

  @Column('text', { name: 'to_channel' })
  to_channel: string;

  @Column({ type: 'enum', enum: SendType })
  qos: QoS;

  @Column('int', { name: 'delay' })
  delay: number;

  @Column('tinyint', { name: 'status' })
  status: Status;

  // use for replied message, in quote and forward should null
  @Column('varchar', { name: 'parent_uid' })
  parent_uid: string;

  // quoted | forward to selection
  @Column('text', { name: 'content_marked' })
  content_marked: string;

  // channel_id
  // channel_type
  // message_uid
  // metadata
  // email
  // created_date
  // updated_date
  // deleted_date
  @Column('text', { name: 'message_marked' })
  message_marked: string;

  @Column('int', { name: 'sent_time' })
  sent_time: number;

  @Column('double', { name: 'deleted_date', precision: 13, scale: 3, nullable: true })
  deleted_date: number;

  @BeforeInsert()
  createDates() {
    if (!this.created_date) {
      this.created_date = new Date().getTime() / 1000;
      this.updated_date = this.created_date;
    }
  }
  @BeforeUpdate()
  updateDates() {
    this.updated_date = new Date().getTime() / 1000;
  }
}
