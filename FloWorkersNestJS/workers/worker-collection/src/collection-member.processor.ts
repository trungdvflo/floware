import {
  Process,
  Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { WORKER_COLLECTION } from '../../common/constants/worker.constant';
import { ICollectionMember } from '../../common/interface/collection.interface';
import { Graylog } from '../../common/utils/graylog';
import { CollectionService } from './collection.service';

@Processor(WORKER_COLLECTION.QUEUE)
export class CollectionMemberProcessor {
  constructor(private readonly collectionService: CollectionService) { }

  @Process({
    name: WORKER_COLLECTION.COLLECTION_MEMBER_JOB.NAME,
    concurrency: WORKER_COLLECTION.COLLECTION_MEMBER_JOB.CONCURRENCY
  })
  async collectionMemberHandler(job: Job): Promise<boolean> {
    return this.handlerDeleteCollectionMember(job);
  }

  async handlerDeleteCollectionMember(job: Job) {
    try {
      const { userId, email, collectionMemberIds } = job.data;
      const data: ICollectionMember = {
        owner_id: userId,
        email,
        collection_member_ids: collectionMemberIds
      };
      if (collectionMemberIds.length > 0) {
        await this.collectionService.handleDeleteCollectionMember(data);
      }
      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_COLLECTION.QUEUE,
        jobName: WORKER_COLLECTION.COLLECTION_TREE_JOB.NAME,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}