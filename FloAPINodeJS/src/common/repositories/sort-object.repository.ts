import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { SortObject } from '../entities/sort-object.entity';

@Injectable()
@CustomRepository(SortObject)
export class SortObjectRepository extends Repository<SortObject> {}