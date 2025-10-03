import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CalendarObjects } from '../entities/calendar-objects.entity';
import { Calendar } from '../entities/calendar.entity';

@Injectable()
export class CalendarRepository extends Repository<Calendar> {

}

@Injectable()
export class CalendarObjectsRepository extends Repository<CalendarObjects> {

}
