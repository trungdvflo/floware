import { ApiResponseProperty } from "@nestjs/swagger";
import { format } from "util";
import { ErrorCode } from "../../../../common/constants/error-code";
import { MSG_ERR_LINK } from "../../../../common/constants/message.constant";
import { ParamError, RequestParamError } from "../../../../common/interfaces";
import { LinkedObjectDto } from "./linked-object.dto";

export class LinkedObjectParamError implements ParamError<LinkedObjectDto> {
  @ApiResponseProperty({ example: ErrorCode.ACCOUNT_NOT_FOUND })
  code: string;

  @ApiResponseProperty({ example: format(MSG_ERR_LINK.INVALID_ACCOUNT_ID, 'source_account_id') })
  message: string;

  @ApiResponseProperty({
    example: {
      "attributes": {
        "source_account_id": 12,
        "ref": "6D63D672D2C-3700A1BD-EB0E-4B8E-84F9"
      }
    }
  })
  attributes: Partial<LinkedObjectDto>;
  constructor(data: LinkedObjectParamError) {
    Object.assign(this, data);
  }
}
export class LinkedObjectRequestParamError implements RequestParamError<LinkedObjectDto> {
  @ApiResponseProperty({ type: [LinkedObjectParamError] })
  errors: LinkedObjectParamError[];
  constructor(data: LinkedObjectRequestParamError) {
    Object.assign(this, data);
  }
}
