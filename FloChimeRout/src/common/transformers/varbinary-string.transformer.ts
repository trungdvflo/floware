import { ValueTransformer } from 'typeorm';

export const VARBINARY_STRING_TRANSFORMER: ValueTransformer = {
  from: (db) => {
    if (db == null) return db;
    return Buffer.from(db || '').toString();
  },
  to: (entity) => {
    return entity;
  },
};

export const TRIM_STRING_TRANSFORMER = ({ value }) => typeof value === 'string' ? value.trim()
    : (value !== null ? value : undefined);
