import { Column, Entity } from 'typeorm';
import { LinkedObject } from './linked-object.entity';

@Entity({ name: 'linked_object_deleted', synchronize: true })
export class LinkedObjectDelete extends LinkedObject {
  @Column('datetime', { nullable: false })
  deleted_date: Date;
}
