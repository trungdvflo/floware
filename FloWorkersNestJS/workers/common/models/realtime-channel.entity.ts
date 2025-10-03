import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';

@Entity({ name: NAME_ENTITY.REALTIME_CHANNEL })
export class RealtimeChannel {
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
