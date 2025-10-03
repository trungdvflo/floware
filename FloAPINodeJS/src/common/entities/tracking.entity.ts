import { JsonTransformer } from '@anchan828/typeorm-transformers';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { OBJ_TYPE, TRACKING_STATUS } from '../constants/common';
import { EmailDTO } from '../dtos/email.dto';
import { Email365ObjectId, EmailObjectId, GENERAL_OBJ, GeneralObjectId, GmailObjectId } from '../dtos/object-uid';

@Entity({ name: 'email_tracking' })
export class Tracking {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  @ApiProperty({ example: 1 })
  id?: number;

  @Column('bigint', {
    name: 'user_id',
    width: 20,
    select: false
  })
  user_id: number;

  @Column('varchar', {
    name: 'message_id',
    default: '',
    length: 255
  })
  @ApiProperty({ example: "123" })
  message_id: string;

  @Column('bigint', {
    name: 'account_id',
    width: 20,
    default: 0
  })
  @ApiProperty({ example: 1 })
  account_id: number;

  @Column('varbinary', {
    name: 'object_uid',
    length: 1000
  })
  @Exclude()
  object_uid_buf: Buffer;

  @Exclude()
  get mapped_object_uid(): Email365ObjectId | GmailObjectId | EmailObjectId | GeneralObjectId {
    switch (this.object_type) {
      case OBJ_TYPE.EMAIL:
        return new EmailObjectId({ emailBuffer: this.object_uid_buf });
      case OBJ_TYPE.GMAIL:
        return new GmailObjectId({ encryptedGmailIdBuf: this.object_uid_buf });
      case OBJ_TYPE.EMAIL365:
        return new Email365ObjectId({ encryptedIdBuf: this.object_uid_buf });
      default:
        return new GeneralObjectId({ uidBuffer: this.object_uid_buf }, this.object_type);
    }
  }

  set mapped_object_uid(value: Email365ObjectId | GmailObjectId | EmailObjectId | GeneralObjectId) {
    this.object_uid_buf = value.objectUid;
  }

  @ApiProperty({ example: { "uid": 123, "path": "INBOX" } })
  get object_uid(): string | object {
    if (this.mapped_object_uid && this.object_uid_buf) {
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
  }

  @Column('varbinary', {
    name: 'object_type',
    length: 50,
    transformer: {
      from(value: Buffer) {
        if (!value) {
          return;
        }
        return value.toString();
      },
      to(value: string) {
        if (!value) {
          return;
        }
        return Buffer.from(value);
      }
    }
  })
  @ApiProperty({ example: 'EMAIL' })
  object_type: OBJ_TYPE.EMAIL | OBJ_TYPE.GMAIL | OBJ_TYPE.EMAIL365 | GENERAL_OBJ;

  @Column('json', {
    name: 'emails',
    transformer: new JsonTransformer<EmailDTO[]>(),
  })
  emails: EmailDTO[] | null;

  @Column('varchar', {
    name: 'subject',
    length: 2000
  })
  @ApiProperty({ example: 'Sample Subject' })
  subject: string;

  @Column("enum", {
    name: "status",
    enum: [TRACKING_STATUS.WAITING, TRACKING_STATUS.REPLIED, TRACKING_STATUS.LATE],
    default: TRACKING_STATUS.WAITING
  })
  @ApiProperty({ example: 0 })
  status: TRACKING_STATUS.WAITING | TRACKING_STATUS.REPLIED | TRACKING_STATUS.LATE;

  @Column('double', {
    name: 'time_send',
    precision: 13,
    scale: 3,
    nullable: true,
    default: 0,
  })
  @ApiProperty({ example: 1617932931.247 })
  time_send: number;

  @Column('double', {
    name: 'time_tracking',
    precision: 13,
    scale: 3,
    nullable: true,
    default: 0,
  })
  @ApiProperty({ example: 1617932931.247 })
  time_tracking: number | null;

  @Column('double', {
    name: 'replied_time',
    precision: 13,
    scale: 3,
    nullable: true,
    default: 0,
  })
  @ApiProperty({ example: 1617932931.247 })
  replied_time: number | null;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
  })
  @ApiProperty({ example: 1617932931.247 })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: true,
  })
  @ApiProperty({ example: 1617932931.247 })
  updated_date: number | null;
}