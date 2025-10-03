import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DatabaseName } from '../constant';
import { DateCommon } from '../date.common';

@Entity({ name: DatabaseName.REALTIME_SETTING })
export class Setting extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'email' })
  email: string;

  @Column('varchar', { name: 'channel' })
  channel: string;

  @Column('varchar', { name: 'name' })
  name: string;

  @Column('text', { name: 'value' })
  value: string;

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
