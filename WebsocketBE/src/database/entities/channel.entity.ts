import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { getUTCSeconds } from '../../common/utils/common';
import { DatabaseName } from '../constant';
import { DateCommon } from '../date.common';

@Entity({ name: DatabaseName.REALTIME_CHANNEL })
export class Channel extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'name' })
  name: string;

  @Column('varchar', { name: 'title' })
  title: string;

  @Column('varchar', { name: 'type' })
  type: string;

  @Column('bigint', { name: 'internal_channel_id' })
  internal_channel_id: number;

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
