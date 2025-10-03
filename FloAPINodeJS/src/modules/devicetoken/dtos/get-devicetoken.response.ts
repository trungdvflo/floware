import { ApiResponseProperty } from '@nestjs/swagger';
import { DevicetokenResponse } from './devicetoken.dto';

export class GetDevicetokenResponse {
  @ApiResponseProperty({ type: [DevicetokenResponse] })
  public data?: DevicetokenResponse[];

  @ApiResponseProperty()
  public error?: any;
}