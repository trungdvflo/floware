import { Injectable } from '@nestjs/common';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { ConferenceNonUserEntity } from 'entities/conference_non_user.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(ConferenceNonUserEntity)
export class MeetingRepository extends Repository<ConferenceNonUserEntity> {}