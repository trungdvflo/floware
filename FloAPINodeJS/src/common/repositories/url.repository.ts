import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { COLLECTION_TYPE, OBJ_TYPE } from '../constants';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { Url } from '../entities/urls.entity';

@Injectable()
@CustomRepository(Url)
export class UrlRepository extends Repository<Url> {
  async getShareColIds(ids: number[]): Promise<number[]> {
    const res = await this.manager.query(`
    SELECT c.id FROM collection c
    INNER JOIN linked_collection_object lco ON lco.collection_id = c.id  AND lco.object_type = ?
    INNER JOIN url u ON u.uid = lco.object_uid AND lco.object_type = ?
    WHERE u.id IN (?) AND c.type = ?
    `, [OBJ_TYPE.URL, OBJ_TYPE.URL, ids, COLLECTION_TYPE.SHARE_COLLECTION]);

    return res?.map(r => r.id);
  }

  async getShareMembersByCollectionId(colId: number) {
    const data = await this.manager.query(`
      SELECT csm.id, csm.user_id, csm.member_user_id
      FROM collection_shared_member csm
      WHERE csm.collection_id = ?
    `, [colId]);

    if (data.length === 0) {
      return [];
    }
    const userIds = [];
    data.forEach(item => {
      userIds.push(item.member_user_id);
    });

    return userIds;
  }
}
