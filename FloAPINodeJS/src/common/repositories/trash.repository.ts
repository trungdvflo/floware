import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { COLLECTION_TYPE } from '../constants';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { TrashEntity } from '../entities/trash.entity';

@Injectable()
@CustomRepository(TrashEntity)
export class TrashRepository extends Repository<TrashEntity> {
  async getCollection(trash: TrashEntity): Promise<any> {
    this.createQueryBuilder('tr')
    .select('l.collection_id as collection_id')
    .innerJoin('linked_collection_object', 'l'
      , 'tr.object_uid = l.object_uid AND tr.object_type = l.object_type')
    .innerJoin('collection', 'c'
      , 'c.id = l.collection_id')
    .where('tr.id = :id', { id: trash.id})
    .andWhere('c.user_id = :uid', { uid: trash.user_id })
    .andWhere('c.type = :cType', { cType: COLLECTION_TYPE.SHARE_COLLECTION })
    .getRawOne();
  }

  async getDefaultCol (userId: number): Promise<any> {
    const setting = await this.manager.query(
      `SELECT s.default_folder FROM setting s WHERE s.user_id = ?`
      , [userId]);
    return setting[0]?.default_folder;
  }
}
