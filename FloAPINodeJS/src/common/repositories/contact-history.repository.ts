import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { ContactHistory } from '../entities/contact-history.entity';

@Injectable()
@CustomRepository(ContactHistory)
export class ContactHistoryRepository extends Repository<ContactHistory> {
  async isExist(e: ContactHistory){
    const res = await this.findOne({ where: {
      user_id: e.user_id,
      source_account_id: e.source_account_id,
      source_object_type: e.source_object_type,
      source_object_uid: e.source_object_uid,
      source_object_href: e.source_object_href,
      destination_account_id: e.destination_account_id,
      destination_object_type: e.destination_object_type,
      destination_object_uid: e.destination_object_uid,
      destination_object_href: e.destination_object_href,
      action: e.action,
      action_data: e.action_data,
      path: e.path,
      is_trashed: e.is_trashed
    }});
    return res?.id;
  }
}
