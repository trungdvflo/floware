import { VARBINARY_STRING_TRANSFORMER } from 'common/transformers/varbinary-string.transformer';
import { DELETED_ITEM_TABLE_NAME } from 'configs/typeorm.util';
import {
  AfterInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity(DELETED_ITEM_TABLE_NAME)
export class DeletedItem {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
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
  item_id: number;

  @Column('varbinary', {
    name: 'item_uid',
    length: 1000,
    nullable: true,
    transformer: VARBINARY_STRING_TRANSFORMER,
  })
  item_uid: string;

  @Column('varbinary', {
    name: 'item_type',
    length: 50,
    nullable: false,
    transformer: VARBINARY_STRING_TRANSFORMER,
  })
  // @ApiProperty({ example: DELETED_ITEM_TYPE.VTODO, enum: DELETED_ITEM_TYPE })
  item_type: string;

  @Column('tinyint', {
    name: 'is_recovery',
    width: 1,
    default: 0,
  })
  is_recovery: number;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
    default: () => 0,
  })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: true,
    default: null,
  })
  updated_date: number | null;

  @BeforeUpdate()
  updateDates() {
    if (!this.updated_date) {
      this.updated_date = new Date().getTime() / 1000;
    }
  }

  @AfterInsert()
  deleteUserId() {
    this.user_id = undefined;
  }
}
