export class ErrorDTO {
  statusCode: number;
  message: string;
  code: string;
  attributes: string;

  constructor(err: any, statusCode?: any) {
    if (statusCode) {
      this.statusCode = statusCode;
    } else {
      this.statusCode = err.statusCode;
    }
    this.message = err.message;
    this.code = err.code;
    this.attributes = err.attributes;
  }
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
interface IRequestParam {
  data?: object;
  code?: number;
  message?: string | [];
  attributes?: object;
}

export function buildRespondSuccess(code: number, message: string) {
  return {
    code,
    message,
  };
}

export const buildItemResponseFail = (code: string, message: string, attributes = null) => {
  return {
    code,
    message,
    attributes,
  };
};

export const buildFailItemResponse = (code: number, message: string) => {
  return {
    code,
    message,
  };
};

export function buildSingleResponseErr(code: number, message: string | any[], attributes = null) {
  return {
    data: {},
    error: {
      code,
      message,
      attributes,
    },
  };
}

export class ResponseMutiData {
  data: [];
  error?: {};

  constructor(data, errors) {
    this.data = data;
    if (errors && errors.length > 0) {
      this.error = {
        errors,
      };
    }
  }
}

export class MultipleRespond {
  private readonly reqParam: IDataRespond;

  constructor(req: IDataRespond) {
    this.reqParam = req;
  }

  public multipleRespond() {
    const respondData = Object.assign(
      {},
      { data: this.reqParam.data },
      this.reqParam.errors ? { error: { errors: this.reqParam.errors } } : null
    );
    return respondData;
  }
}
