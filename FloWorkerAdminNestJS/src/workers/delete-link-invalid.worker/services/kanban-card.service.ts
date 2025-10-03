import { Graylog } from '../../../configs/graylog.config';
import { getRepository, In, LessThan, MoreThan } from 'typeorm';
import { CONN_EXP_NAME, DELETED_ITEM_TYPE, MAX_RECORD_SELECT } from '../constant';
import { IdUserEntity } from '../entities/id.entity';
import { KanbanCardDelete } from '../entities/kanban-card-delete.entity';
import { KanbanCardExport } from '../entities/kanban-card-export.entity';
import { KanbanCard } from '../entities/kanban-card.entity';
import { ResultCleanLink } from '../entities/result-clean-link.entity';
import { DeleteService, Linked } from './delete.service';

export class KanbanCardService {
  private readonly kanbanCardRepo = getRepository(KanbanCard);
  private readonly kanbanCardExpRepo = getRepository(KanbanCardExport, CONN_EXP_NAME);
  private readonly kanbanCardDelRepo = getRepository(KanbanCardDelete, CONN_EXP_NAME);

  private readonly deleteService = new DeleteService();

  private getAccIds(links: KanbanCard[]) {
    const accIds = new Set<number>();
    for (const l of links) {
      accIds.add(l.account_id);
    }

    return {
      accIds: Array.from(accIds),
    };
  }

  private async getInvalid(links: KanbanCard[]) {
    const { accIds } = this.getAccIds(links);
    const invalid3rd = await this.deleteService.getInvalid3rdAccount(links, accIds);

    return invalid3rd;
  }

  /**
   * Get all record which the same (double) with link, not include the link.
   * Get in export data
   * @param link LinkedObject
   * @returns Promise<LinkedObject[]>
   */
  private async getDoubleLinkCollection(link: Linked)
    : Promise<KanbanCardExport[]> {
    return await this.kanbanCardExpRepo.find({
      where: {
        id: LessThan(link.id),
        user_id: link.user_id,
        kanban_id: link.kanban_id,
        object_uid: link.object_uid,
        object_type: link.object_type,
        account_id: link.account_id
      }
    });
  }

  private async removeDoubleLinks(doubleLinks: IdUserEntity[]) {
    if (doubleLinks.length > 0) {
      // delete from source
      await this.deleteService.removeLinksFromSource(doubleLinks
        , this.kanbanCardRepo
        , DELETED_ITEM_TYPE.CANVAS);
      // insert to deleted table db log
      await this.deleteService.insert2DeleteTable(doubleLinks
        , this.kanbanCardDelRepo);
      // make export table is same with source table
      await this.deleteService.deleteExportTable(doubleLinks,
        this.kanbanCardExpRepo);
    }
  }

  private async removeInvalidLinks(invalidLinks: IdUserEntity[]) {
    if (invalidLinks.length > 0) {
      // delete from source
      await this.deleteService.removeLinksFromSource(invalidLinks
        , this.kanbanCardRepo
        , DELETED_ITEM_TYPE.CANVAS);
      // insert to deleted table db log
      await this.deleteService.insert2DeleteTable(invalidLinks
        , this.kanbanCardDelRepo);
    }
  }

  async cleanLink() {
    let pageSelected = 0;
    const maxId = await this.deleteService.getMaxIdofTable(this.kanbanCardExpRepo);
    let last_id = maxId;
    const result = new ResultCleanLink();
    result.name = this.kanbanCardRepo.metadata.tableName;
    result.total_record_scaned = 0;
    result.total_record_invalided = 0;
    result.total_record_doubled = 0;
    result.total_record_notfound = 0;
    result.started_clean_time = new Date();
    do {
      try {
        // get new links from source, paging MAX_RECORD_SELECT
        const links = await this.kanbanCardRepo.find({
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
          const doubleLinks: KanbanCardExport[] = await this.getDoubleLinkCollection(link);

          // verify doublelink from source
          const verifyDoubleLink = await this.deleteService
            .verifyDoubleLink(doubleLinks, this.kanbanCardRepo);

          result.total_record_doubled += verifyDoubleLink.doubleLinks.length;
          await this.removeDoubleLinks(verifyDoubleLink.doubleLinks);

          result.total_record_notfound += verifyDoubleLink.notFoundLinks.length;
          // make export table is same with source table
          await this.deleteService.deleteExportTable(verifyDoubleLink.notFoundLinks
            , this.kanbanCardExpRepo);
        }
        result.total_record_invalided += invalidLinks.length;
        await this.removeInvalidLinks(invalidLinks);

        await this.deleteService.insert2ExportTable(goodLinks, this.kanbanCardExpRepo);
        await this.deleteService.Delay(100);
      } catch (err) {
        Graylog.getInstance().LogError(err);
      }

    } while (pageSelected >= MAX_RECORD_SELECT);
    result.finished_clean_time = new Date();
    await this.deleteService.insertResult(result);
  }
}
