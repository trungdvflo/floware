import { ApiProperty } from '@nestjs/swagger';
import {
    AfterInsert, BeforeUpdate, Column, Entity,
    Index, PrimaryGeneratedColumn
} from 'typeorm';
import { VARBINARY_STRING_TRANSFORMER } from '../transformers/varbinary-string.transformer';

@Index("idx_on_user_id_and_item_uid_and_item_type",
  ["user_id", "item_uid", "item_type"], {})
@Index("idx_on_user_id_and_item_type",
  ["user_id", "item_type"], {})
@Entity('deleted_item')
export class DeletedItem {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  @ApiProperty({ example: 100 })
  id: number;

  @Column('bigint', {
    name: 'user_id',
    width: 20,
    select: false,
  })
  user_id: number;

  @Column('bigint', {
    name: 'item_id',
    width: 20,
  })
  @ApiProperty({ example: 100 })
  item_id: number;

  @Column('varbinary', {
    name: 'item_uid',
    length: 1000,
    nullable: true,
    transformer: VARBINARY_STRING_TRANSFORMER,
  })
  @ApiProperty({ example: '0317f2ad-663b-48e5-a7d2-9d4dba074419@flodev.net'})
  item_uid: string;

  @Column('varbinary', {
    name: 'item_type',
    length: 50,
    nullable: false,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  // @ApiProperty({ example: DELETED_ITEM_TYPE.VTODO, enum: DELETED_ITEM_TYPE })
  item_type: string;

  @Column('tinyint', {
    name: 'is_recovery',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0, description: `
    0: Not recovered
    1: Recovered
  `})
  is_recovery: number;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
    default: () => 0,
  })
  @ApiProperty({ example: 1618486501.971 })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: true,
    default: null,
  })
  @ApiProperty({ example: 1618486501.971 })
  updated_date: number | null;

  @BeforeUpdate()
  updatedDates() {
    if(!this.updated_date){
      this.updated_date = new Date().getTime() / 1000;
    }
  }

  @AfterInsert()
  deleteUserId() {
    this.user_id = undefined;
  }
}
