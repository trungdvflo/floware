import { Expose } from 'class-transformer';
import { IsDefined, IsEnum, IsNotEmpty } from 'class-validator';
import {
  EMAIL_SUBFILTER_FILTER,
  EMAIL_SUBFILTER_SORTBY,
  EVENT_SUBFILTER_FILTER
} from '../constants';

export class EmaiSubfliterDTO {
  @IsEnum(EMAIL_SUBFILTER_FILTER)
  @Expose()
  filter: number;

  @IsEnum(EMAIL_SUBFILTER_SORTBY)
  @Expose()
  sort_by: number;
}

export class EventSubfliterDTO {
  @IsEnum(EVENT_SUBFILTER_FILTER)
  @Expose()
  filter: number;
}

export class EmailSystemCollectionDTO {
  @IsNotEmpty()
  @IsDefined()
  @Expose()
  email: EmaiSubfliterDTO;

  constructor(partial?: Partial<EmailSystemCollectionDTO>) {
    Object.assign(this, partial);
  }
}

export class CalendarSystemCollectionDTO {
  @IsNotEmpty()
  @IsDefined()
  @Expose()
  event: EventSubfliterDTO;

  constructor(partial?: Partial<CalendarSystemCollectionDTO>) {
    Object.assign(this, partial);
  }
}

export class TodoSystemCollectionDTO {
  @IsNotEmpty()
  @IsDefined()
  @Expose()
  todo: EventSubfliterDTO;

  constructor(partial?: Partial<TodoSystemCollectionDTO>) {
    Object.assign(this, partial);
  }
}

export class ContactSystemCollectionDTO {
  @IsNotEmpty()
  @IsDefined()
  @Expose()
  contact: EventSubfliterDTO;

  constructor(partial?: Partial<ContactSystemCollectionDTO>) {
    Object.assign(this, partial);
  }
}

export class NoteSystemCollectionDTO {
  @IsNotEmpty()
  @IsDefined()
  @Expose()
  note: EventSubfliterDTO;

  constructor(partial?: Partial<NoteSystemCollectionDTO>) {
    Object.assign(this, partial);
  }
}

export class WebsitetSystemCollectionDTO {
  @IsNotEmpty()
  @IsDefined()
  @Expose()
  website: EventSubfliterDTO;

  constructor(partial?: Partial<WebsitetSystemCollectionDTO>) {
    Object.assign(this, partial);
  }
}

export class FileSystemCollectionDTO {
  @IsNotEmpty()
  @IsDefined()
  @Expose()
  file: EventSubfliterDTO;

  constructor(partial?: Partial<FileSystemCollectionDTO>) {
    Object.assign(this, partial);
  }
}

export class OrganizerSystemCollectionDTO {
  @IsNotEmpty()
  @IsDefined()
  email: EventSubfliterDTO;

  @IsNotEmpty()
  @IsDefined()
  event: EventSubfliterDTO;

  @IsNotEmpty()
  @IsDefined()
  todo: EventSubfliterDTO;

  @IsNotEmpty()
  @IsDefined()
  note: EventSubfliterDTO;

  @IsNotEmpty()
  @IsDefined()
  contact: EventSubfliterDTO;

  @IsNotEmpty()
  @IsDefined()
  website: EventSubfliterDTO;

  @IsNotEmpty()
  @IsDefined()
  file: EventSubfliterDTO;

  constructor(partial?: Partial<OrganizerSystemCollectionDTO>) {
    Object.assign(this, partial);
  }
}