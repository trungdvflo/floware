import { ApiResponseProperty } from '@nestjs/swagger';
import { ErrorCode } from '../../../common/constants/error-code';
import { PLATFORM_RELEASE_NOT_FOUND } from '../../../common/constants/message.constant';

export class GetPlatformReleaseNotFoundError {
  @ApiResponseProperty({example: ErrorCode.PLATFORM_RELEASE_NOT_FOUND})
  code: string;

  @ApiResponseProperty({example: PLATFORM_RELEASE_NOT_FOUND})
  message: string;
  constructor(error: GetPlatformReleaseNotFoundError) {
    Object.assign(this, error);
  }
}