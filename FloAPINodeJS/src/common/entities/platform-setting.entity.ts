
import {
  Column, Entity, PrimaryGeneratedColumn
} from 'typeorm';
import { TRANSFORMER_JSON } from './transformer.entity';
import { DateCommon } from './date-common.entity';

@Entity({ name: 'platform_setting' })
export class PlatformSetting extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column('text', { transformer: TRANSFORMER_JSON })
  data_setting: any;

  @Column({ length: 255, select: false })
  app_reg_id: string;

  @Column({ length: 255 })
  app_version: string;
}