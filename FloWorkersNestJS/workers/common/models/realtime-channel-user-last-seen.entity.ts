import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';

@Entity({ name: NAME_ENTITY.REALTIME_CHAT_CHANNEL_USER_LAST_SEEN })
export class RealtimeChannelUserLastSeen {
  @PrimaryGeneratedColumn('increment', { type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'email' })
  email: string;

  @Column('varchar', { name: 'channel_name' })
  channel_name: string;

  @Column('varchar', { name: 'last_message_uid' })
  last_message_uid: string;

  @Column('double', { name: 'last_seen', precision: 13, scale: 3, nullable: false  })
  last_seen: number;

  @Column('int', { name: 'unread' })
  unread: number;

  @Column('int', { name: 'remine' })
  remine: number;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
  })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: true,
  })
  updated_date: number | null;

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
