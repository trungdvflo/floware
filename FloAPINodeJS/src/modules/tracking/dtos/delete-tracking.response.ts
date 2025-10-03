import { ApiResponseProperty } from '@nestjs/swagger';
import { TrackingDeleteResponse } from './tracking.dto';

export class DeleteTrackingResponse {
  @ApiResponseProperty({ type: [TrackingDeleteResponse] })
  public data: TrackingDeleteResponse[];

  @ApiResponseProperty()
  public error?: any;
}
