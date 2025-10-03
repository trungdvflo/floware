import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { GroupsUser } from '../entities/group-user.entity';

@Injectable()
@CustomRepository(GroupsUser)
export class GroupsUserRepository extends Repository<GroupsUser> {

}
