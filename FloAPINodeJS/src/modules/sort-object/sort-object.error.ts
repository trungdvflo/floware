import { ApiResponseProperty } from '@nestjs/swagger';
import { ErrorCode } from '../../common/constants/error-code';
import { SortObjectResponseMessage } from '../../common/constants/message.constant';

export class BadRequestSortObjectError {
  @ApiResponseProperty({ example: ErrorCode.SORT_OBJECT_IN_PROCESS })
  code: ErrorCode;

  @ApiResponseProperty({ example: SortObjectResponseMessage.SORT_OBJECT_EXPIRED })
  message: string;

  constructor(error: BadRequestSortObjectError) {
    Object.assign(this, error);
  }
}
