export interface ParamError<T> {
  code: string;
  message: string;
  attributes?: Partial<T>;
}

export interface IParamError {
  code: string;
  message: string;
}

export interface RequestParamError<T> {
  errors: ParamError<T>[];
}
