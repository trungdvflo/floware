import { Collection } from '../../../commons/entities/collection.entity';
import { ThirdPartyAccount } from '../../../commons/entities/third-party-account.entity';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../../commons/utils/common.util';
import { getRepository, In, MoreThan, Repository } from 'typeorm';
import { CONN_EXP_NAME, MAX_RECORD_SELECT } from '../constant';
import { DeleteEntity } from '../entities/delete.entity';
import { DeletedItem } from '../entities/deleted-item.entity';
import { ExportEntity } from '../entities/export.entity';
import { IdUserEntity } from '../entities/id.entity';
import { ResultCleanLink } from '../entities/result-clean-link.entity';
import { ThirdPartyAccountExport } from '../entities/third-party-account.entity-export.entity';

export class LinkDeletedItem {
  user_id: number;
  id: number;
  object_uid?: Buffer;
}

export class Linked {
  user_id: number;
  id: number;
  account_id?: number;
  collection_id?: number;
  kanban_id?: number;
  object_uid?: Buffer;
  object_type?: Buffer;
}

export class DeleteService {
  private readonly deletedItemRepo = getRepository(DeletedItem);
  private readonly collectionRepo = getRepository(Collection);
  // private readonly thirdAccExpRepo = getRepository(ThirdPartyAccountExport, CONN_EXP_NAME);
  private readonly thirdAccRepo = getRepository(ThirdPartyAccount);
  private readonly resultCleanRepo = getRepository(ResultCleanLink, CONN_EXP_NAME);

