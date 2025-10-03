import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { DatabaseName } from '../constant';
import { DateCommon } from '../date.common';

@Index('uniq_device_token', ['device_token'], { background: true, unique: true })
@Entity({ name: DatabaseName.DEVICE_TOKEN })
export class DeviceToken extends DateCommon {
  @PrimaryGeneratedColumn('increment', { name: 'id', type: 'bigint' })
  id?: number;

  @Column('bigint', { name: 'user_id', width: 20, select: false })
  user_id: number;

  @Column('varchar', { name: 'device_token', length: 255 })
  device_token: string;

  @Column('tinyint', { name: 'device_type', width: 1, default: 0 })
  device_type: number;

  @Column('double', {
    name: 'time_sent_silent',
    precision: 13,
    scale: 3,
    nullable: true,
    default: 0,
  })
  time_sent_silent: number;

  @Column('double', {
    name: 'time_received_silent',
    precision: 13,
    scale: 3,
    nullable: true,
    default: 0,
  })
  time_received_silent: number;

  @Column('tinyint', { name: 'status_app_run', width: 1, default: 0 })
  status_app_run: number;

  @Column('tinyint', { name: 'env_silent', width: 1, default: 0 })
  env_silent: number;

  @Column('tinyint', { name: 'device_env', width: 1, default: 0 })
  device_env: number;

  @Column('tinyint', { name: 'cert_env', width: 1, default: 0, nullable: true })
  cert_env: number | null;
}
