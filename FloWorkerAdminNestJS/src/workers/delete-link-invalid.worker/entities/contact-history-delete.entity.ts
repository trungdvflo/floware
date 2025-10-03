import { Column, Entity } from 'typeorm';
import { ContactHistory } from './contact-history.entity';
import { DeleteEntity } from './delete.entity';

@Entity({ name: 'contact_history_deleted', synchronize: true })
export class ContactHistoryDelete extends ContactHistory {
  @Column('datetime', { nullable: false })
  deleted_date: Date;
}
