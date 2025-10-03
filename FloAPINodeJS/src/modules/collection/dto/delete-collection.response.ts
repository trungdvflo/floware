import { ApiProperty } from '@nestjs/swagger';
import { ResponseObject } from '../../../common/interfaces';
import { DeleteCollectionParam } from './collection-param';
import { DeleteCollectionRequestParamError } from './collection-param-error';

export class DeleteCollectionResponse implements ResponseObject<DeleteCollectionParam> {
  @ApiProperty({ type: DeleteCollectionParam, isArray: true })
  public data: DeleteCollectionParam[];

  @ApiProperty({ type: DeleteCollectionRequestParamError })
  public error?: DeleteCollectionRequestParamError;
}
