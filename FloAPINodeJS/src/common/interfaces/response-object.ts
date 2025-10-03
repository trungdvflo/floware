import { DeletedItem } from '../entities/deleted-item.entity';
import { RequestParamError } from './error-object';

export interface ResponseObject<T> {
  data: T[];
  data_del?: DeletedItem[];
  error?: RequestParamError<T>;
}