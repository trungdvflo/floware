import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { DateCommon } from './date-common.entity';

@Index('idx_on_source', ['source_account_id','source_object_type','source_object_uid'], {})
@Index('idx_user_id', ['user_id'], {})
@Entity({ name: 'contact_history', synchronize : false })

export class ContactHistory extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: "int", name: "id", unsigned: true })
  id: number;

  @Column('tinyint', {
    name: 'is_trashed',
    width: 1,
    default: 0,
  })
  @ApiProperty({ example: 0 })
  is_trashed: number;

  @Column('bigint', { width: 20, name: "user_id" })
  user_id: number;

  @Column('bigint', { width: 20, name:'source_account_id', unsigned: true, nullable: true })
  source_account_id: number;

  @Column('bigint', { width: 20, unsigned: true, nullable: true })
  destination_account_id: number;

  @Column('text', { nullable: false })
  source_object_href: string;

  @Column('text', { nullable: false })
  destination_object_href: string;

  @Column('text', { nullable: false })
  action_data: string;

  @Column("tinyint", { width: 4 })
  action: number;

  @Column('varbinary', { length: 1000, nullable: true })
  source_object_uid: Buffer;

  @Column('varbinary', { length: 1000, nullable: true })
  destination_object_uid: Buffer | string;

  @Column('varbinary', { name:'source_object_type', length: 50, nullable: true})
  source_object_type: Buffer;

  @Column('varbinary', { length: 50, nullable: true })
  destination_object_type: Buffer | string;

  @Column('varchar', { length: 255 })
  path: string;
}