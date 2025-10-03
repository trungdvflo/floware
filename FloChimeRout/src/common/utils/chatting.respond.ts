import {
  IDataRespond,
  IDataSingleRespond,
} from 'common/interfaces/respond.interface';

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

export function buildRespondSuccess(code: number, message: string) {
  return {
    code,
    message,
  };
}

export const buildItemResponseFail = (
  code: string,
  message: string,
  attributes = null,
) => {
  return {
    code,
    message,
    attributes,
  };
};
export const buildFailItemResponses = (code, message, dto = null) => {
  const attributes = { ...dto };
  if (!!dto && !!dto.object_uid && typeof dto.object_uid === 'object') {
    try {
      attributes.object_uid = dto.object_uid.getPlain();
    } catch {
      attributes.object_uid = dto.object_uid;
    }
  }
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

export function buildSingleResponseErr(
  code: number,
  message: string | any[],
  attributes = null,
) {
  return {
    data: {},
    error: {
      code,
      message,
      attributes,
    },
  };
}
export class SingleRespond {
  private readonly reqParam: IDataSingleRespond;

  constructor(req: IDataSingleRespond) {
    this.reqParam = req;
  }

  public singleData() {
    const respondData = Object.assign(
      {},
      { data: this.reqParam },
      this.reqParam.error ? { error: this.reqParam.error } : null,
    );
    return respondData;
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
      this.reqParam.errors ? { error: { errors: this.reqParam.errors } } : null,
    );
    return respondData;
  }
}
