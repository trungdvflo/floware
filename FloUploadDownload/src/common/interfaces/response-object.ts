import { RequestParamError } from './error-object';

export interface ResponseObject<T> {
  data: T[];
  error?: RequestParamError<T>;
}