import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique
} from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { CommonEntity } from './common.entity';

@Entity({ name: NAME_ENTITY.REALTIME_USER_STATUS })
@Unique('email', ['email'])
export class RealtimeUserStatus extends CommonEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'email' })
  email: string;

  @Column('double', { name: 'last_time_online', precision: 13, scale: 3 })
  last_time_online: number;

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
