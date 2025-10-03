import { Injectable } from '@nestjs/common';
import { OBJ_TYPE } from '../../common/constants/common.constant';
import { WORKER_INVALID_DATA_DELETION } from '../../common/constants/worker.constant';
import { EmailObjectId } from '../../common/dtos/object-uid';
import { IObjectInvalid } from '../../common/interface/invalid-data.interface';
import { FloInvalidLinkRepository } from '../../common/repository/flo-invalid-link.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';

@Injectable()
export class InvalidDataDeletionService {
  constructor(
    private readonly invalidLinkRepo: FloInvalidLinkRepository,
    private readonly floInvalidDataQueue: RabbitMQQueueService
  ) {
    this.floInvalidDataQueue = new RabbitMQQueueService(
      { name: WORKER_INVALID_DATA_DELETION.QUEUE });
  }

  async deleteInvalidLink({
    id,
    user_id,
    object_uid,
    object_type,
    uid,
    link_id,
    link_type,
    path
  }: IObjectInvalid): Promise<number> {
    try {
      let emailBuff: Buffer = null;
      if (uid > 0 && path.length) {
        emailBuff = new EmailObjectId({ uid, path }).objectUid;
      }
      if (id > 0) {
        return await this.invalidLinkRepo.removeSingleInvalidLinks({
          id,
          link_id,
          link_type,
          user_id
        });
      }

      const count = await this.invalidLinkRepo.cleanInvalidLinks4User({
        id,
        object_uid: emailBuff || object_uid,
        object_type: emailBuff ? Buffer.from(OBJ_TYPE.EMAIL) : object_type,
        user_id
      });
      return count;
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_INVALID_DATA_DELETION.QUEUE,
        jobName: WORKER_INVALID_DATA_DELETION.JOB.NAME,
        message: error.code,
        fullMessage: error.message
      });
      return 0;
    }
  }
}