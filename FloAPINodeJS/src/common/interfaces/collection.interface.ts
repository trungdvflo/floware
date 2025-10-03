import { Collection } from "../entities/collection.entity";

export interface CollectionOptionsInterface {
  fields: (keyof Collection)[];
  conditions?: object;
}

export interface GetOptionInterface<T> {
  fields: (keyof T)[];
  conditions?: object;
}