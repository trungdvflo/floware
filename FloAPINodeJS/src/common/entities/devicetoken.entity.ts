import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { DateCommon } from './date-common.entity';

@Index("uniq_device_token", ["device_token"], { background: true, unique: true })
@Entity({ name: 'device_token' })
export class Devicetoken extends DateCommon {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  @ApiProperty({
    example: 1
  })
  id?: number;

  @Column('bigint', {
    name: 'user_id',
    width: 20,
    select: false
  })
  user_id: number;

  @Column('varchar', {
    name: 'device_token',
    length: 255,
  })
  @ApiProperty({
    example: '4a56918ae4d86fa8c8511bd8681b802b'
  })
  device_token: string;

  @Column('tinyint', {
    name: 'device_type',
    width: 1,
    default: 0,
  })
  @ApiProperty({
    example: 0
  })
  device_type: number;

  @Column('varchar', {
    length: 255,
    name: 'device_uuid',
    nullable: true,
    select: false
  })
  device_uuid: string;

  @Column('double', {
    name: 'time_sent_silent',
    precision: 13,
    scale: 3,
    nullable: true,
    default: 0,
  })
  @ApiProperty({
    example: 1545372243.833
  })
  time_sent_silent: number;

  @Column('double', {
    name: 'time_received_silent',
    precision: 13,
    scale: 3,
    nullable: true,
    default: 0,
  })
  @ApiProperty({
    example: 1545372243.833
  })
  time_received_silent: number;

  @Column('tinyint', {
    name: 'status_app_run',
    width: 1,
    default: 0,
  })
  @ApiProperty({
    example: 0
  })
  status_app_run: number;

  @Column('tinyint', {
    name: 'env_silent',
    width: 1,
    default: 0,
  })
  @ApiProperty({
    example: 0
  })
  env_silent: number;

  @Column('tinyint', {
    name: 'device_env',
    width: 1,
    default: 0,
  })
  @ApiProperty({
    example: 0
  })
  device_env: number;

  @Column('tinyint', {
    name: 'cert_env',
    width: 1,
    default: 0,
    nullable: true,
  })
  @ApiProperty({
    example: 0
  })
  cert_env: number | null;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
  })
  @ApiProperty({
    example: 1545372243.833
  })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: true,
  })
  @ApiProperty({
    example: 1545372243.833
  })
  updated_date: number | null;
}