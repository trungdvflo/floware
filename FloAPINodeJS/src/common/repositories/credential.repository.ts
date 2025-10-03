import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { CredentialEntity } from '../entities/credential.entity';

@Injectable()
@CustomRepository(CredentialEntity)
export class CredentialRepository extends Repository<CredentialEntity> {}
