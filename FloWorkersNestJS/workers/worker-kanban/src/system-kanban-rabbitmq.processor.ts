import { Injectable } from '@nestjs/common';
import { WORKER_KANBAN } from '../../common/constants/worker.constant';
import { TSystemKanban } from '../../common/interface/kanban.interface';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { KanbanService } from './kanban.service';

@Injectable()
export class SystemKanbanRabbitMQProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly kanbanService: KanbanService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: WORKER_KANBAN.CREATE_SYSTEM_QUEUE,
      concurrency: WORKER_KANBAN.CREATE_SYSTEM_JOB.CONCURRENCY
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.kanbanService);
  }

  async process(job: JobMQ, kanbanService: KanbanService) {
    try {
      const { userId,
        email, collectionId, isMigrate = false } = job.data;
      const data: TSystemKanban = {
        user_id: userId,
        email,
        collection_id: collectionId,
        is_migrate: isMigrate
      };
      await kanbanService.createSystemKanbanOfCollection(data);
      return true;
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