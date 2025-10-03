import { JsonTransformer } from '@anchan828/typeorm-transformers';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { OBJ_TYPE } from '../constants/common';
import { EmailDTO } from '../dtos/email.dto';
import { Email365ObjectId, EmailObjectId, GENERAL_OBJ, GeneralObjectId, GmailObjectId } from '../dtos/object-uid';

@Entity({ name: 'metadata_email' })
export class MetadataEmail {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  @ApiProperty({ example: 1 })
  id: number;

  @Column('bigint', {
    name: 'user_id',
    width: 20,
    select: false
  })
  user_id: number;

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
    if (this.object_uid_buf) {
      try {
        if (this.object_type === OBJ_TYPE.EMAIL) {
          return new EmailObjectId({ emailBuffer: this.object_uid_buf });
        } else if (this.object_type === OBJ_TYPE.GMAIL) {
          return new GmailObjectId({ encryptedGmailIdBuf: this.object_uid_buf });
        } else if (this.object_type === OBJ_TYPE.EMAIL365) {
          return new Email365ObjectId({ encryptedIdBuf: this.object_uid_buf });
        } else {
          return new GeneralObjectId({ uidBuffer: this.object_uid_buf }, this.object_type);
        }
      } catch (error) {
        return null;
      }
    } else return null;
  }

  set mapped_object_uid(value: Email365ObjectId | GmailObjectId | EmailObjectId | GeneralObjectId) {
    this.object_uid_buf = value.objectUid;
  }

  @ApiProperty({ example: { "uid": 123, "path": "INBOX" } })
  get object_uid(): string | object {
    if (this.object_uid_buf) {
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
      } else return this.object_uid_buf.toString();
    } else return this.object_uid_buf;
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

  @Column('varchar', {
    name: 'subject',
    length: 2000
  })
  @ApiProperty({ example: 'Sample subject' })
  subject: string;

  @Column('json', {
    name: 'from',
    transformer: new JsonTransformer<EmailDTO[]>(),
  })
  from: EmailDTO[];

  @Column('varchar', {
    name: 'message_id',
    length: 255
  })
  @ApiProperty({ example: 'aaa' })
  message_id: string;

  @Column('json', {
    name: 'to',
    transformer: new JsonTransformer<EmailDTO[]>(),
  })
  to: EmailDTO[];

  @Column('json', {
    name: 'cc',
    transformer: new JsonTransformer<EmailDTO[]>(),
  })
  cc: EmailDTO[] | null;

  @Column('json', {
    name: 'bcc',
    transformer: new JsonTransformer<EmailDTO[]>(),
  })
  bcc: EmailDTO[] | null;

  @Column('double', {
    name: 'received_date',
    precision: 13,
    scale: 3,
    nullable: true,
  })
  @ApiProperty({ example: 1617932931.247 })
  received_date: number | null;

  @Column('double', {
    name: 'sent_date',
    precision: 13,
    scale: 3,
    nullable: true,
  })
  @ApiProperty({ example: 1617932931.247 })
  sent_date: number | null;

  @Column('text', {
    name: 'snippet',
  })
  @ApiProperty({ example: 'Sample Snippet' })
  snippet: string;

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