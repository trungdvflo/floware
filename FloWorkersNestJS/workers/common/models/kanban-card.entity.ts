import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { OBJ_TYPE } from '../constants/sort-object.constant';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { EmailObjectId, GeneralObjectId, GENERAL_OBJ, GmailObjectId } from '../dtos/object-uid';
import { CommonEntity } from './common.entity';

@Entity({ name: NAME_ENTITY.KANBAN_CARD })
export class KanbanCardEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column('varbinary', {
    name: 'object_uid',
    length: 1000
  })
  @Exclude()
  object_uid_buf: Buffer;

  @Exclude()
  get mapped_object_uid(): GmailObjectId | EmailObjectId | GeneralObjectId {
    if(this.object_type === OBJ_TYPE.EMAIL) {
      return new EmailObjectId({ emailBuffer: this.object_uid_buf });
    } else if(this.object_type === OBJ_TYPE.GMAIL) {
      return new GmailObjectId({ encryptedGmailIdBuf: this.object_uid_buf });
    } else {
      return new GeneralObjectId({ uidBuffer: this.object_uid_buf },
        this.object_type as GENERAL_OBJ);
    }
  }

  set mapped_object_uid(value: GmailObjectId | EmailObjectId | GeneralObjectId) {
    this.object_uid_buf = value.objectUid;
  }

  get object_uid(): string | object {
    if(this.mapped_object_uid) {
      if(this.mapped_object_uid instanceof EmailObjectId) {
        return {
          uid: this.mapped_object_uid.uid,
          path: this.mapped_object_uid.path
        };
      } else if(this.mapped_object_uid instanceof GmailObjectId) {
        return this.mapped_object_uid.id;
      } else if(this.mapped_object_uid instanceof GeneralObjectId) {
        return this.mapped_object_uid.uid;
      }
    }
  }

  @Column('varbinary', {
    name: 'object_type',
    length: 50,
    transformer: {
      from(value: Buffer) {
        if(!value) return;
        return value.toString();
      },
      to(value: string) {
        if(!value) return;
        return Buffer.from(value);
      }
    }
  })
  object_type: string;

  @Column('bigint', {
    name: 'kanban_id',
    width: 20,
  })
  kanban_id: number;

  @Column('bigint', {
    name: 'account_id',
    width: 20,
    default: 0,
  })
  account_id: number;

  @Column('decimal', {
    name: 'order_number',
    precision: 20,
    scale: 10,
    nullable: true,
    default: 0.0
  })
  order_number: number;

  @Column('double', {
    name: 'order_update_time',
    precision: 13,
    scale: 3,
    nullable: true,
    default: null,
  })
  order_update_time: number | null;

  @Column('text', {
    name: 'object_href',
  })
  object_href: string;

  @Column('tinyint', {
    name: 'is_trashed',
    width: 1,
    default: 0,
  })
  is_trashed: number;
}