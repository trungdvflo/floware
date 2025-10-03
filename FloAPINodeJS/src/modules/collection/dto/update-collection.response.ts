import { ApiResponseProperty } from '@nestjs/swagger';
import { Collection } from '../../../common/entities/collection.entity';
import { ResponseObject } from '../../../common/interfaces';
import { CollectionRequestParamError } from './collection-param-error';
export class UpdateCollectionResponse implements ResponseObject<Collection> {
  @ApiResponseProperty()
  public data: Collection[];

  @ApiResponseProperty()
  public error?: CollectionRequestParamError;
}
