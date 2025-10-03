import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { ReleasesUser } from '../entities/releases-user.entity';

@Injectable()
@CustomRepository(ReleasesUser)
export class ReleasesUserRepository extends Repository<ReleasesUser> {

}
