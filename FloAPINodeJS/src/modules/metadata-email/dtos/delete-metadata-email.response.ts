import { ApiResponseProperty } from '@nestjs/swagger';
import { MetadataEmailDeleteResponse } from './metadata-email.dto';

export class DeleteMetadataEmailResponse {
  @ApiResponseProperty({ type: [MetadataEmailDeleteResponse] })
  public data: MetadataEmailDeleteResponse[];

  @ApiResponseProperty()
  public error?: any;
}
