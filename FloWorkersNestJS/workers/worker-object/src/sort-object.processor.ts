import {
  Process,
  Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { CALDAV_OBJ_TYPE } from '../../common/constants/common.constant';
import { WORKER_OBJECT } from '../../common/constants/worker.constant';
import { Graylog } from '../../common/utils/graylog';
import { SortObjectService } from './sort-object.service';

@Processor(WORKER_OBJECT.SORT_QUEUE)
export class SortObjectProcessor {
  constructor(private readonly sortObjectService: SortObjectService) { }

  @Process({
    name: WORKER_OBJECT.SORT_JOB.NAME,
    concurrency: WORKER_OBJECT.SORT_JOB.CONCURRENCY
  })
  async resetObjectOrderHandler(job: Job): Promise<boolean> {
    try {
      const { request_uid, email, object_type, objects } = job.data;
      if (request_uid && email && objects) {
        return await this.sortObjectService
          .handleSortOrder({
            request_uid,
            email,
            object_type,
            objects: objects.map((item) => ({
              ...item,
              object_uid: object_type === CALDAV_OBJ_TYPE.VTODO ? item.uid : item.id
            }))
          });
      }
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_OBJECT.SORT_QUEUE,
        jobName: WORKER_OBJECT.SORT_JOB.NAME,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}