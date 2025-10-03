import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { COLLECTION_INSTANCE_MEMBER } from '../utils/typeorm.util';
import { DateCommon } from './date-common.entity';

@Entity({ name: COLLECTION_INSTANCE_MEMBER })
export class CollectionInstanceMember extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column('bigint', {
    name: 'collection_id',
    width: 20
  })
  collection_id: number;

  @Column('tinyint', { width: 1, default: 0, nullable: false})
  favorite: number;

  @Column("varchar", { length: 255, nullable: false })
  color: string;

  @Column('tinyint', { width: 1, default: 0, nullable: false})
  is_hide: number;

  @Column('double', {
    name: 'recent_time',
    precision: 13,
    scale: 3,
    nullable: true,
    default: 0,
  })
  recent_time: number;
}