import { ErrorDTO } from 'common/utils/respond';

export class IDataSingleRespond {
  public data?: {};
  public error?: {};
}

export class SingleError {
  error: ErrorDTO;

  constructor(err: any, statusCode?: any) {
    this.error = new ErrorDTO(err, statusCode);
  }
}

export interface IDataRespond {
  data?: any[];
  errors?: any[];
}
