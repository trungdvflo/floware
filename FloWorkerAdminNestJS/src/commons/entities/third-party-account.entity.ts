import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('third_party_account')
export class ThirdPartyAccount {
  @PrimaryGeneratedColumn({ type: "bigint" })
  readonly id: number;

  @Column({
    type: "bigint"
  })
  user_id: number;

  @Column({ length: 255 })
  server_income: string;

  @Column({ length: 255 })
  user_income: string;

  @Column({
    length: 1000
  })
  pass_income: string;

  @Column({ length: 255 })
  port_income: string;

  @Column({ width: 11 })
  use_ssl_income: number;

  @Column({ width: 11 })
  type_income: number;

  @Column({ length: 255 })
  server_smtp: string;

  @Column({ length: 255 })
  user_smtp: string;

  @Column({ length: 1000 })
  pass_smtp: string;

  @Column({ length: 255 })
  port_smtp: string;

  @Column({ width: 11 })
  use_ssl_smtp: number;

  @Column({ width: 11 })
  auth_type_smtp: number;

  @Column({ length: 255 })
  server_caldav: string;

  @Column({ length: 255 })
  server_path_caldav: string;

  @Column({ length: 255 })
  port_caldav: string;

  @Column({ width: 11 })
  use_ssl_caldav: number;

  @Column({
    width: 11
  })
  use_kerberos_caldav: number;

  @Column({ width: 11 })
  auth_type: number;

  @Column({ width: 11 })
  account_type: number;

  @Column({ type: 'json', default: {} })
  account_sync: object;

  @Column({
    length: 500
  })
  auth_key: string;

  @Column({
    length: 500
  })
  auth_token: string;

  @Column({ length: 255 })
  full_name: string;

  @Column({ length: 255 })
  description: string;

  @Column({
    length: 1000
  })
  refresh_token: string;

  @Column({
    length: 255
  })
  provider: string;

  @Column({ length: 255 })
  icloud_user_id: string;

  @Column({ length: 255 })
  user_caldav: string;

  @Column({ length: 255 })
  email_address: string;

  @Column({
    width: 11
  })
  token_expire: number;

  @Column({
    width: 11
  })
  activated_push: number;

  @Column('text')
  signature: string;

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
}
