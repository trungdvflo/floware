import { Column, Entity } from 'typeorm';
import { ContactHistory } from './contact-history.entity';

@Entity({ name: 'contact_history_exported', synchronize: true })
export class ContactHistoryExport extends ContactHistory {
  @Column('datetime', { nullable: false })
  export_date: Date;
}
