import { ValueTransformer } from 'typeorm';

export enum CALDAV_OBJ_TYPE {
  VJOURNAL = 'VJOURNAL',
  VTODO = 'VTODO',
  VEVENT = 'VEVENT'
}

export const SUB_TYPE = {
  YEARLY: 'Yearly',
  MONTHLY: 'Monthly',
}

export const VARBINARY_STRING_TRANSFORMER: ValueTransformer = {
  from: (db) => {
    if (db == null) return db;
    return Buffer.from(db || '').toString();
  },
  to: (entity) => {
    return entity;
  }
};
