import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateCommon } from './date-common.entity';

@Entity({ name: 'platform_setting_default' })
export class PlatformSettingDefault extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: "int", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { length: 255, nullable: false })
  app_reg_id: string;

  @Column("varchar", { length: 255, nullable: false })
  app_version: string;

  @Column("json", { nullable: false })
  data_setting: object;
}