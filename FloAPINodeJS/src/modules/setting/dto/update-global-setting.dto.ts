import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray,
  IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsString, Max, Min, ValidateNested
} from 'class-validator';
import {
  GLOBAL_SETTING,
  HIDE_DONE_STATUS,
  INDICATE_DONE_STATUS,
  SETTING_SECOND,
  WORKING_TIME_DAY
} from '../../../common/constants';
import { Timezone } from '../../../common/constants/timezone.constant';
import { IsOptionalCustom } from '../../../common/decorators';
import { TRIM_STRING_TRANSFORMER } from '../../../common/transformers/trim-string.transformer';

export class TypeWorkingTime {
  @IsNotEmpty()
  @Expose()
  @IsEnum(WORKING_TIME_DAY, { each: true })
  day: WORKING_TIME_DAY;

  @IsNotEmpty()
  @Expose()
  @IsInt()
  @Max(GLOBAL_SETTING.MAX_SECONDS)
  @Min(GLOBAL_SETTING.MIN_SECONDS)
  iMin: number;

  @IsNotEmpty()
  @Expose()
  @IsInt()
  @Max(GLOBAL_SETTING.MAX_SECONDS)
  @Min(GLOBAL_SETTING.MIN_SECONDS)
  iMax: number;
}
export class UpdateGlobalSettingDto {
  @Expose()
  @IsOptionalCustom()
  @IsEnum(Timezone, { message: `timezone must be one of the following values in Timezone List` })
  @Transform(TRIM_STRING_TRANSFORMER)
  @IsString()
  timezone: string;

  @IsOptionalCustom()
  @Expose()
  @IsArray()
  @ArrayMaxSize(7)
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TypeWorkingTime)
  working_time: TypeWorkingTime[];

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  event_duration: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  alert_default: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  snooze_default: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(SETTING_SECOND.MIN_SECOND)
  @Max(SETTING_SECOND.MAX_SECOND)
  task_duration: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  deadline: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  due_task: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  number_stask: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  total_duration: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  buffer_time: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @IsIn([0,1])
  hide_stask: number;

  @Expose()
  @IsOptionalCustom()
  @IsNumber({ maxDecimalPlaces: 12 }, {
    message: 'Field default_folder invalid',
  })
  @Min(0)
  default_folder: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  contact_display_name: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  contact_display_inlist: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  m_ade: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  m_event: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  m_task: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  m_stask: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  m_done_task: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  m_due_task: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  m_note: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  dw_due_task: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  dw_ade: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  dw_done_task: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  dw_note: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @IsIn([0,1])
  del_warning: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @IsIn([0,1])
  hide_future_task: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  mail_auto_download_check: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  mail_num_time_dont_auto_download: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  mail_time_dont_auto_download: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  mail_display_act_button: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  number_mail_lines_preview: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  mail_moving_check: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  mail_size_dont_download: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @IsIn([0,1])
  show_nutshell: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @IsIn([0,1])
  week_start: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  alert_before: number;

  @Expose()
  @IsOptionalCustom()
  @IsIn([0,1])
  @IsInt()
  send_invite: number;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  @IsEmail()
  from_email: string;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  default_alert_ade: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  default_alert_todo: number;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  avatar: string;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  @Max(63)
  m_show: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  @Max(63)
  dw_show: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  @Max(31)
  agenda_show: number;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  order_todo: string;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  signature: string;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  filing_email: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @IsIn([0,1])
  theme_mode: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  scroll_24h: number;

  @IsOptionalCustom()
  @Expose()
  @IsNumber()
  @IsEnum(HIDE_DONE_STATUS)
  hide_done_todo: number;

  @IsOptionalCustom()
  @Expose()
  @IsNumber()
  @IsEnum(INDICATE_DONE_STATUS)
  indicate_done_todo: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @IsIn([0,1])
  todo_ask: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @IsIn([0,1])
  note_ask: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  note_collection_id: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  todo_collection_id: number;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  notification_clean_date?: number;

  constructor(partial?: Partial<UpdateGlobalSettingDto>) {
    Object.assign(this, partial);
  }
}

export class UpdateGlobalSettingDtos {
  @IsNotEmpty()
  @ApiProperty({
    type: UpdateGlobalSettingDto
  })

  @ValidateNested()
  @Type(() => UpdateGlobalSettingDto)
  @Expose()
  data: UpdateGlobalSettingDto;

  errors: any[];
}
