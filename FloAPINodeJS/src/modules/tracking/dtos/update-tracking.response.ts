import { ApiResponseProperty } from '@nestjs/swagger';
import { TrackingResponse } from './tracking.dto';

export class UpdateTrackingResponse {
  @ApiResponseProperty({ type: [TrackingResponse] })
  public data: TrackingResponse[];

  @ApiResponseProperty()
  public error?: any;
}
