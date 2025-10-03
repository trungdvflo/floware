import { AfterLoad, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';

@Entity({ name: NAME_ENTITY.CARD_CONTACT })
export class CardContactEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @Column('varchar', { name: 'uid', length: 255 })
  uid: string;

  @Column('int', { name: 'addressbookid', width: 11 })
  addressbookid: number;

  @Column('int', { name: 'card_id', width: 11, nullable: true })
  card_id: number | null;

  @Column('varchar', { name: 'uri', length: 255 })
  uri: string;

  @Column('varchar', { name: 'first_name', nullable: true, length: 255 })
  first_name: string | null;

  @Column('varchar', { name: 'last_name', nullable: true, length: 255 })
  last_name: string | null;

  @Column('varchar', { name: 'midle_name', nullable: true, length: 255 })
  midle_name: string | null;

  @Column('json', { name: 'email_address', nullable: true })
  email_address: any;

  @Column('varchar', { name: 'company', nullable: true, length: 255 })
  company: string | null;

  @Column('varchar', { name: 'title', nullable: true, length: 255 })
  title: string | null;

  @Column('text', { name: 'contact_avatar', nullable: true })
  contact_avatar: string | null;

  @Column('json', { name: 'phone', nullable: true })
  phone: any;

  @Column('json', { name: 'skype_call', nullable: true })
  skype_call: any;

  @Column('json', { name: 'skype_chat', nullable: true })
  skype_chat: any;

  @Column('tinyint', { name: 'vip', unsigned: true, default: () => 0 })
  vip: number;

  @Column('tinyint', { name: 'is_group', unsigned: true, default: () => 0 })
  is_group: number;

  @Column('tinyint', { name: 'trashed', unsigned: true, default: () => 0 })
  trashed: number;

  @AfterLoad()
  afterLoad() {
    this.uid = Buffer.from(this.uid).toString();
  }
}