import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { Release } from '../entities/release.entity';

@Injectable()
@CustomRepository(Release)
export class ReleaseRepository extends Repository<Release> {

}
