import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SORT_OBJECT_TYPE } from '../../modules/sort-object/sort-object.constant';
import { VARBINARY_STRING_TRANSFORMER } from '../transformers/varbinary-string.transformer';
import { DateCommon } from './date-common.entity';

@Entity({ name: 'sort_object' })
export class SortObject extends DateCommon {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column('varbinary', {
    length: 1000,
    nullable: false,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  object_uid: string;

  @Column('varchar', {
    length: 50,
    nullable: false,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  object_type: SORT_OBJECT_TYPE;

  @Column('text', {
    nullable: true,
    default: null,
  })
  object_href: string;

  @Column('decimal', {
    name: 'order_number',
    precision: 32,
    scale: 16,
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
  @ApiProperty({ example: 1618486501.812 })
  order_update_time: number;

  @Column('bigint', {
    name: 'account_id',
    width: 20,
    unsigned: true,
    default: 0
  })
  account_id: number;
}
