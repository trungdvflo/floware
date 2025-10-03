import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { VARBINARY_STRING_TRANSFORMER } from '../transformers/varbinary-string.transformer';
import { SUGGESTED_COLLECTION } from '../utils/typeorm.util';
import { DateCommon } from './date-common.entity';

@Entity({ name: SUGGESTED_COLLECTION })
export class SuggestedCollection extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column('bigint', {
    name: 'collection_id',
    width: 20
  })
  collection_id: number;

  @Column('int', { width: 11, default: 0, nullable: false})
  criterion_type: number;

  @Column("text", {
    name: "criterion_value"
  })
  criterion_value: string;

  @Column("varchar", {
    name: "criterion_checksum",
    length: 32,
  })
  criterion_checksum: string;

  @Column('bigint', {
    name: 'frequency_used',
    width: 20
  })
  frequency_used: number;

  @Column('double', {
    name: 'action_time',
    precision: 13,
    scale: 3,
  })
  action_time: number;

  @Column('bigint', {
    name: 'account_id',
    width: 20
  })
  account_id: number;

  @Column("varbinary", {
    name: "third_object_uid",
    length: 1000,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  third_object_uid: string;

  @Column('tinyint', { width: 2, default: 0, nullable: false})
  third_object_type: number;

  @Column("varbinary", {
    name: "object_type",
    length: 50,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  object_type: string;

  @Column('bigint', {
    name: 'group_id',
    width: 20
  })
  group_id: number;
}