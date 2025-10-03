import { BeforeInsert, BeforeUpdate, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('uniq_on_device_uid_and_access_token', ['device_uid', 'access_token'], {})
@Index('uniq_on_device_uid_and_refresh_token', ['device_uid', 'refresh_token'], {})
@Index('uniq_access_token_iv', ['access_token_iv'], {})
@Index('uniq_refresh_token_iv', ['refresh_token_iv'], {})
@Index('idx_on_app_id_and_device_uid', ['app_id', 'device_uid'], {})
@Index('idx_on_user_id_and_app_id_and_device_uid', ['user_id', 'app_id', 'device_uid'], {})
@Index('idx_email', ['email'], {})
@Index('idx_user_id', ['user_id'], {})
@Entity({ name: 'access_token', synchronize: true })
export class AccessToken {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
    unsigned: true,
  })
  id: number;

  @Column('bigint', {
    width: 20,
    name: 'user_id',
    unsigned: true,
  })
  user_id: number;

  @Column('varchar', {
    length: 255,
    name: 'app_id',
    nullable: false,
  })
  app_id: string;

  @Column('varchar', {
    length: 36,
    name: 'device_uid',
    nullable: false,
  })
  device_uid: string;

  @Column('varchar', {
    length: 255,
    name: 'email',
    nullable: false,
  })
  email: string;

  @Column('varbinary', {
    length: 255,
    name: 'access_token',
    nullable: false,
  })
  access_token: string;

  @Column('varbinary', {
    length: 255,
    name: 'access_token_iv',
    nullable: false,
  })
  access_token_iv: string;

  @Column('varbinary', {
    length: 255,
    name: 'refresh_token',
    nullable: false,
  })
  refresh_token: string;

  @Column('varbinary', {
    length: 255,
    name: 'refresh_token_iv',
    nullable: false,
  })
  refresh_token_iv: string;

  @Column('text', {
    name: 'scope',
  })
  scope: string;

  @Column('varchar', {
    length: 45,
    name: 'token_type',
    nullable: false,
  })
  token_type: string;

  @Column('varchar', {
    length: 255,
    name: 'user_agent',
    default: () => "''",
  })
  user_agent: string;

  @Column('varchar', {
    length: 45,
    name: 'ip',
    default: () => "''",
  })
  ip: string;

  @Column('varchar', {
    length: 255,
    name: 'previous_refresh_token',
    default: () => "''",
  })
  previous_refresh_token: string;

  @Column('tinyint', {
    name: 'is_revoked',
    unsigned: true,
    default: () => 0,
  })
  is_revoked: number;

  @Column('varchar', {
    length: 255,
    name: 'device_token',
  })
  device_token: string;

  @Column('double', {
    name: 'expires_in',
    precision: 13,
    scale: 3,
    nullable: false,
  })
  expires_in: number;

  @Column('double', {
    name: 'expires_in_refresh_token',
    precision: 13,
    scale: 3,
    nullable: false,
  })
  expires_in_refresh_token: number;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
    nullable: false,
  })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    nullable: true,
    precision: 13,
    scale: 3,
  })
  updated_date: number | null;

  @BeforeInsert()
  createDate() {
    if(!this.created_date){
      this.created_date = new Date().getTime() / 1000;
      this.updated_date = new Date().getTime() / 1000;
    }
  }
  @BeforeUpdate()
  updateDate() {
    if(!this.updated_date){
      this.updated_date = new Date().getTime() / 1000;
    }
  }
}
