import { Column, Entity } from 'typeorm';
import { LinkedCollectionObject } from './linked-collection-object.entity';

@Entity({ name: 'linked_collection_object_deleted', synchronize: true })
export class LinkedCollectionObjectDelete extends LinkedCollectionObject {
  @Column('datetime', { nullable: false })
  deleted_date: Date;
}
