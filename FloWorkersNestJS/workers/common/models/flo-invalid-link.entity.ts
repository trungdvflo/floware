import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'flo_invalid_link' })
export class FloInvalidLinkEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('bigint', { name: 'link_id' })
  link_id: number;

  @Column('varchar', { length: 45, name: 'link_type' })
  link_type: string;

  @Column('varbinary', { length: 50, name: 'object_type' })
  object_type: Buffer;

  @Column('varbinary', { length: 1000, name: 'object_uid' })
  object_uid: Buffer;

  @Column('bigint', { name: 'user_id' })
  user_id: string;

  @Column('double', { precision: 13, scale: 3, name: 'checked_date' })
  checked_date: number;

  @Column('double', { precision: 13, scale: 3, name: 'created_date' })
  created_date: number;

  @Column('double', { precision: 13, scale: 3, name: 'updated_date' })
  updated_date: number;

  @Column('double', { precision: 13, scale: 3, name: 'deleted_date', nullable: true })
  deleted_date: number | null;

  @Column('tinyint', { name: 'is_processing' })
  is_processing: number;

  @Column('tinyint', { name: 'considering' })
  considering: number;
}
