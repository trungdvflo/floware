import { Graylog } from '../../../configs/graylog.config';
import { getRepository, LessThan, MoreThan } from 'typeorm';
import { CONN_EXP_NAME, DELETED_ITEM_TYPE, MAX_RECORD_SELECT } from '../constant';
import { IdUserEntity } from '../entities/id.entity';
import { LinkedObjectDelete } from '../entities/linked-object-delete.entity';
import { LinkedObjectExport } from '../entities/linked-object-export.entity';
import { LinkedObject } from '../entities/linked-object.entity';
import { ResultCleanLink } from '../entities/result-clean-link.entity';
import { DeleteService } from './delete.service';

export class LinkedObjectService {
  private readonly linkObjectRepo = getRepository(LinkedObject);
  private readonly linkObjectExpRepo = getRepository(LinkedObjectExport, CONN_EXP_NAME);
  private readonly linkObjectDelRepo = getRepository(LinkedObjectDelete, CONN_EXP_NAME);

  private readonly deleteService = new DeleteService();

  private getSrcAccIds(links: LinkedObject[]) {
    const accSrcIds = new Set<number>();
    for (const l of links) {
      accSrcIds.add(l.destination_account_id);
    }
    return {
      accSrcIds: Array.from(accSrcIds)
    };
  }
  private getDesAccIds(links: LinkedObject[]) {
    const accDesIds = new Set<number>();
    for (const l of links) {
      accDesIds.add(l.destination_account_id);
    }
    return {
      accDesIds: Array.from(accDesIds),
    };
  }

  /**
   * Get invalid of the linked, check in exported data.
   * @param links array of Linked
   * @param accIds array of third-party-account id
   * @returns \{ invalidLinks, goodLinks }
   */
  async getInvalid3rdAccount(links: LinkedObject[], accIds: number[], isSrc: boolean) {
    const invalidLinks: LinkedObject[] = [];
    const goodLinks: LinkedObject[] = [];
    const accs = await this.deleteService.get3rdAccountExp(accIds);

    for (const link of links) {
      let isGood = false;
      let link_account_id = link.destination_account_id;
      if (isSrc) link_account_id = link.source_account_id;
      if (link_account_id === 0 || link_account_id === null) {
        isGood = true;
      } else {
        for (const acc of accs) {
          if (acc.id === link_account_id
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

  private async getInvalid(links: LinkedObject[]) {
    const { accSrcIds } = this.getSrcAccIds(links);
    const {
      goodLinks,
      invalidLinks
    } = await this.getInvalid3rdAccount(links, accSrcIds, true);
    const { accDesIds } = this.getDesAccIds(goodLinks);
    const invalidDes3rd = await this.getInvalid3rdAccount(goodLinks, accDesIds, false);

    return {
      invalidLinks: invalidLinks.concat(invalidDes3rd.invalidLinks),
      goodLinks: invalidDes3rd.goodLinks
    };
  }

  /**
   * Get all record which the same (double) with link, not include the link.
   * Get in export data
   * @param link LinkedObject
   * @returns Promise<LinkedObject[]>
   */
  private async getDoubleLinkCollection(link: LinkedObject)
    : Promise<LinkedObjectExport[]> {
    const l1 = await this.linkObjectExpRepo.find({
      where: {
        id: LessThan(link.id),
        user_id: link.user_id,
        source_account_id: link.source_account_id,
        source_object_uid: link.source_object_uid,
        source_object_type: link.source_object_type,
        destination_account_id: link.destination_account_id,
        destination_object_uid: link.destination_object_uid,
        destination_object_type: link.destination_object_type,
      }
    });
    const l2 = await this.linkObjectExpRepo.find({
      where: {
        id: LessThan(link.id),
        user_id: link.user_id,
        source_account_id: link.destination_account_id,
        source_object_uid: link.destination_object_uid,
        source_object_type: link.destination_object_type,
        destination_account_id: link.source_account_id,
        destination_object_uid: link.source_object_uid,
        destination_object_type: link.source_object_type,
      }
    });
    return l1.concat(l2);
  }

  private async removeDoubleLinks(doubleLinks: IdUserEntity[]) {
    if (doubleLinks.length > 0) {
      // delete from source
      await this.deleteService.removeLinksFromSource(doubleLinks
        , this.linkObjectRepo
        , DELETED_ITEM_TYPE.LINK);
      // insert to deleted table db log
      await this.deleteService.insert2DeleteTable(doubleLinks
        , this.linkObjectDelRepo);
      // make export table is same with source table
      await this.deleteService.deleteExportTable(doubleLinks
        , this.linkObjectExpRepo);
    }
  }

  private async removeInvalidLinks(invalidLinks: IdUserEntity[]) {
    if (invalidLinks.length > 0) {
      // delete from source
      await this.deleteService.removeLinksFromSource(invalidLinks
        , this.linkObjectRepo
        , DELETED_ITEM_TYPE.LINK);
      // insert to deleted table db log
      await this.deleteService.insert2DeleteTable(invalidLinks
        , this.linkObjectDelRepo);
    }
  }

  async cleanLink() {
    let pageSelected = 0;
    const maxId = await this.deleteService.getMaxIdofTable(this.linkObjectExpRepo);
    let last_id = maxId;
    const result = new ResultCleanLink();
    result.name = this.linkObjectRepo.metadata.tableName;
    result.total_record_scaned = 0;
    result.total_record_invalided = 0;
    result.total_record_doubled = 0;
    result.total_record_notfound = 0;
    result.started_clean_time = new Date();
    do {
      try {
        // get new links from source, paging MAX_RECORD_SELECT
        const links = await this.linkObjectRepo.find({
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
          const doubleLinks: LinkedObjectExport[] = await this.getDoubleLinkCollection(link);

          // verify doublelink from source
          const verifyDoubleLink = await this.deleteService
            .verifyDoubleLink(doubleLinks, this.linkObjectRepo);

          result.total_record_doubled += verifyDoubleLink.doubleLinks.length;
          await this.removeDoubleLinks(verifyDoubleLink.doubleLinks);

          result.total_record_notfound += verifyDoubleLink.notFoundLinks.length;
          // make export table is same with source table
          await this.deleteService.deleteExportTable(verifyDoubleLink.notFoundLinks
            , this.linkObjectExpRepo);
        }
        result.total_record_invalided += invalidLinks.length;
        await this.removeInvalidLinks(invalidLinks);

        await this.deleteService.insert2ExportTable(goodLinks, this.linkObjectExpRepo);
        await this.deleteService.Delay(100);
      } catch (err) {
        Graylog.getInstance().LogError(err);
      }

    } while (pageSelected >= MAX_RECORD_SELECT);
    result.finished_clean_time = new Date();
    await this.deleteService.insertResult(result);
  }
}
