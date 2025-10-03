import { ValueTransformer } from 'typeorm';

export const TRANSFORMER_JSON: ValueTransformer = {
  from: db => JSON.parse(db),
  to: dto => JSON.stringify(dto)
};

export const TRANSFORMER_DATE_DOUBLE: ValueTransformer = {
  from: db => db,
  to: dto => {
    return dto || new Date().getTime() / 1000;
  }
};