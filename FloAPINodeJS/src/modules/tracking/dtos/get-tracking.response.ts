import { ApiProperty } from '@nestjs/swagger';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { Tracking } from '../../../common/entities/tracking.entity';
import { TrackingResponse } from './tracking.dto';

export class GetTrackingResponse {
  @ApiProperty({ type: TrackingResponse, isArray: true })
  public data: Tracking[];

  @ApiProperty({ type: DeletedItem, isArray: true })
  public data_del: DeletedItem[];
}
