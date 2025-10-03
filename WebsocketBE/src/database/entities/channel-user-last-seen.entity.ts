import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { getUTCSeconds } from '../../common/utils/common';
import { DatabaseName } from '../constant';
import { DateCommon } from '../date.common';

@Entity({ name: DatabaseName.REALTIME_CHAT_CHANNEL_USER_LAST_SEEN })
export class ChannelUserLastSeen extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'email' })
  email: string;

  @Column('varchar', { name: 'channel_name' })
  channel_name: string;

  @Column('varchar', { name: 'last_message_uid' })
  last_message_uid: string;

  @Column('double', { name: 'last_seen', precision: 13, scale: 3, nullable: false })
  last_seen: number;

  @Column('int', { name: 'unread' })
  unread: number;

  @Column('int', { name: 'remine' })
  remine: number;

  @BeforeInsert()
  createDates() {
    const currentTime = getUTCSeconds();
    if (!this.created_date) {
      this.created_date = currentTime;
      this.updated_date = this.created_date;
    }
  }
  @BeforeUpdate()
  updateDates() {
    this.updated_date = getUTCSeconds();
  }
}
