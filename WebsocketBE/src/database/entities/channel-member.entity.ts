import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { getUTCSeconds } from '../../common/utils/common';
import { DatabaseName } from '../constant';
import { DateCommon } from '../date.common';

@Entity({ name: DatabaseName.REALTIME_CHANNEL_MEMBER })
export class ChannelMember extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'email' })
  email: string;

  @Column('int', { name: 'channel_id' })
  channel_id: number;

  @Column('double', { name: 'revoke_date', precision: 13, scale: 3 })
  revoke_date: number;

  @BeforeInsert()
  createDates() {
    if (!this.created_date) {
      this.created_date = getUTCSeconds();
      this.updated_date = this.created_date;
    }
  }
  @BeforeUpdate()
  updateDates() {
    if (!this.updated_date) {
      this.updated_date = getUTCSeconds();
    }
  }
}
