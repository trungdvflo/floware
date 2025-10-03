import {
  Process,
  Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { IDeleteLinksObject } from '../../common/interface/links-object.interface';
import { Graylog } from '../../common/utils/graylog';
import { LINK_OBJECT_JOB, LINK_OBJECT_QUEUE } from '../common/constants/worker.constant';
import { LinksObjectService } from './links-object.service';

@Processor(LINK_OBJECT_QUEUE)
export class DeleteObjectProcessor {
  constructor(private readonly linksObjectService: LinksObjectService) { }

  @Process({ name: LINK_OBJECT_JOB.NAME, concurrency: LINK_OBJECT_JOB.CONCURRENCY })
  async deleteObjectHandler(job: Job): Promise<void> {
    this.handleDeleteRelatedObject(job);
  }

  async handleDeleteRelatedObject(job: Job) {
    try {
      const { objectUid, userId, email, objectId = 0, objectType } = job.data;
      const data: IDeleteLinksObject = {
        user_id: userId,
        email,
        object_type: objectType,
        object_uid: objectUid,
        object_id: objectId
      };
      await this.linksObjectService.deleteRelatedObject(data);
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: LINK_OBJECT_QUEUE,
        jobName: LINK_OBJECT_JOB.NAME,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}