  Delay(delay) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(null);
      }, delay);
    });
  }

  getLastIdofArray(entities: IdUserEntity[]) {
    let last_id = 0;
    for (const th of entities) {
      if (last_id < th.id) last_id = th.id;
    }
    return last_id;
  }

  async insertResult(result: ResultCleanLink){
    return await this.resultCleanRepo.insert(result);
  }
  async getMaxIdofTable<T>(repo: Repository<T>): Promise<number> {
    const query = repo.createQueryBuilder('link')
      .select("MAX(link.id)", "max");
    const result = await query.getRawOne();
    return result.max || 0;
  }

  /**
   * Get third-party-account for check invalid
   * @param accIds
   * @returns
   */
  async get3rdAccountExp (accIds: number[]) {
    // can not check in export data, because we need the newest data
    // return await this.thirdAccExpRepo.find({
    //   id: In(accIds)
    // });
    return await this.thirdAccRepo.find({
      where: {
        id: In(accIds)
      }
    });
  }

  /**
   * Get invalid of the linked
   * @param links array of Linked
   * @param accIds array of third-party-account id
   * @returns \{ invalidLinks, goodLinks }
   */
   async getInvalid3rdAccount(links: Linked[], accIds: number[]) {
    const invalidLinks: Linked[] = [];
    const goodLinks: Linked[] = [];
    const accs = await this.get3rdAccountExp(accIds);

    for (const link of links) {
      let isGood = false;
      if (link.account_id === 0 || link.account_id === null)
      {
        isGood = true;
      } else {
        for (const acc of accs) {
          if (acc.id === link.account_id
            && acc.user_id === link.user_id) {
            isGood = true;
            break;
          }
        }
      }
      if (isGood) {
        goodLinks.push(link);
      } else {
        invalidLinks.push(link);
      }
    }

     return {
       invalidLinks,
       goodLinks
     };
  }

  /**
   * Get invalid of the linked-collection-object, check in original data.
   * @param links array of LinkedCollectionObject
   * @param collIds array of collection id
   * @returns \{ invalidLinks, goodLinks }
   */
   async getInvalidCollection(links: Linked[], collIds: number[]) {
    const invalidLinks: Linked[] = [];
    const goodLinks: Linked[] = [];
    const colls = await this.collectionRepo.find({
      where: {
        id: In(collIds)
      }
    });
    for (const link of links) {
      let isGood = false;
      for (const coll of colls) {
        if (coll.id === link.collection_id && coll.user_id === link.user_id) {
          isGood = true;
          break;
        }
      }
      if (isGood) {
        goodLinks.push(link);
      } else {
        invalidLinks.push(link);
      }
    }

     return {
       invalidLinks,
       goodLinks
     };
  }

  /**
   * Re-check double link with source data
   * (Because source data can be deleted some record)
   * @param links array of link which want verify
   * @param repoSrc Repository of link table (Source)
   * @returns doubleLinks[] and deletedLinks[]
   */
  async verifyDoubleLink(links: IdUserEntity[], repoSrc: Repository<IdUserEntity>) {
    const doubleLinks: IdUserEntity[] = [];
    const notFoundLinks: IdUserEntity[] = [];
    if (links.length > 0) {
      const linkIds = links.map(l => l.id);
      const srcLinks = await repoSrc.find({
        where: {
          id: In(linkIds)
        }
      });
      let index = -1;
      for (const l of links) {
        index = srcLinks.findIndex(v => v.id===l.id);
        if (index >= 0) {
          doubleLinks.push(l);
        } else {
          notFoundLinks.push(l);
        }
      }
    }

    return {
      doubleLinks,
      notFoundLinks
    };
  }

  /**
   * Remove links from source data
   * - create deleted-item
   * - delete links
   * @param links array of link which want remove
   * @param repoSrc Repository of link table
   * @param item_type DELETED_ITEM_TYPE
   */
  async removeLinksFromSource(links: LinkDeletedItem[]
    , repoSrc: Repository<IdUserEntity>
    ,item_type) {
    const currentTime = getUtcMillisecond();
    const linkIds: number[] = [];
    const entities = links.map((link, i) => {
      linkIds.push(link.id);
      const createDate = getUpdateTimeByIndex(currentTime, i);
      return this.deletedItemRepo.create({
        user_id: link.user_id,
        item_id: link.id,
        item_uid: link.object_uid,
        item_type,
        created_date: createDate,
        updated_date: createDate
      });
    });
    await this.deletedItemRepo.insert(entities);
    await repoSrc.delete({ id: In(linkIds) });
  }

  /**
   * Export data from source table to destination table
   * @param repoSrc Source repository
   * @param repoDes Destination repository
   * @returns total record are exportd
   */
  async export(repoSrc: Repository<IdUserEntity>, repoDes: Repository<ExportEntity>) {
    let totalRecord = 0;
    let pageSelected = 0;
    let last_id = 0;
    await repoDes.clear();
    do {
      const srcEntities = await repoSrc.find({
        where: { id: MoreThan(last_id) },
        order: { id: 'ASC' },
        take: MAX_RECORD_SELECT
      });
      pageSelected = srcEntities.length;
      if (!pageSelected || pageSelected <=0) break;
      totalRecord += pageSelected;
      last_id = this.getLastIdofArray(srcEntities);
      await this.insert2ExportTable(srcEntities, repoDes);
    } while (pageSelected >= MAX_RECORD_SELECT);

    return totalRecord;
  }

  /**
   * Insert list entity to export table (of logs data)
   * @param srcEntities array of entity which want insert
   * @param repoDes Repository of entity which want export
   * @returns
   */
  async insert2ExportTable(srcEntities: IdUserEntity[], repoDes: Repository<ExportEntity>) {
    if (srcEntities.length === 0) return;
    const export_date = new Date();
    const desEntities: ExportEntity[] = [];
    for (const th of srcEntities) {
      const desEntity = repoDes.create({
        ...th,
        export_date
      });
      desEntities.push(desEntity);
    }
    await repoDes.insert(desEntities);
  }

  /**
   * Insert list entity to delete table (of logs data)
   * @param srcEntities array of entity which want insert
   * @param repoDes Repository of entity which want export
   * @returns
   */
  async insert2DeleteTable(srcEntities: IdUserEntity[], repoDes: Repository<DeleteEntity>) {
    if (srcEntities.length === 0) return;
    const deleted_date = new Date();
    const desEntities: DeleteEntity[] = [];
    for (const th of srcEntities) {
      const desEntity = repoDes.create({
        ...th,
        deleted_date
      });
      desEntities.push(desEntity);
    }
    await repoDes.insert(desEntities);
  }

  /**
   * Delete list entity from export table (of logs data)
   * @param srcEntities array of entity which want delete
   * @param repoDes Repository of table which want delete
   * @returns
   */
  async deleteExportTable(srcEntities: IdUserEntity[], repoDes: Repository<IdUserEntity>) {
    if (srcEntities.length === 0) return;
    const ids = srcEntities.map(e => e.id);
    return await repoDes.delete({
      id: In(ids)
    });
  }

}
