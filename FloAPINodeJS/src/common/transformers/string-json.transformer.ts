import { ValueTransformer } from 'typeorm';

export const STRING_JSON_TRANSFORMER: ValueTransformer = {
    from: db => {
        try {
            return JSON.parse(db);
        } catch (e) {
            throw e;
        }
    },
    to: entity => {
        return entity;
    }
};

export const THIRD_PARTY_TRANSFORMER_JSON: ValueTransformer = {
    from: db => {
      try{
        return JSON.parse(db);
      } catch(e){
        return db;
      }
    },
    to: dto => JSON.stringify(dto)
  };