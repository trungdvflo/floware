import { Injectable } from '@nestjs/common';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { MeetingActivitiesEntity } from 'entities/meeting_activities.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(MeetingActivitiesEntity)
export class MeetingActivitiesRepository extends Repository<MeetingActivitiesEntity> {}