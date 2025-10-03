import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'device_token' })
export class DevicetokenEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
    unsigned: true
  })
  id?: number;

  user_id: number;

  device_token: string;

  device_type: number;

  device_uuid: string;

  time_sent_silent: number;

  time_received_silent: number;

  status_app_run: number;

  env_silent: number;

  device_env: number;

  cert_env: number | null;

  created_date: number;

  updated_date: number | null;
}