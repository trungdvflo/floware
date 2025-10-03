import { Graylog } from '../../../configs/graylog.config';
import { QueueName } from '../../../commons/constants/queues.contanst';
import { ContactHistoryService } from '../services/contact-history.service';
import { KanbanCardService } from '../services/kanban-card.service';
import { LinkedCollectionObjectService } from '../services/linked-collection-object.service';
import { LinkedObjectService } from '../services/linked-object.service';
import { ThirdPartyAccountService } from '../services/third-party-account.service';

export class DeleteLinkInvalidJob {
  private readonly third3rdAccService = new ThirdPartyAccountService();
  private readonly linkCollObjectService = new LinkedCollectionObjectService();
  private readonly linkObjectService = new LinkedObjectService();
  private readonly kanbanCardService = new KanbanCardService();
  private readonly contactHistoryService = new ContactHistoryService();

  async CleanLinkInvalidData(cronDelLinkStatus, config) {
    try {
      // can not check in export data, because we need the newest data
      // await this.third3rdAccService.export();

      await this.linkCollObjectService.cleanLink();
      await this.linkObjectService.cleanLink();
      await this.kanbanCardService.cleanLink();
      await this.contactHistoryService.cleanLink();
    } catch (error) {
      cronDelLinkStatus.isRunning = false;
      // We catch here to make sure this step
      // not block any other steps
      Graylog.getInstance().SendLog({
        moduleName: QueueName.DELETE_LINK_INVALID_CRON_JOB,
        message: `ERROR: ${QueueName.DELETE_LINK_INVALID_CRON_JOB}`,
        fullMessage: error.message,
      });
      throw error;
    }
  }
}
