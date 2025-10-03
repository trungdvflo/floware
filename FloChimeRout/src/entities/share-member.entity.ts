import { MEMBER_TABLE_NAME } from 'configs/typeorm.util';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateCommon } from './date-common.entity';

@Entity({ name: MEMBER_TABLE_NAME })
export class ShareMemberEntity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column('bigint', { width: 20, name: "collection_id", nullable: false})
  collection_id: number;

  @Column("varchar", { length: 255, nullable: false })
  calendar_uri: string;

  @Column('tinyint', { width: 2, nullable: false})
  access: number;

  @Column('tinyint', { width: 1, nullable: false})
  shared_status: number;

  @Column("varchar", { length: 255, nullable: false })
  shared_email: string;

  @Column('bigint', { width: 20, name: "member_user_id", nullable: false })
  member_user_id: number;

  @Column("varchar", { length: 255, nullable: false })
  contact_uid: string;

  @Column('text', { nullable: false })
  contact_href: string;

  @Column('bigint', { width: 20, nullable: true, default:0 })
  account_id: number;
}