import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { SaltEntity } from '../entities/salt.entity';

@Injectable()
@CustomRepository(SaltEntity)
export class SaltRepository extends Repository<SaltEntity> {}
