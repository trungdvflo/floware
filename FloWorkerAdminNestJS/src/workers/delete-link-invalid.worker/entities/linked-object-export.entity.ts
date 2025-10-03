import { Column, Entity } from 'typeorm';
import { LinkedObject } from './linked-object.entity';

@Entity({ name: 'linked_object_exported', synchronize: true })
export class LinkedObjectExport extends LinkedObject {
  @Column('datetime', { nullable: false })
  export_date: Date;
}
