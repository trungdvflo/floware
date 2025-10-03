import { ApiResponseProperty, PartialType } from '@nestjs/swagger';
import { MetadataEmail } from '../../../common/entities/metadata-email.entity';

export class MetadataEmailResponse extends PartialType(MetadataEmail) {
  constructor(data: Partial<MetadataEmailResponse>) {
    super();
    Object.assign(this, data);
  }
  object_uid?: any;
  ref?: string | number;
}

export class MetadataEmailDeleteResponse {
  @ApiResponseProperty({ example: 1 })
  id: number;
}