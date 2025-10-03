import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { VARBINARY_STRING_TRANSFORMER } from '../utils/varbinary-string.transformer';
import { CommonEntity } from './common.entity';

@Entity({ name: NAME_ENTITY.CONTACT_HISTORY})
export class ContactHistoryEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', { type: "int", name: "id", unsigned: true })
  id: number;

  @Column('bigint', { width: 20, name: 'source_account_id', unsigned: true })
  source_account_id: number;

  @Column('bigint', { width: 20, unsigned: true })
  destination_account_id: number;

  @Column('text', { nullable: false })
  source_object_href: string;

  @Column('text', { nullable: false })
  destination_object_href: string;

  @Column('text', { nullable: false })
  action_data: string;

  @Column("tinyint", { width: 4 })
  action: number;

  @Column('varbinary', {
    length: 1000,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  source_object_uid: Buffer;

  @Column('varbinary', {
    length: 1000,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  destination_object_uid: Buffer;

  @Column('varbinary', {
    name: 'source_object_type', length: 50,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  source_object_type: string;

  @Column('varbinary', {
    length: 50,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  destination_object_type: string;

  @Column('varchar', { length: 255 })
  path: string;

  @Column('tinyint', {
    name: 'is_trashed',
    nullable: true,
    unsigned: true,
    default: 0,
  })
  is_trashed: number;
}