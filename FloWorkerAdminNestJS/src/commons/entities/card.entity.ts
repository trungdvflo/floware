import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { VARBINARY_STRING_TRANSFORMER } from '../constants/constant';

// unique
@Index('addressbookid', ['addressbookid'], { unique: true })
@Index('uri', ['uri'], { unique: true })
@Index('carddata', ['carddata'], { unique: true })
@Entity('cards')
export class Card extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column('int', { width: 11 })
  addressbookid: number;

  @Column('longtext')
  carddata: string;

  @Column({ length: 200 })
  uri: string;

  @Column('int', { width: 11 })
  lastmodified: number;

  @Column('varbinary', { length: 32, transformer: VARBINARY_STRING_TRANSFORMER })
  etag: string;

  @Column('int', { width: 11 })
  size: number;
}
