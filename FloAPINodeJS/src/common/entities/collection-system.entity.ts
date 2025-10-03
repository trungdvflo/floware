import { Json } from 'aws-sdk/clients/marketplacecatalog';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SYSTEM_COLLECTION_TABLE_NAME } from '../utils/typeorm.util';
import { DateCommon } from './date-common.entity';

@Entity({ name: SYSTEM_COLLECTION_TABLE_NAME, synchronize : true })
export class SystemCollection extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { length: 255, nullable: false })
  name: string;

  @Column('tinyint', { width: 3, unsigned: true, nullable: false })
  type: number;

  @Column('json', {
    name: 'sub_filter',
    nullable: false,
  })
  sub_filter: Json;

  @Column('json', {
    name: 'local_filter',
    nullable: false,
  })
  local_filter: Json;

  @Column('tinyint', { width: 1, unsigned: true, nullable: false, default: 0 })
  is_default: number;

  @Column('tinyint', { width: 1, unsigned: true, nullable: true, default: 0 })
  enable_mini_month: number;

  @Column('tinyint', { width: 1, unsigned: true, nullable: true, default: 0 })
  enable_quick_view: number;

  @Column('tinyint', { width: 1, unsigned: false, nullable: true, default: 1 })
  show_mini_month: number;

  @Column("varchar", { length: 100, nullable: true, default: null })
  checksum: string;
}