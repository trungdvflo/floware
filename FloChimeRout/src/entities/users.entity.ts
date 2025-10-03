// NOSONAR
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('email_only', ['email'])
@Entity({ name: 'user' })
export class UsersEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column('varchar', {
    length: 255,
  })
  username: string;

  @Column('varchar', {
    length: 255,
  })
  digesta1: string;

  @Column('bigint', {
    name: 'domain_id',
    default: 0,
  })
  domain_id: number;

  @Column('varchar', {
    length: 255,
  })
  email: string;

  @Column('varchar', {
    length: 255,
  })
  password: string;

  @Column('varchar', {
    length: 255,
    default: '',
  })
  appreg_id: string;

  @Column('varchar', {
    length: 255,
    default: '',
  })
  fullname: string;

  @Column('text')
  rsa: string;

  @Column('varchar', {
    length: 255,
  })
  description: string;

  @Column('varchar', {
    length: 255,
    default: '',
  })
  secondary_email: string;

  @Column('varchar', {
    length: 255,
    default: '',
  })
  birthday: string;

  @Column('tinyint', {
    width: 1,
    default: 0,
  })
  gender: number;

  @Column('varchar', {
    length: 255,
    default: '',
  })
  country: string;

  @Column('varchar', {
    length: 50,
    default: '',
  })
  phone_number: string;

  @Column('varchar', {
    length: 25,
    default: '',
  })
  country_code: string;

  @Column('varchar', {
    length: 500,
    default: '',
  })
  token: string;

  @Column('double', {
    precision: 13,
    scale: 3,
    default: 0.0,
  })
  token_expire: number;

  @Column('text', { default: null })
  question: string;

  @Column('text', { default: null })
  answer: string;

  @Column('tinyint', {
    unsigned: true,
    default: 0,
  })
  active_sec_email: number;

  @Column('int', {
    default: 0,
  })
  max_uid: number;

  @Column('tinyint', {
    unsigned: true,
    default: 0,
  })
  activated_push: number;

  @Column('bigint', {
    unsigned: true,
    default: 0,
  })
  quota_limit_bytes: number;

  @Column('tinyint', {
    width: 1,
    default: 0,
  })
  disabled: number;

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
