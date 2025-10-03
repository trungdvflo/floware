import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity, PrimaryGeneratedColumn
} from 'typeorm';
import { COLLECTION_ICON_TABLE_NAME } from '../../common/utils/typeorm.util';

@Entity({ name: COLLECTION_ICON_TABLE_NAME })
export class CollectionIconEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  @ApiProperty({ example: 100, description: 'Unique ID record' })
  id: number;

  @Column('varchar', {
    name: 'shortcut',
    length: 255,
    default: ''
  })
  shortcut: string;

  @Column('text', { nullable: false })
  cdn_url: string;

  @Column('tinyint', {
    name: 'icon_type',
    width: 1,
    default: 0,
  })
  icon_type: number;

  @Column('varchar', {
    name: 'description',
    length: 255
  })
  description: string;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: true,
    default: 0,
  })
  updated_date: number;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
    default: 0,
  })
  created_date: number;
}