import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { VARBINARY_STRING_TRANSFORMER } from '../transformers/varbinary-string.transformer';
import { URL_TABLE_NAME } from '../utils/typeorm.util';
import { DateCommon } from './date-common.entity';

@Index('user_id', ['user_id'], {})
@Index('title', ['title'], { fulltext: true })
@Index('url', ['url'], { fulltext: true })
@Entity(URL_TABLE_NAME)
export class Url extends DateCommon {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('int', { name: 'user_id', unsigned: true })
  user_id: number;

  @Column('text', { name: 'url', nullable: true })
  url: string | null;

  @Column('varbinary', {
    name: 'uid',
    nullable: true,
    length: 100,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  uid: string | null;

  @Column('text', { name: 'title', default: null, nullable: true })
  title: string | null;

  @Column('decimal', {
    name: 'order_number',
    precision: 20,
    scale: 10,
    nullable: true,
    default: 0.0
  })
  @ApiProperty({ example: 1 })
  order_number: number;

  @Column('double', {
    name: 'order_update_time',
    precision: 13,
    scale: 3,
    default: 0
  })
  order_update_time: number;

  @Column('double', {
    name: 'recent_date',
    nullable: true,
    precision: 13,
    scale: 3,
    default: () => 0,
  })
  recent_date: number;

  @Column('tinyint', {
    name: 'is_trashed',
    nullable: true,
    unsigned: true,
    default: () => 0,
  })
  is_trashed: number | null;
}
