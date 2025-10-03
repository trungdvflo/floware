import { JsonTransformer } from '@anchan828/typeorm-transformers';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  ConditionsDto, DestinationsDto
} from '../../modules/manual-rule/dtos/manual-rule.post.dto';
import { IS_TRASHED } from '../constants';
import { RULE_TABLE_NAME } from '../utils/typeorm.util';
import { DateCommon } from './date-common.entity';

@Entity({ name: RULE_TABLE_NAME, synchronize: true })
export class RuleEntity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { length: 255, nullable: false })
  name: string;

  @Column('tinyint', { width: 1, unsigned: true, nullable: false })
  match_type: number;

  @Column('decimal', {
    name: 'order_number',
    precision: 20,
    scale: 10,
    nullable: true,
    default: 0.0000000000
  })
  order_number: number;

  @Column('tinyint', { width: 1, unsigned: true, nullable: false, default: 0 })
  is_enable: number;

  @Column('tinyint', {
    name: 'is_trashed',
    width: 1,
    default: 0,
  })
  is_trashed: IS_TRASHED;

  @Column('tinyint', { width: 1, unsigned: true, nullable: false, default: 1 })
  apply_all: number;

  @Column('bigint', { width: 20, unsigned: true, nullable: true, default: 0 })
  account_id: number;

  @Column('json', {
    name: 'conditions',
    nullable: true,
    transformer: new JsonTransformer<ConditionsDto[]>(),
  })
  conditions: ConditionsDto[];

  @Column('json', {
    name: 'destinations',
    nullable: true,
    transformer: new JsonTransformer<DestinationsDto[]>(),
  })
  destinations: DestinationsDto[];
}