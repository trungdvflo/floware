import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'user_platform_version' })
export class UserPlatformVersion {
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

  @Column('bigint', {
    name: 'platform_release_version_id',
    width: 20,
  })
  platform_release_version_id: number;

  @Column('varchar', {
    name: 'app_id',
    length: 255,
  })
  app_id: string;

  @Column('varchar', {
    name: 'device_token',
    length: 255,
  })
  device_token: string;

  @Column('varchar', {
    name: 'user_agent',
    length: 255,
  })
  user_agent: string;

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