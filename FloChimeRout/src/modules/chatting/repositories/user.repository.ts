import { Injectable } from '@nestjs/common';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { UsersEntity } from 'entities/users.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(UsersEntity)
export class UsersRepository extends Repository<UsersEntity> {}
