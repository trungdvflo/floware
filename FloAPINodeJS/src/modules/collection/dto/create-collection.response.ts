import { ApiProperty } from '@nestjs/swagger';
import { Collection } from '../../../common/entities/collection.entity';
import { ResponseObject } from '../../../common/interfaces';
import { CollectionRequestParamError } from './collection-param-error';

export class CollectionWithRef extends Collection {
  constructor(data: Partial<CollectionWithRef>) {
    super();
    Object.assign(this, data);
  }
  @ApiProperty({ example: '1234' })
  public ref: any;
}

export class CreateCollectionResponse implements ResponseObject<CollectionWithRef> {
  @ApiProperty({ type: CollectionWithRef, isArray: true  })
  public data: CollectionWithRef[];

  @ApiProperty({ type: CollectionRequestParamError })
  public error?: CollectionRequestParamError;
}
