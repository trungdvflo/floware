import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { CommonEntity } from './common.entity';

@Entity({ name: NAME_ENTITY.REALTIME_CHANNEL_MEMBER })
export class RealtimeChannelMember extends CommonEntity {
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
