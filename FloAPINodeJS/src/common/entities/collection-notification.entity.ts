import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EmailDTO } from '../dtos/email.dto';
import { LINK_OBJ_TYPE } from '../dtos/object-uid';
import { VARBINARY_STRING_TRANSFORMER } from '../transformers/varbinary-string.transformer';
import { DateCommon } from './date-common.entity';

@Entity({ name: 'collection_notification' })
export class CollectionNotificationEntity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id", unsigned: true })
  id: number;
  @Column('bigint', { name: 'collection_id', width: 20 })
  collection_id: number;
  @Column('varbinary', {
    name: 'object_uid',
    length: 1000, nullable: false
  })
  object_uid: Buffer | string;
  @Column('varbinary', {
    name: 'object_type', length: 50, nullable: false,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  object_type: LINK_OBJ_TYPE | string;
  @Column('text', { name: 'object_href', nullable: true, default: null, })
  object_href: string | null;
  @Column('int', { name: 'action' })
  action: number;
  @Column('double', { name: 'action_time', precision: 13, scale: 3, nullable: false })
  action_time: number;
  @Column('varchar', { name: 'content', length: 1000 })
  content: string;
  @Column('varchar', { name: 'email', length: 225 })
  email: string;
  @Column("text", { name: 'assignees', nullable: false })
  assignees: EmailDTO[] | string;

  owner_calendar_uri?: string;
  owner_username?: string;
  owner_user_id?: number;
  member_calendar_uri?: string;
  member_email?: string;
  member_user_id?: number;
}