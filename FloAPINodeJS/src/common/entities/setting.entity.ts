import {
  Column, Entity,
  PrimaryGeneratedColumn
} from 'typeorm';
import { TypeWorkingTime } from '../../modules/setting/dto/update-global-setting.dto';
import { DateCommon } from './date-common.entity';

@Entity({ name: 'setting' })
export class GlobalSetting extends DateCommon {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id: number;

  @Column("varchar", { length: 255, nullable: true })
  default_cal: string;

  @Column("varchar", { length: 255, nullable: true })
  timezone: string;

  @Column('json', {
    name: 'working_time',
    nullable: true,
  })
  working_time: TypeWorkingTime[];

  @Column("int", { width: 11, nullable: false })
  event_duration: number;

  @Column("int", { width: 11, nullable: false })
  alert_default: number;

  @Column("int", { width: 11, nullable: false })
  snooze_default: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // timezone_support: number;

  @Column("int", { width: 11, nullable: false })
  task_duration: number;

  @Column("int", { width: 11, nullable: false })
  deadline: number;

  @Column("int", { width: 11, nullable: false })
  due_task: number;

  @Column("int", { width: 11, nullable: false })
  number_stask: number;

  @Column("int", { width: 11, nullable: false })
  total_duration: number;

  @Column("int", { width: 11, nullable: false })
  buffer_time: number;

  @Column("tinyint", { width: 4, nullable: false })
  hide_stask: number;

  // @Exclude()
  // @Column("int", { width: 11, nullable:false })
  // background: number;

  // @Exclude()
  // @Column("int", { width: 11, nullable:false })
  // short_duration: number;

  // @Exclude()
  // @Column("int", { width: 11, nullable:false })
  // medium_duration: number;

  // @Exclude()
  // @Column("int", { width: 11, nullable:false })
  // long_duration: number;

  @Column('bigint', { width: 20, name: "default_folder", unsigned: true })
  default_folder: number;

  // @Exclude()
  // @Column("varchar", { length: 50, nullable: true })
  // calendar_color: string;

  // @Exclude()
  // @Column("varchar", { length: 50, nullable: true })
  // folder_color: string;

  // @Exclude()
  // @Column('text')
  // navbar_system: string;

  // @Exclude()
  // @Column('text')
  // navbar_custom: string;

  // @Exclude()
  // @Column('text')
  // infobox: string;

  // @Exclude()
  // @Column('json', {
  //   name: 'infobox_order',
  //   nullable: false,
  // })
  // infobox_order: Json;

  @Column("int", { width: 11, nullable: false })
  contact_display_name: number;

  @Column("int", { width: 11, nullable: false })
  contact_display_inlist: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // m_ade: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // m_event: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // m_task: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // m_stask: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // m_done_task: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // m_due_task: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // m_note: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // dw_due_task: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // dw_ade: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // dw_done_task: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // dw_note: number;

  @Column("tinyint", { width: 4, nullable: false })
  del_warning: number;

  @Column("tinyint", { width: 4, nullable: false })
  hide_future_task: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // ics_attachment: number;

  @Column("int", { width: 11, nullable: false })
  mail_auto_download_check: number;

  @Column("int", { width: 11, nullable: false })
  mail_num_time_dont_auto_download: number;

  @Column("int", { width: 11, nullable: false })
  mail_time_dont_auto_download: number;

  @Column("int", { width: 11, nullable: false })
  mail_display_act_button: number;

  @Column("int", { width: 11, nullable: false })
  number_mail_lines_preview: number;

  @Column("int", { width: 11, nullable: false })
  mail_moving_check: number;

  @Column("int", { width: 11, nullable: false })
  mail_size_dont_download: number;

  @Column("tinyint", { width: 4, nullable: false })
  show_nutshell: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // show_bg_by_weather: number;

  @Column("int", { width: 11, nullable: false })
  week_start: number;

  // @Exclude()
  // @Column("int", { width: 11, nullable:false })
  // send_and_track: number;

  // @Exclude()
  // @Column("int", { width: 11, nullable:false })
  // action_icon: number;

  // @Exclude()
  // @Column('json', {
  //   name: 'emailbox_order',
  //   nullable: false,
  // })
  // emailbox_order: Json;

  @Column("int", { width: 11, nullable: false })
  alert_before: number;

  @Column("tinyint", { width: 4, nullable: false })
  send_invite: number;

  @Column("varchar", { length: 255, nullable: true })
  from_email: string;

  @Column("int", { width: 11, nullable: false })
  default_alert_ade: number;

  @Column("int", { width: 11, nullable: false })
  default_alert_todo: number;

  // @Exclude()
  // @Column("int", { width: 11, nullable:false })
  // default_milestone_alert: number;

  @Column('text')
  avatar: string;

  // @Exclude()
  // @Column("tinyint", { width: 8, nullable:false })
  // assign_tz_eve: number;

  @Column("int", { width: 11, nullable: false })
  m_show: number;

  @Column("int", { width: 11, nullable: false })
  dw_show: number;

  @Column("int", { width: 11, nullable: false })
  agenda_show: number;

  // @Exclude()
  // @Column("int", { width: 11, nullable:false })
  // move_email: number;

  // @Exclude()
  // @Column("int", { width: 11, nullable:false })
  // noti_bear_track: number;

  // @Exclude()
  // @Column("int", { width: 11, nullable:false })
  // state: number;

  // @Exclude()
  // @Column('text')
  // recent_tz: string;

  // @Exclude()
  // @Column('mediumtext')
  // order_url: string;

  // @Exclude()
  // @Column('mediumtext')
  // order_todo: string;

  // @Exclude()
  // @Column('mediumtext')
  // keep_state: string;

  @Column("varchar", { length: 500, nullable: true })
  omni_cal_id: string;

  // @Exclude()
  // @Column("int", { width: 11, nullable:false })
  // url_option: number;

  // @Exclude()
  // @Column("int", { width: 11, nullable:false })
  // init_planner_st: number;

  // @Exclude()
  // @Column("int", { width: 11, nullable:false })
  // show_star: number;

  @Column('text')
  signature: string;

  @Column("int", { width: 11, nullable: false })
  filing_email: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // show_date_timezone: number;

  // @Exclude()
  // @Column("tinyint", { width: 4, nullable:false })
  // show_feedback: number;

  @Column("tinyint", { width: 4, nullable: false })
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

  @Column("tinyint", { width: 1, nullable: false, default: 1 })
  todo_ask: number;

  @Column("tinyint", { width: 1, nullable: false, default: 1 })
  note_ask: number;

  @Column('bigint', { width: 20, name: "note_collection_id", unsigned: true })
  note_collection_id: number;

  @Column('bigint', { width: 20, name: "todo_collection_id", unsigned: true })
  todo_collection_id: number;

  @Column('int', { width: 11, name: "notification_clean_date", unsigned: true })
  notification_clean_date: number;
}