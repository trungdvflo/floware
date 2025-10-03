import { ErrorCode } from "../constants/error-code";
import { GENERAL_OBJ, GeneralObjectId } from "../dtos/object-uid";

export interface IDataRespond {
	request_uid?: string;
	data?: any[];
	data_del?: [];
	errors?: any[];
}

export class DataRespond {
	public data: any[];
	public errors: any[];
}

export class IDataSingleRespond {
	public data?: {};
	public error?: {};
}
export class MultipleRespond {
	private readonly reqParam: IDataRespond;

	constructor(req: IDataRespond) {
		this.reqParam = req;
	}

	public multipleRespond(code = -1) {
		const respondData = {
			request_uid: this.reqParam.request_uid,
			data: this.reqParam.data,
			code,
			...(this.reqParam.errors ? { error: { errors: this.reqParam.errors } } : null)
		};
		return respondData;
	}
}

export class SingleRespond {
	private readonly reqParam: IDataSingleRespond;

	constructor(req: IDataSingleRespond) {
		this.reqParam = req;
	}

	public singleData() {
		const respondData = Object.assign({},
			{ data: this.reqParam.data },
			this.reqParam.error ? { error: this.reqParam.error } : null
		);
		return respondData;
	}
}

export class ResponseMutiSortReqData {
	request_uid: string;
	data: [];
	error?: {};
	constructor(request_uid, data, errors) {
		this.data = data;
		this.request_uid = request_uid;
		if (errors && errors.length > 0) {
			this.error = {
				errors
			};
		}
	}
}

export class ResponseMutiData {
	data: [];
	error?: {};

	constructor(data, errors) {
		this.data = data;
		if (errors && errors.length > 0) {
			this.error = {
				errors
			};
		}
	}
}

export function buildSingleResponseErr(code: string, message: string, attributes = null) {
	return {
		data: {},
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

export const buildFailItemResponse = (code, message, dto = null) => {
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
		attributes
	};
};

export const modifyObjectUidAndType = (respond) => {
	respond['object_uid'] = new GeneralObjectId({
		uidBuffer: respond['object_uid'] as Buffer
	}, respond['object_type'] as GENERAL_OBJ).getPlain();
	respond['object_type'] = !respond['object_type'] ? ''
		: respond['object_type'].toString();
	return respond;
};

export const buildFailItemResponseWithoutAttr = (code, message) => ({ code, message });