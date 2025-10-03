import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { CommonEntity } from './common.entity';
@Index('user_id', ['user_id'], {})
@Index('title', ['title'], { fulltext: true })
@Index('url', ['url'], { fulltext: true })
@Entity(NAME_ENTITY.URL)
export class UrlEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('int', { name: 'user_id', unsigned: true })
  user_id: number;

  @Column('text', { name: 'url', nullable: true })
  url: string | null;

  @Column('varbinary', { name: 'uid', nullable: true, length: 100 })
  uid: Buffer;

  @Column('text', { name: 'title', nullable: true })
  title: string | null;

  @Column({ type: 'decimal', name: 'order_number', precision: 20, scale: 10, default: 0 })
  order_number: number;

  @Column('double', {
    name: 'order_update_time',
    precision: 13,
    scale: 3,
    default: 0
  })
  order_update_time: number;

  @Column('tinyint', {
    name: 'is_trashed',
    nullable: true,
    unsigned: true,
    default: () => '\'0\'',
  })
  is_trashed: number | null;
}
