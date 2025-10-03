import { ApiResponseProperty } from '@nestjs/swagger';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { MetadataEmailResponse } from './metadata-email.dto';

export class GetMetadataEmailResponse {
  @ApiResponseProperty({ type: [MetadataEmailResponse] })
  public data?: MetadataEmailResponse[];

  @ApiResponseProperty({ type: [DeletedItem] })
  public data_del?: DeletedItem[];

  @ApiResponseProperty()
  public error?: any;
}