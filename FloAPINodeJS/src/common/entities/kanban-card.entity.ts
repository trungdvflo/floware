import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  Column, Entity, Index, PrimaryGeneratedColumn
} from 'typeorm';
import { OBJ_TYPE } from '../constants/common';
import {
  Email365ObjectId, EmailObjectId,
  GENERAL_OBJ, GENERAL_OBJ_TYPE_ARRAY,
  GeneralObjectId,
  GmailObjectId
} from '../dtos/object-uid';
import { CANVAS_TABLE_NAME } from '../utils/typeorm.util';
import { DateCommon } from './date-common.entity';

@Index('user_id_and_kanban_id_and_order_number',
  ['user_id', 'kanban_id', 'order_number'])
@Entity(CANVAS_TABLE_NAME)
export class KanbanCard extends DateCommon {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  @ApiProperty({ example: 100 })
  id: number;

  @Column('bigint', {
    name: 'user_id',
    width: 20,
    select: false
  })
  user_id: number;

  @Column('varbinary', {
    name: 'object_uid',
    length: 1000
  })
  @Exclude()
  object_uid_buf: Buffer;

  @Exclude()
  get mapped_object_uid(): Email365ObjectId | GmailObjectId | EmailObjectId | GeneralObjectId {
    if (!this.object_uid_buf) return;

    switch (this.object_type) {
      case OBJ_TYPE.EMAIL:
        return new EmailObjectId({ emailBuffer: this.object_uid_buf });
      case OBJ_TYPE.GMAIL:
        return new GmailObjectId({ encryptedGmailIdBuf: this.object_uid_buf });
      case OBJ_TYPE.EMAIL365:
        return new Email365ObjectId({ encryptedIdBuf: this.object_uid_buf });
      default:
        if (GENERAL_OBJ_TYPE_ARRAY.includes(this.object_type)) {
          return new GeneralObjectId({ uidBuffer: this.object_uid_buf }, this.object_type);
        }
    }
  }

  set mapped_object_uid(value: Email365ObjectId | GmailObjectId | EmailObjectId | GeneralObjectId) {
    this.object_uid_buf = value.objectUid;
  }

  // object_uid: string | object;
  @ApiProperty({ example: 100 })
  @Expose()
  get object_uid(): string | object {
    if (!this.mapped_object_uid) return;
    if (this.mapped_object_uid instanceof EmailObjectId) {
      return {
        uid: this.mapped_object_uid.uid,
        path: this.mapped_object_uid.path
      };
    } else if (this.mapped_object_uid instanceof GmailObjectId) {
      return this.mapped_object_uid.id;
    } else if (this.mapped_object_uid instanceof Email365ObjectId) {
      return this.mapped_object_uid.id;
    } else if (this.mapped_object_uid instanceof GeneralObjectId) {
      return this.mapped_object_uid.uid;
    }
  }

  @Column('varbinary', {
    name: 'object_type',
    length: 50,
    transformer: {
      from(value: Buffer) {
        if (!value) return;
        return value.toString();
      },
      to(value: string) {
        if (!value) return;
        return Buffer.from(value);
      }
    }
  })
  @ApiProperty({ example: 'VTODO' })
  object_type: OBJ_TYPE.EMAIL | OBJ_TYPE.GMAIL | OBJ_TYPE.EMAIL365 | GENERAL_OBJ;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
  })
  @ApiProperty({ example: 1618486501.971 })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3
  })
  @ApiProperty({ example: 1618486501.971 })
  updated_date: number | null;

  @Column('int', {
    name: 'item_card_order',
    width: 11,
    default: 0
  })
  @ApiProperty({ example: -1 })
  item_card_order: number;

  @Column('bigint', {
    name: 'kanban_id',
    width: 20,
  })
  @ApiProperty({ example: 100 })
  kanban_id: number;

  @Column('int', {
    name: 'account_id',
    width: 11,
    default: 0,
  })
  @ApiProperty({ example: 0 })
  account_id: number;

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
    nullable: true,
    default: null,
  })
  @ApiProperty({ example: 1618486501.812 })
  order_update_time: number | null;

  @Column('text', {
    name: 'object_href',
  })
  @ApiProperty({ example: '/calendarserver.php/calendars/nghiale@flodev.net/f23de3b0-ecce-0137-541d-0242ac130004/' })
  object_href: string;

  @Column('tinyint', {
    name: 'is_trashed',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0 })
  is_trashed: number;

  @Column('double', {
    name: 'recent_date',
    precision: 13,
    scale: 3,
    nullable: false,
    default: 0,
  })
  @ApiProperty({ example: 1618486501.971 })
  recent_date: number;
}