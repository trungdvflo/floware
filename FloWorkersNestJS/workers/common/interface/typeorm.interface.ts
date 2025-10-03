
export interface GetOptionInterface<T> {
  fields: (keyof T)[];
  conditions?: object;
  order?: object;
}