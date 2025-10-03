import { ApiProperty } from '@nestjs/swagger';
import { Collection } from '../../../common/entities/collection.entity';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { ResponseObject } from '../../../common/interfaces';
export class GetCollectionResponse implements ResponseObject<Collection> {
  @ApiProperty({ type: Collection, isArray: true })
  public data: Collection[];

  @ApiProperty({ type: DeletedItem, isArray: true })
  public data_del: DeletedItem[];
}
