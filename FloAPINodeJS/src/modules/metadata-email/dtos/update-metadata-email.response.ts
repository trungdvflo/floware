import { ApiResponseProperty } from '@nestjs/swagger';
import { MetadataEmailResponse } from './metadata-email.dto';

export class UpdateMetadataEmailResponse {
  @ApiResponseProperty({ type: [MetadataEmailResponse] })
  public data: MetadataEmailResponse[];

  @ApiResponseProperty()
  public error?: any;
}