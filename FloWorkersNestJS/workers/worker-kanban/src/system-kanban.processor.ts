import {
  OnQueueFailed,
  Process,
  Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { WORKER_KANBAN } from '../../common/constants/worker.constant';
import { TSystemKanban } from '../../common/interface/kanban.interface';
import { Graylog } from '../../common/utils/graylog';
import { KanbanService } from './kanban.service';

@Processor(WORKER_KANBAN.CREATE_SYSTEM_QUEUE)
export class SystemKanbanProcessor {
  constructor(private readonly kanbanService: KanbanService) {}

  @Process({
    name: WORKER_KANBAN.CREATE_SYSTEM_JOB.NAME,
    concurrency: WORKER_KANBAN.CREATE_SYSTEM_JOB.CONCURRENCY
  })
  async createSystemKanbanOfCollectionHandler(job: Job): Promise<void> {
    this.handleCreateSystemKanbanOfCollection(job);
  }

  @OnQueueFailed()
  onError(job: Job<any>, error) {
    Graylog.getInstance().logInfo({
      moduleName: WORKER_KANBAN.CREATE_SYSTEM_QUEUE,
      jobName: WORKER_KANBAN.CREATE_SYSTEM_JOB.NAME,
      message: error.message,
      fullMessage: `Failed job ${job.id}: ${error.message}`
    });
    return error;
  }

  async handleCreateSystemKanbanOfCollection(job: Job) {
    try {
      const { userId,email, collectionId, isMigrate = false } = job.data;
      const data: TSystemKanban = {
        user_id: userId,
        email,
        collection_id: collectionId,
        is_migrate: isMigrate
      };
      await this.kanbanService.createSystemKanbanOfCollection(data);
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_KANBAN.CREATE_SYSTEM_QUEUE,
        jobName: WORKER_KANBAN.CREATE_SYSTEM_JOB.NAME,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}