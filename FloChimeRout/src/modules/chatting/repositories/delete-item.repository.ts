import { Injectable } from '@nestjs/common';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { DeletedItem } from 'entities/deleted-item.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(DeletedItem)
export class DeleteItemRepository extends Repository<DeletedItem> {}
