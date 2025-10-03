import { Column, Entity } from 'typeorm';
import { LinkedCollectionObject } from './linked-collection-object.entity';

@Entity({ name: 'linked_collection_object_exported', synchronize: true })
export class LinkedCollectionObjectExport extends LinkedCollectionObject {
  @Column('datetime', { nullable: false })
  export_date: Date;
}
