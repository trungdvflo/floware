import {
  Process,
  Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { WORKER_OBJECT } from '../../common/constants/worker.constant';
import { IResetObject } from '../../common/interface/object.interface';
import { Graylog } from '../../common/utils/graylog';
import { ObjectService } from './object.service';

@Processor(WORKER_OBJECT.RESET_QUEUE)
export class ResetObjectProcessor {
  constructor(private readonly objectService: ObjectService) { }

  @Process({
    name: WORKER_OBJECT.RESET_JOB.NAME,
    concurrency: WORKER_OBJECT.RESET_JOB.CONCURRENCY
  })
  async resetObjectOrderHandler(job: Job): Promise<void> {
    try {
      const { user_id, email, obj_type, request_uid, data_input } = job.data;
      const data: IResetObject = {
        user_id, email, obj_type,
        request_uid, data_input, job_id: job.id
      };
      return await this.objectService.handleResetOrder(data);
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_OBJECT.RESET_QUEUE,
        jobName: WORKER_OBJECT.RESET_JOB.NAME,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}