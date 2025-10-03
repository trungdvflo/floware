import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GENERATE_DELETED_ITEM_SHARED_OMNI } from '../constants';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { DeletedItem } from '../entities/deleted-item.entity';
import { getPlaceholderByN } from '../utils/common';

@Injectable()
@CustomRepository(DeletedItem)
export class DeletedItemRepository extends Repository<DeletedItem> {
  /**
   * collection_generateDeletedItemSharedOmni
   * ('COLLECTION_COMMENT', nCollectionId, nID, nDeleteTime);
   * @param ('COLLECTION_COMMENT', nCollectionId, nID, nDeleteTime, ownerId)
   * @returns number
   */
  async generateDeletedItemForShared({
    vItemType
    , nCollectionId
    , nItemId
    , nDeleteDate
    , nOwnerUserId
  }) {
    const { callType, spName, spParam } = GENERATE_DELETED_ITEM_SHARED_OMNI;
    const res = await this.manager
      .query(`${callType} ${spName}(${getPlaceholderByN(spParam)}) as del`, [
        vItemType
        , nCollectionId
        , nItemId
        , nDeleteDate
        , nOwnerUserId
      ]);

    return (res && res[0] && res[0].del) ? res[0].del : 0;
  }
}
