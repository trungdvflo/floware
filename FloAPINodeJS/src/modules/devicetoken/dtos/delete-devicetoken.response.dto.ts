import { ApiResponseProperty } from '@nestjs/swagger';
import { DevicetokenDeleteResponse } from './devicetoken.dto';

export class DeleteDevicetokenResponse {
  @ApiResponseProperty()
  public data: DevicetokenDeleteResponse;

  @ApiResponseProperty()
  public error?: any;
}
