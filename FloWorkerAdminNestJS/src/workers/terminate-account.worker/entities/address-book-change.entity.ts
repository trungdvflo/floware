import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('addressbookchanges')
export class AddressBookChange {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column('int', { width: 11 })
  addressbookid: number;
}
