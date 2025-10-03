import { Injectable } from '@nestjs/common';
import { INVALID_LINK_FLOMAIL_FINDER, WORKER_INVALID_FLO_OBJECT_COLLECTOR } from '../../common/constants/worker.constant';
import { ICollectObject4User, IUserProcess } from '../../common/interface/invalid-data.interface';
import { FloInvalidLinkRepository } from '../../common/repository/flo-invalid-link.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';

@Injectable()
export class InvalidFloObjectService {
  constructor(
    private readonly invalidLinkRepo: FloInvalidLinkRepository,
    private readonly floMailFinderQueue: RabbitMQQueueService,
    private readonly floInvalidObjCollectorQueue: RabbitMQQueueService
  ) {
    this.floMailFinderQueue = new RabbitMQQueueService(
      { name: INVALID_LINK_FLOMAIL_FINDER.QUEUE });

    this.floInvalidObjCollectorQueue = new RabbitMQQueueService(
      { name: WORKER_INVALID_FLO_OBJECT_COLLECTOR.QUEUE });
  }

  async scanInvalidLinkPerUser(usr: IUserProcess) {
    // collect invalid per user
    const { nCount } = await this.recursiveCollectInvalid4User(usr);
    // update scanned to db
    await this.invalidLinkRepo
      .updateUserProcessInvalidData({ ...usr, objScanning: 0, objScanned: 1 });
    //
    Graylog.getInstance().logInfo({
      moduleName: WORKER_INVALID_FLO_OBJECT_COLLECTOR.QUEUE,
      jobName: WORKER_INVALID_FLO_OBJECT_COLLECTOR.JOB.NAME,
      message: `uScanned:: ${usr.user_id}`,
      fullMessage: `last phase count:: ${nCount}`
    });
  }

  async recursiveCollectInvalid4User(usr, lastResult = null): Promise<ICollectObject4User> {
    const rs = await this.invalidLinkRepo.collectInvalidLinks4User(lastResult, usr);
    if (rs.nCount >= rs.nMaxTurn) {
      return await this.recursiveCollectInvalid4User(usr, JSON.stringify(rs));
    }
    return rs;
  }
}