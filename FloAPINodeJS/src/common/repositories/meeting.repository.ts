import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { ConferenceNonUserEntity } from '../entities/conference-non-user.entity';

@Injectable()
@CustomRepository(ConferenceNonUserEntity)
export class MeetingRepository extends Repository<ConferenceNonUserEntity> {}
