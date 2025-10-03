import { ApiResponseProperty } from '@nestjs/swagger';
import { HAS_DEL } from '../../../../common/constants/common';
import { DeleteItemResponse } from '../../../deleted-item/dto/deletedItemParam';
import { LinkedCollectionObjectResponse } from './linked-collection-object-member.dto';
export class GetLinkedCollectionObjectMemberResponse {
  @ApiResponseProperty({type: [LinkedCollectionObjectResponse]})
  data: Partial<LinkedCollectionObjectResponse>[];

  @ApiResponseProperty({type: [DeleteItemResponse]})
  data_del?: Partial<DeleteItemResponse>[];

  constructor(links?: Partial<LinkedCollectionObjectResponse>[],
    delLinks?: Partial<DeleteItemResponse>[],
    hasDel?: number) {
    this.data = links.map(r => new LinkedCollectionObjectResponse(r));
    if(hasDel === HAS_DEL.show){
      this.data_del = delLinks;
    }
  }
}
