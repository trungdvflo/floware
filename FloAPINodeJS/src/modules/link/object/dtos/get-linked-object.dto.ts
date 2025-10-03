import { ApiResponseProperty } from '@nestjs/swagger';
import { HAS_DEL } from '../../../../common/constants/common';
import { DeleteItemResponse } from '../../../../modules/deleted-item/dto/deletedItemParam';
import { LinkedObjectResponse } from './linked-object.dto';
export class GetLinkedObjectResponse {
  @ApiResponseProperty({type: [LinkedObjectResponse]})
  data: Partial<LinkedObjectResponse>[];

  @ApiResponseProperty({type: [DeleteItemResponse]})
  data_del?: Partial<DeleteItemResponse>[];

  constructor(links?: Partial<LinkedObjectResponse>[], delLinks?: Partial<DeleteItemResponse>[],
    hasDel?: number) {
    this.data = links.map(r => new LinkedObjectResponse(r));
    if(hasDel === HAS_DEL.show){
      this.data_del = delLinks;
    }
  }
}
