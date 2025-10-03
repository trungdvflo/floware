import { Injectable } from '@nestjs/common';
import { OBJ_TYPE } from '../../common/constants/common.constant';
import { WORKER_INVALID_DATA_DELETION, WORKER_INVALID_FLO_MAIL_COLLECTOR } from '../../common/constants/worker.constant';
import { EmailObjectId } from '../../common/dtos/object-uid';
import { IEmailDeletion } from '../../common/interface/invalid-data.interface';
import { FloInvalidLinkRepository } from '../../common/repository/flo-invalid-link.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';

@Injectable()
export class InvalidFloMailService {
  constructor(
    private readonly invalidLinkRepo: FloInvalidLinkRepository,
    private readonly floInvalidDataQueue: RabbitMQQueueService
  ) {
    this.floInvalidDataQueue = new RabbitMQQueueService(
      { name: WORKER_INVALID_DATA_DELETION.QUEUE });
  }

  async removeConsidering(data: IEmailDeletion) {
    try {
      return this.invalidLinkRepo
        .removeFILConsidering(data);
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_INVALID_FLO_MAIL_COLLECTOR.QUEUE,
        jobName: WORKER_INVALID_FLO_MAIL_COLLECTOR.JOB.RMV_CONSIDERING,
        message: error.code,
        fullMessage: error.message
      });
      return error;
    }
  }

  async processAfterDeleteMail(data: IEmailDeletion) {
    try {
      const { user_id, object_uid, email, total } = await this.invalidLinkRepo
        .collectInvalidLinkToEmail(data);

      const { uid, path } = new EmailObjectId({
        emailBuffer: object_uid
      }).getPlain();
      //

      await this.floInvalidDataQueue.addJob(
        WORKER_INVALID_DATA_DELETION.JOB.NAME, {
        id: 0,
        user_id,
        object_uid: null,
        object_type: OBJ_TYPE.EMAIL,
        uid,
        path
      });

      return { user_id, object_uid, email, total };
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_INVALID_FLO_MAIL_COLLECTOR.QUEUE,
        jobName: WORKER_INVALID_FLO_MAIL_COLLECTOR.JOB.DELETED_MAIL,
        message: error.code,
        fullMessage: error.message
      });
      return error;
    }
  }
}