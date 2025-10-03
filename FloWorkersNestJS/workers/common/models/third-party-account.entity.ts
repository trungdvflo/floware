import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { CommonEntity } from './common.entity';

@Entity(NAME_ENTITY.THIRD_PARTY_ACCOUNT)
export class ThirdPartyAccountEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  readonly id: number;

  @Column({ length: 255 })
  server_income: string;

  @Column({ length: 255 })
  user_income: string;

  @Column({ length: 1000 })
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

  @Column({ width: 11 })
  use_kerberos_caldav: number;

  @Column({ width: 11 })
  auth_type: number;

  @Column({ width: 11 })
  account_type: number;

  @Column({ length: 255 })
  account_sync: string;

  @Column({ length: 500 })
  auth_key: string;

  @Column({ length: 500 })
  auth_token: string;

  @Column({ length: 255 })
  full_name: string;

  @Column({ length: 255 })
  description: string;

  @Column({ length: 1000 })
  refresh_token: string;

  @Column({ length: 255 })
  provider: string;

  @Column({ length: 255 })
  icloud_user_id: string;

  @Column({ length: 255 })
  user_caldav: string;

  @Column({ length: 255 })
  email_address: string;

  @Column({ width: 11 })
  token_expire: number;

  @Column({ width: 11 })
  activated_push: number;

  @Column('text')
  signature: string;

}
