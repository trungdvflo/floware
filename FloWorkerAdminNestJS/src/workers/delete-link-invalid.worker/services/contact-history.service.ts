import { Graylog } from '../../../configs/graylog.config';
import { getRepository, LessThan, MoreThan } from 'typeorm';
import { CONN_EXP_NAME, DELETED_ITEM_TYPE, MAX_RECORD_SELECT } from '../constant';
import { ContactHistoryDelete } from '../entities/contact-history-delete.entity';
import { ContactHistoryExport } from '../entities/contact-history-export.entity';
import { ContactHistory } from '../entities/contact-history.entity';
import { IdUserEntity } from '../entities/id.entity';
import { ResultCleanLink } from '../entities/result-clean-link.entity';
import { DeleteService } from './delete.service';

export class ContactHistoryService {
  private readonly contactHistoryRepo = getRepository(ContactHistory);
  private readonly contactHistoryExpRepo = getRepository(ContactHistoryExport, CONN_EXP_NAME);
  private readonly contactHistoryDelRepo = getRepository(ContactHistoryDelete, CONN_EXP_NAME);

  private readonly deleteService = new DeleteService();

  private getSrcAccIds(links: ContactHistory[]) {
    const accSrcIds = new Set<number>();
    for (const l of links) {
      accSrcIds.add(l.destination_account_id);
    }

    return {
      accSrcIds: Array.from(accSrcIds),
    };
  }

  private getDesAccIds(links: ContactHistory[]) {
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
  async getInvalid3rdAccount(links: ContactHistory[], accIds: number[], isSrc: boolean) {
    const invalidLinks: ContactHistory[] = [];
    const goodLinks: ContactHistory[] = [];
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

  private async getInvalid(links: ContactHistory[]) {
    const { accSrcIds } = this.getSrcAccIds(links);
    const invalidSrc3rd = await this
      .getInvalid3rdAccount(links, accSrcIds, true);
    const { accDesIds } = this.getDesAccIds(invalidSrc3rd.goodLinks);
    const invalidDes3rd = await this
      .getInvalid3rdAccount(invalidSrc3rd.goodLinks, accDesIds, false);

    return {
      invalidLinks: invalidSrc3rd.invalidLinks.concat(invalidDes3rd.invalidLinks),
      goodLinks: invalidDes3rd.goodLinks
    };
  }

  /**
   * Get all record which the same (double) with link, not include the link.
   * Get in export data
   * @param link ContactHistory
   * @returns Promise<ContactHistory[]>
   */
  private async getDoubleLinkCollection(link: ContactHistory)
    : Promise<ContactHistoryExport[]> {
    const l1 = await this.contactHistoryExpRepo.find({
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
    const l2 = await this.contactHistoryExpRepo.find({
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
        , this.contactHistoryRepo
        , DELETED_ITEM_TYPE.HISTORY);
      // insert to deleted table db log
      await this.deleteService.insert2DeleteTable(doubleLinks
        , this.contactHistoryDelRepo);
      // make export table is same with source table
      await this.deleteService.deleteExportTable(doubleLinks
        , this.contactHistoryExpRepo);
    }
  }

  private async removeInvalidLinks(invalidLinks: IdUserEntity[]) {
    if (invalidLinks.length > 0) {
      // delete from source
      await this.deleteService.removeLinksFromSource(invalidLinks
        , this.contactHistoryRepo
        , DELETED_ITEM_TYPE.HISTORY);
      // insert to deleted table db log
      await this.deleteService.insert2DeleteTable(invalidLinks
        , this.contactHistoryDelRepo);
    }
  }

  async cleanLink() {
    let pageSelected = 0;
    const maxId = await this.deleteService.getMaxIdofTable(this.contactHistoryExpRepo);
    let last_id = maxId;
    const result = new ResultCleanLink();
    result.name = this.contactHistoryRepo.metadata.tableName;
    result.total_record_scaned = 0;
    result.total_record_invalided = 0;
    result.total_record_doubled = 0;
    result.total_record_notfound = 0;
    result.started_clean_time = new Date();
    do {
      try {
        // get new links from source, paging MAX_RECORD_SELECT
        const links = await this.contactHistoryRepo.find({
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
          const doubleLinks: ContactHistoryExport[] = await this.getDoubleLinkCollection(link);

          // verify doublelink from source
          const verifyDoubleLink = await this.deleteService
            .verifyDoubleLink(doubleLinks, this.contactHistoryRepo);

          result.total_record_doubled += verifyDoubleLink.doubleLinks.length;
          await this.removeDoubleLinks(verifyDoubleLink.doubleLinks);

          result.total_record_notfound += verifyDoubleLink.notFoundLinks.length;
          // make export table is same with source table
          await this.deleteService.deleteExportTable(verifyDoubleLink.notFoundLinks
            , this.contactHistoryExpRepo);
        }
        result.total_record_invalided += invalidLinks.length;
        await this.removeInvalidLinks(invalidLinks);

        await this.deleteService.insert2ExportTable(goodLinks, this.contactHistoryExpRepo);
        await this.deleteService.Delay(100);
      } catch (err) {
        Graylog.getInstance().LogError(err);
      }

    } while (pageSelected >= MAX_RECORD_SELECT);
    result.finished_clean_time = new Date();
    await this.deleteService.insertResult(result);
  }
}
