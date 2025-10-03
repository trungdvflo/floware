import { Injectable } from '@nestjs/common';
import { WORKER_KANBAN } from '../../common/constants/worker.constant';
import { TKanban } from '../../common/interface/kanban.interface';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { KanbanService } from './kanban.service';

@Injectable()
export class DeleteKanbanRabbitMQProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly kanbanService: KanbanService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: WORKER_KANBAN.DELETE_QUEUE,
      concurrency: WORKER_KANBAN.DELETE_JOB.CONCURRENCY
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.kanbanService);

  }

  async process(job: JobMQ, kanbanService: KanbanService) {
    try {
      const { userId, email, kanbanIds } = job.data;
      const data: TKanban = {
        user_id: userId,
        email,
        kanban_ids: kanbanIds
      };
      await kanbanService.deleteKanbanAndKanbanCard(data);
      return true;
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