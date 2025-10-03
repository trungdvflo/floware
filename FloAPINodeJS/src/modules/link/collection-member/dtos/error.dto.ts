import { ApiResponseProperty } from "@nestjs/swagger";
import { format } from "util";
import { ErrorCode } from "../../../../common/constants/error-code";
import { MSG_ERR_LINK } from "../../../../common/constants/message.constant";
import { ParamError, RequestParamError } from "../../../../common/interfaces";
import { LinkedCollectionObjectMemberDto } from "./linked-collection-object-member.dto";

export class LinkedCollectionParamError
implements ParamError<LinkedCollectionObjectMemberDto> {
  @ApiResponseProperty({ example: ErrorCode.ACCOUNT_NOT_FOUND })
  code: string;

  @ApiResponseProperty({ example: format(MSG_ERR_LINK.INVALID_ACCOUNT_ID, 'account_id') })
  message: string;

  @ApiResponseProperty({
    example: {
      "attributes": {
        "account_id": 12,
        "ref": "6D63D672D2C-3700A1BD-EB0E-4B8E-84F9"
      }
    }
  })
  attributes: Partial<LinkedCollectionObjectMemberDto>;
  constructor(data: LinkedCollectionParamError) {
    Object.assign(this, data);
  }
}
export class LinkedCollectionRequestParamError
implements RequestParamError<LinkedCollectionObjectMemberDto> {
  @ApiResponseProperty({ type: [LinkedCollectionParamError] })
  errors: LinkedCollectionParamError[];
  constructor(data: LinkedCollectionRequestParamError) {
    Object.assign(this, data);
  }
}
