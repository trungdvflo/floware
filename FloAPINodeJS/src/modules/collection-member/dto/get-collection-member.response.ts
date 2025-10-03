import { ApiProperty } from '@nestjs/swagger';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { ResponseObject } from '../../../common/interfaces';
import { CollectionMemberParam } from './collection-member-param';
export class GetCollectionMemberResponse implements ResponseObject<CollectionMemberParam> {
  @ApiProperty({ type: CollectionMemberParam, isArray: true })
  public data: CollectionMemberParam[];

  @ApiProperty({ type: DeletedItem, isArray: true })
  public data_del: DeletedItem[];
}
