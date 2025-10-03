import { ErrorCode } from "../constants/error-code";

export class DataRespond {
  public data: any[];
  public errors: any[];
}

export class IDataSingleRespond {
  public data?: {};
  public error?: {};
}

export class SingleRespond {
	data: {};
  error?: {};

	constructor(req: IDataSingleRespond) {
		this.data = req.data;
    if(req.error){
      this.error = req.error;
    }
	}
}

export class ResponseMutiData {
  data: [];
  error?: {};

  constructor(data, errors) {
		this.data = data;
    if(errors && errors.length>0){
      this.error = {
        errors
      };
    }
	}
}

export function buildSingleResponseErr(code: string, message: string, attributes = null) {
	return {
		data : {},
		error: {
			code,
			message,
			attributes
		}
	};
}

export function filterErrorMessage(validationErr) {
	const messages = validationErr.map((error) => {
		return {
			code: ErrorCode.VALIDATION_FAILED,
			message: Object.values(error.constraints).join(', ')
		};
	});
	return messages[0].message;
}

export const buildFailItemResponse = (code, message, attributes = null) => {
	return {
		code,
		message,
		attributes: {...attributes}
	};
};