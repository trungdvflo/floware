import { Graylog } from '../../../configs/graylog.config';
import { getRepository, In, LessThan, MoreThan } from 'typeorm';
import { CONN_EXP_NAME, DELETED_ITEM_TYPE, MAX_RECORD_SELECT } from '../constant';
import { IdUserEntity } from '../entities/id.entity';
import { LinkedCollectionObjectDelete } from '../entities/linked-collection-object-delete.entity';
import { LinkedCollectionObjectExport } from '../entities/linked-collection-object-export.entity';
import { LinkedCollectionObject } from '../entities/linked-collection-object.entity';
import { ResultCleanLink } from '../entities/result-clean-link.entity';
import { DeleteService, Linked } from './delete.service';

export class LinkedCollectionObjectService {
  private readonly linkColObjectRepo = getRepository(LinkedCollectionObject);
  private readonly linkColObjectExpRepo = getRepository(LinkedCollectionObjectExport,
    CONN_EXP_NAME);
  private readonly linkColObjectDelRepo = getRepository(LinkedCollectionObjectDelete,
    CONN_EXP_NAME);

  private readonly deleteService = new DeleteService();

  private getAccAndCollIds(links: LinkedCollectionObject[]) {
    const accIds = new Set<number>();
    const collIds = new Set<number>();
    for (const l of links) {
      accIds.add(l.account_id);
      collIds.add(l.collection_id);
    }

    return {
      accIds: Array.from(accIds),
      collIds: Array.from(collIds),
    };
  }

  private async getInvalid(links: LinkedCollectionObject[]) {
    const { accIds, collIds } = this.getAccAndCollIds(links);
    const invalid3rd = await this.deleteService
      .getInvalid3rdAccount(links, accIds);
    const invalidColl = await this.deleteService
      .getInvalidCollection(invalid3rd.goodLinks, collIds);

    return {
      invalidLinks: invalid3rd.invalidLinks.concat(invalidColl.invalidLinks),
      goodLinks: invalidColl.goodLinks
    };
  }

  /**
   * Get all record which the same (double) with link, not include the link.
   * Get in export data
   * @param link LinkedCollectionObject
   * @returns Promise<LinkedCollectionObjectExport[]>
   */
  private async getDoubleLinkCollection(link: Linked)
    : Promise<LinkedCollectionObjectExport[]> {
    return await this.linkColObjectExpRepo.find({
      where: {
        id: LessThan(link.id),
        user_id: link.user_id,
        collection_id: link.collection_id,
        object_uid: link.object_uid,
        object_type: link.object_type,
      }
    });
  }

  private async removeDoubleLinks(doubleLinks: IdUserEntity[]) {
    if (doubleLinks.length > 0) {
      // delete from source
      await this.deleteService.removeLinksFromSource(doubleLinks
        , this.linkColObjectRepo
        , DELETED_ITEM_TYPE.COLLECTION_LINK);
      // insert to deleted table db log
      await this.deleteService.insert2DeleteTable(doubleLinks
        , this.linkColObjectDelRepo);
      // make export table is same with source table
      await this.deleteService.deleteExportTable(doubleLinks
        , this.linkColObjectExpRepo);
    }
  }

  private async removeInvalidLinks(invalidLinks: IdUserEntity[]) {
    if (invalidLinks.length > 0) {
      // delete from source
      await this.deleteService.removeLinksFromSource(invalidLinks
        , this.linkColObjectRepo
        , DELETED_ITEM_TYPE.COLLECTION_LINK);
      // insert to deleted table db log
      await this.deleteService.insert2DeleteTable(invalidLinks
        , this.linkColObjectDelRepo);
    }
  }

  async cleanLink() {
    let pageSelected = 0;
    const maxId = await this.deleteService.getMaxIdofTable(this.linkColObjectExpRepo);
    let last_id = maxId;
    const result = new ResultCleanLink();
    result.name = this.linkColObjectRepo.metadata.tableName;
    result.total_record_scaned = 0;
    result.total_record_invalided = 0;
    result.total_record_doubled = 0;
    result.total_record_notfound = 0;
    result.started_clean_time = new Date();
    do {
      try {
        // get new links from source, paging MAX_RECORD_SELECT
        const links = await this.linkColObjectRepo.find({
          where: { id: MoreThan(last_id) },
          order: { id: 'ASC' },
          take: MAX_RECORD_SELECT
        });
        pageSelected = links.length;
        if (!pageSelected || pageSelected <= 0) break;
        result.total_record_scaned += pageSelected;
        last_id = this.deleteService.getLastIdofArray(links);

        // find invalid
        const { invalidLinks, goodLinks } = await this.getInvalid(links);
        // double link
        for (const link of goodLinks) {
          const doubleLinks: LinkedCollectionObjectExport[] = await this
            .getDoubleLinkCollection(link);

          // verify doublelink from source
          const verifyDoubleLink = await this.deleteService
            .verifyDoubleLink(doubleLinks, this.linkColObjectRepo);

          result.total_record_doubled += verifyDoubleLink.doubleLinks.length;
          await this.removeDoubleLinks(verifyDoubleLink.doubleLinks);

          result.total_record_notfound += verifyDoubleLink.notFoundLinks.length;
          // make export table is same with source table
          await this.deleteService.deleteExportTable(verifyDoubleLink.notFoundLinks
            , this.linkColObjectExpRepo);
        }
        result.total_record_invalided += invalidLinks.length;
        await this.removeInvalidLinks(invalidLinks);

        await this.deleteService.insert2ExportTable(goodLinks, this.linkColObjectExpRepo);
        await this.deleteService.Delay(100);
      } catch (err) {
        Graylog.getInstance().LogError(err);
      }
    } while (pageSelected >= MAX_RECORD_SELECT);
    result.finished_clean_time = new Date();
    await this.deleteService.insertResult(result);
  }
}
