import { Expose } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsString } from 'class-validator';
import {
  BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn
} from 'typeorm';
import { SQL_ENTITY_NAME } from '../constants';
import { IsOptionalCustom } from '../decorators';
import {
  THIRD_PARTY_TRANSFORMER_JSON
} from '../transformers/string-json.transformer';
// CONSTANTS
import { ACCOUNT_TYPE, AUTH_TYPE, USE_SSL } from '../../modules/third-party-account/contants';

@Index("idx_and_user_id",
  ["id", "user_id"], {})
@Entity({ name: SQL_ENTITY_NAME.THIRD_PARTY_ACCOUNT })
export class ThirdPartyAccount extends BaseEntity {

  @PrimaryGeneratedColumn({ type: "bigint" })
  readonly id: number;

  @Column({
    type: "bigint"
    , select: false
  })
  @IsOptionalCustom()
  user_id: number;

  @Expose()
  @IsOptionalCustom()
  @Column({ length: 255 })
  server_income: string;

  @Expose()
  @Column({ length: 255 })
  user_income: string;

  @Expose()
  @IsOptionalCustom()
  @Column({
    length: 1000
    , select: false
  })
  pass_income: string;

  @Expose()
  @IsOptionalCustom()
  @Column({ length: 255 })
  port_income: string;

  @Expose()
  @IsOptionalCustom()
  @Column({ width: 11 })
  @IsEnum(USE_SSL)
  use_ssl_income: USE_SSL;

  @Expose()
  @IsOptionalCustom()
  @Column({ width: 11 })
  @IsInt()
  type_income: number;

  @Expose()
  @IsOptionalCustom()
  @Column({ length: 255 })
  @IsString()
  server_smtp: string;

  @Expose()
  @IsOptionalCustom()
  @Column({ length: 255 })
  @IsString()
  user_smtp: string;

  @Expose()
  @IsOptionalCustom()
  @Column({ length: 1000 })
  pass_smtp: string;

  @Expose()
  @IsOptionalCustom()
  @Column({ length: 255 })
  port_smtp: string;

  @Expose()
  @IsOptionalCustom()
  @Column({ width: 11 })
  @IsEnum(USE_SSL)
  use_ssl_smtp: USE_SSL;

  @Expose()
  @IsOptionalCustom()
  @Column({ width: 11 })
  auth_type_smtp: AUTH_TYPE;

  @Expose()
  @IsOptionalCustom()
  @Column({ length: 255 })
  @IsString()
  server_caldav: string;

  @Expose()
  @IsOptionalCustom()
  @Column({ length: 255 })
  @IsString()
  server_path_caldav: string;

  @Expose()
  @IsOptionalCustom()
  @Column({ length: 255 })
  port_caldav: string;

  @Expose()
  @IsOptionalCustom()
  @Column({ width: 11 })
  @IsEnum(USE_SSL)
  use_ssl_caldav: USE_SSL;

  @Expose()
  @IsOptionalCustom()
  @Column({
    width: 11
    , select: false
  })
  use_kerberos_caldav: number;

  @Expose()
  @IsOptionalCustom()
  @Column({ width: 11 })
  auth_type: AUTH_TYPE;

  @Expose()
  @IsOptionalCustom()
  @Column({ width: 11 })
  account_type: ACCOUNT_TYPE;

  @Expose()
  // @IsOptionalCustom()
  @Column({ length: 255, transformer: THIRD_PARTY_TRANSFORMER_JSON, default: null })
  account_sync: string;

  @Expose()
  @IsOptionalCustom()
  @Column({
    length: 500
    , select: false
  })
  auth_key: string;

  @Expose()
  @IsOptionalCustom()
  @Column({
    length: 500
    , select: false
  })
  auth_token: string;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  @Column({ length: 255 })
  full_name: string;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  @Column({ length: 255 })
  description: string;

  @Expose()
  @IsOptionalCustom()
  @Column({
    length: 1000
    , select: false
  })
  refresh_token: string;

  @Expose()
  @IsOptionalCustom()
  @Column({
    length: 255
    , select: false
  })
  provider: string;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  @Column({ length: 255 })
  icloud_user_id: string;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  @Column({ length: 255 })
  user_caldav: string;

  @Expose()
  @IsOptionalCustom()
  @IsEmail()
  @Column({ length: 255 })
  email_address: string;

  @Expose()
  @IsOptionalCustom()
  @Column({
    width: 11
    , select: false
  })
  token_expire: number;

  @Expose()
  @IsOptionalCustom()
  @Column({
    width: 11
    , select: false
  })
  activated_push: number;

  @Expose()
  @IsOptionalCustom()
  @IsString()
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