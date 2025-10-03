import {
  OnQueueFailed,
  Process,
  Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { WORKER_KANBAN } from '../../common/constants/worker.constant';
import { TKanban } from '../../common/interface/kanban.interface';
import { Graylog } from '../../common/utils/graylog';
import { KanbanService } from './kanban.service';

@Processor(WORKER_KANBAN.DELETE_QUEUE)
export class DeleteKanbanProcessor {
  constructor(private readonly kanbanService: KanbanService) { }

  @Process({
    name: WORKER_KANBAN.DELETE_JOB.NAME,
    concurrency: WORKER_KANBAN.DELETE_JOB.CONCURRENCY
  })
  async deleteKanbanHandler(job: Job): Promise<void> {
    this.handleDeleteKanban(job);
  }

  @OnQueueFailed()
  onError(job: Job<any>, error) {
    Graylog.getInstance().logInfo({
      moduleName: WORKER_KANBAN.DELETE_QUEUE,
      jobName: WORKER_KANBAN.DELETE_JOB.NAME,
      message: error.message,
      fullMessage: `Failed job ${job.id}: ${error.message}`
    });
  }

  async handleDeleteKanban(job: Job) {
    try {
      const { userId, email, kanbanIds } = job.data;
      const data: TKanban = {
        user_id: userId,
        email,
        kanban_ids: kanbanIds
      };
      await this.kanbanService.deleteKanbanAndKanbanCard(data);
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_KANBAN.DELETE_QUEUE,
        jobName: WORKER_KANBAN.DELETE_JOB.NAME,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}