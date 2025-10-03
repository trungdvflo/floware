import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

// unique
@Index('uri_principaluri', ['uri', 'principaluri'])
@Entity('addressbooks')
export class AddressBooks extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column('varchar', { length: 255 })
  principaluri: string;

  @Column({ length: 255 })
  displayname: string;

  @Column({ length: 200 })
  uri: string;

  @Column('text')
  description: string;

  @Column('int', { width: 11 })
  synctoken: number;
}
