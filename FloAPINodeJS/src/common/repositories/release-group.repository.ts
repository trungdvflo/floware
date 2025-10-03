import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { ReleasesGroup } from '../entities/releases-groups.entity';

@Injectable()
@CustomRepository(ReleasesGroup)
export class ReleasesGroupRepository extends Repository<ReleasesGroup> {

}
