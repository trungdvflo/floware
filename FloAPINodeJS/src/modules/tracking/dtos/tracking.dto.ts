import { ApiResponseProperty, PartialType } from '@nestjs/swagger';
import { Tracking } from '../../../common/entities/tracking.entity';

export class TrackingResponse extends PartialType(Tracking) {
  constructor(data: Partial<TrackingResponse>) {
    super();
    Object.assign(this, data);
  }
  object_uid?: any;
  ref?: string | number;
}

export class TrackingDeleteResponse {
  @ApiResponseProperty({ example: 1 })
  id: number;
}