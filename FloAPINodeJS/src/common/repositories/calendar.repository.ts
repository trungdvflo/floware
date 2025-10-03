import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CalendarInstance } from '../entities/calendar-instances.entity';
import { Calendar } from '../entities/calendar.entity';

@Injectable()
export class CalendarRepository extends Repository<Calendar> {

}

@Injectable()
export class CalendarInstanceRepository extends Repository<CalendarInstance> {

}
