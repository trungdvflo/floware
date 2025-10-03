import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { DeletedItem } from '../entities/deleted-item.entity';

@Injectable()
@CustomRepository(DeletedItem)
export class DeletedItemRepository extends Repository<DeletedItem> {

}
