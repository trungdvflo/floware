import {
  Column, Entity,
  PrimaryGeneratedColumn
} from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { CommonEntity } from './common.entity';
// TRANSFORMER
export enum BOOLEAN_SETTING {
  TRUE = 1,
  FALSE = 0
}
@Entity({ name: NAME_ENTITY.SETTING })
export class SettingEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id: number;

  @Column("varchar", { length: 255, nullable: true })
  default_cal: string;

  @Column("varchar", { length: 255, nullable: true })
  timezone: string;

  @Column("int", { width: 11, nullable:false })
  event_duration: number;

  @Column("int", { width: 11, nullable:false })
  alert_default: number;

  @Column("int", { width: 11, nullable:false })
  snooze_default: number;

  @Column("int", { width: 11, nullable:false })
  task_duration: number;

  @Column("int", { width: 11, nullable:false })
  deadline: number;

  @Column("int", { width: 11, nullable:false })
  due_task: number;

  @Column("int", { width: 11, nullable:false })
  number_stask: number;

  @Column("int", { width: 11, nullable:false })
  total_duration: number;

  @Column("int", { width: 11, nullable:false })
  buffer_time: number;

  @Column("tinyint", { width: 4, nullable:false })
  hide_stask: number;

  @Column('bigint', { width: 20, name: "default_folder", unsigned: true })
  default_folder: number;

  @Column("int", { width: 11, nullable:false })
  contact_display_name: number;

  @Column("int", { width: 11, nullable:false })
  contact_display_inlist: number;

  @Column("tinyint", { width: 4, nullable:false })
  del_warning: number;

  @Column("tinyint", { width: 4, nullable:false })
  hide_future_task: number;

  @Column("int", { width: 11, nullable:false })
  mail_auto_download_check: number;

  @Column("int", { width: 11, nullable:false })
  mail_num_time_dont_auto_download: number;

  @Column("int", { width: 11, nullable:false })
  mail_time_dont_auto_download: number;

  @Column("int", { width: 11, nullable:false })
  mail_display_act_button: number;

  @Column("int", { width: 11, nullable:false })
  number_mail_lines_preview: number;

  @Column("int", { width: 11, nullable:false })
  mail_moving_check: number;

  @Column("int", { width: 11, nullable:false })
  mail_size_dont_download: number;

  @Column("tinyint", { width: 4, nullable:false })
  show_nutshell: number;

  @Column("int", { width: 11, nullable:false })
  week_start: number;

  @Column("int", { width: 11, nullable:false })
  alert_before: number;

  @Column("tinyint", { width: 4, nullable:false })
  send_invite: number;

  @Column("varchar", { length: 255, nullable: true })
  from_email: string;

  @Column("int", { width: 11, nullable:false })
  default_alert_ade: number;

  @Column("int", { width: 11, nullable:false })
  default_alert_todo: number;

  @Column('text')
  avatar: string;

  @Column("int", { width: 11, nullable:false })
  m_show: number;

  @Column("int", { width: 11, nullable:false })
  dw_show: number;

  @Column("varchar", { length: 500, nullable: true })
  omni_cal_id: string;

  @Column('text')
  signature: string;

  @Column("int", { width: 11, nullable:false })
  filing_email: number;

  @Column("tinyint", { width: 4, nullable:false })
  theme_mode: number;

  @Column('tinyint', {
    name: 'scroll_24h',
    width: 1
  })
  scroll_24h: number;

  @Column('tinyint', {
    name: 'hide_done_todo',
    width: 1
  })
  hide_done_todo: number;

  @Column('tinyint', {
    name: 'indicate_done_todo',
    width: 1
  })
  indicate_done_todo: number;

  @Column("tinyint", { width: 1, nullable:false, default: 1 })
  todo_ask: number;

  @Column("tinyint", { width: 1, nullable:false, default: 1 })
  note_ask: number;

  @Column('bigint', { width: 20, name: "note_collection_id", unsigned: true })
  note_collection_id: number;

  @Column('bigint', { width: 20, name: "todo_collection_id", unsigned: true })
  todo_collection_id: number;
}
