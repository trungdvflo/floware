import {
  BaseEntity, BeforeInsert, BeforeUpdate,
  Column, Entity, Index, PrimaryGeneratedColumn
} from 'typeorm';

@Index('user_id_and_email', ['user_id', 'email'], {})
@Entity('report_cached_user')
export class ReportCachedUser extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column('bigint', { width: 20 })
  user_id: number;

  @Column('varchar', { length: 255 })
  email: string;

  @Column('int', { width: 11, default: 0 })
  account_3rd: number;

  @Column('text')
  account_3rd_emails: string;

  @Column('varchar', { length: 1000 })
  account_type: string;

  @Column('varchar', { length: 1000 })
  storage: string;

  @Column('bigint', { width: 20 })
  storage_total: number;

  @Column('text')
  groups: string;

  @Column('varchar', { length: 255 })
  sub_id: string;

  @Column('int', { width: 11 })
  subs_type: number;

  @Column('int', { width: 11 })
  order_number: number;

  @Column('double', { precision: 13, scale: 3 })
  subs_current_date: number;

  @Column('double', { precision: 13, scale: 3 })
  last_used_date: number;

  @Column('double', { precision: 13, scale: 3 })
  join_date: number;

  @Column('double', { precision: 13, scale: 3 })
  next_renewal: number;

  @Column('tinyint', { width: 1, default: 0 })
  disabled: number;

  @Column('tinyint', { width: 1, default: 0 })
  deleted: number;

  @Column('varchar', { length: 1000 })
  addition_info: string;


  @Column('varchar', { length: 10000 })
  platform: string;

  @Column('double', { precision: 13, scale: 3, default: () => 0 })
  created_date: number;

  @Column('double', { precision: 13, scale: 3, nullable: true, default: null })
  updated_date: number | null;

  @BeforeInsert()
  createDates() {
    this.created_date = new Date().getTime() / 1000;
    this.updated_date = this.created_date;
  }

  @BeforeUpdate()
  updateDates() {
    this.updated_date = new Date().getTime() / 1000;
  }
}
