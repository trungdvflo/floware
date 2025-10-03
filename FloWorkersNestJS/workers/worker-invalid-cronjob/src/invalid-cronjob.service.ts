import { Injectable } from '@nestjs/common';
import {
  INVALID_LINK_FLOMAIL_FINDER,
  WORKER_INVALID_DATA_DELETION,
  WORKER_INVALID_FLO_OBJECT_COLLECTOR
} from '../../common/constants/worker.constant';
import { EmailObjectId } from '../../common/dtos/object-uid';
import { IEmailDeletion } from '../../common/interface/invalid-data.interface';
import { FloInvalidLinkRepository } from '../../common/repository/flo-invalid-link.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { sleep } from '../../common/utils/common';
import { Graylog } from '../../common/utils/graylog';
import { mMaxQueue, nLIMIT, nOFFSET } from '../../worker-invalid-data-deletion/commons/constant';

@Injectable()
export class InvalidCronjobService {
  constructor(
    private readonly invalidLinkRepo: FloInvalidLinkRepository,
    private readonly floMailFinderQueue: RabbitMQQueueService,
    private readonly floInvalidObjCollectorQueue: RabbitMQQueueService,
    private readonly floInvalidDataQueue: RabbitMQQueueService,

  ) {
    this.floMailFinderQueue = new RabbitMQQueueService(
      { name: INVALID_LINK_FLOMAIL_FINDER.QUEUE });

    this.floInvalidObjCollectorQueue = new RabbitMQQueueService(
      { name: WORKER_INVALID_FLO_OBJECT_COLLECTOR.QUEUE });

    this.floInvalidDataQueue = new RabbitMQQueueService(
      { name: WORKER_INVALID_DATA_DELETION.QUEUE });
  }

  async scanObjectToMakeSureExisted(page = 0): Promise<number> {
    try {
      const listUsers = await this.invalidLinkRepo
        .getListUserToScanFloObject(nOFFSET + (page * nLIMIT), nLIMIT);

      if (!listUsers?.length) { return 0; }
      // loop users
      for (const usr of listUsers) {
        await this.floInvalidObjCollectorQueue
          .addJob(WORKER_INVALID_FLO_OBJECT_COLLECTOR.JOB.NAME,
            usr);
        await this.invalidLinkRepo
          .updateUserProcessInvalidData({ ...usr, objScanning: 1 });
      }
      if (listUsers.length === nLIMIT) {
        sleep(2000);
        page = page + 1;
        return await this.scanObjectToMakeSureExisted(page);
      }
      return listUsers.length;
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: INVALID_LINK_FLOMAIL_FINDER.QUEUE,
        jobName: INVALID_LINK_FLOMAIL_FINDER.JOB.NAME,
        message: error.code,
        fullMessage: error.message
      });
      return 0;
    }
  }

  async scanEmailToMakeSureExisted(page = 0): Promise<number> {
    try {
      const listUsers = await this.invalidLinkRepo
        .getListUserToScanEmailLink(nOFFSET + (page * nLIMIT), nLIMIT);
      if (!listUsers?.length) { return 0; }
      // loop users
      for (const usr of listUsers) {
        await this.considerEmailList(usr);
      }

      if (listUsers?.length === nLIMIT) {
        sleep(2000);
        page = page + 1;
        return this.scanEmailToMakeSureExisted(page);
      }
      return listUsers.length;
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: INVALID_LINK_FLOMAIL_FINDER.QUEUE,
        jobName: INVALID_LINK_FLOMAIL_FINDER.JOB.NAME,
        message: error.code,
        fullMessage: error.message
      });
      return 0;
    }
  }

  async considerEmailList(usr) {
    const listEmails = await this.invalidLinkRepo
      .getListEmailLinks4User(usr);
    if (listEmails?.length > 0) {
      // update scanning to db
      await this.invalidLinkRepo.updateUserProcessInvalidData({ ...usr, emailScanning: 1 });
      // loop email listed per user
      for (const email of listEmails) {
        await this.considerSingleEmailLink(email, usr);
      }
    }
    // update scanned to db
    await this.invalidLinkRepo
      .updateUserProcessInvalidData({ ...usr, emailScanning: 0, emailScanned: 1 });
    if (listEmails.length) {
      Graylog.getInstance().logInfo({
        moduleName: INVALID_LINK_FLOMAIL_FINDER.QUEUE,
        jobName: INVALID_LINK_FLOMAIL_FINDER.JOB.NAME,
        message: `uScanned:: ${usr.user_id}`,
        fullMessage: `total emails count:: ${listEmails.length}`
      });
    }
  }

  async considerSingleEmailLink(email, usr) {
    try {
      const { uid, path } = new EmailObjectId({ emailBuffer: email.object_uid });
      const emailNeedToFind: IEmailDeletion = { email: usr.username, uid, path };
      // only check existed in INBOX & OMNI
      const needConsider: 1 | -1 = ['INBOX', 'OMNI'].includes(path.toUpperCase()) ? 1 : -1;
      if (needConsider) {
        await this.floMailFinderQueue.publishMessage(emailNeedToFind);
      }
      //
      await this.invalidLinkRepo
        .collectInvalidLinkToEmail({
          email: usr.username,
          uid, path
          // make CONSIDERING to logged this link is considering for scanning then rate limit
        }, email.object_uid, needConsider);
    } catch (err) {
      // remove invalid link to email object immediate
      await this.invalidLinkRepo
        .collectInvalidLinkToEmail({
          email: usr.username,
          uid: 0,
          path: ''
        }, email.object_uid);
      Graylog.getInstance().logInfo({
        moduleName: INVALID_LINK_FLOMAIL_FINDER.QUEUE,
        jobName: INVALID_LINK_FLOMAIL_FINDER.JOB.NAME,
        message: 'EMAIL UID ERROR: Collected',
        fullMessage: err
      });
    }
  }

  async collectToQueueToCleanInvalidData(page = 0) {
    try {
      const lsObj = await this.invalidLinkRepo
        .getListInvalidLink(nOFFSET + (page * mMaxQueue), mMaxQueue);
      if (!lsObj?.length) {
        return 0;
      }
      // publish to queue
      await this.floInvalidDataQueue.addJob(
        WORKER_INVALID_DATA_DELETION.JOB.NAME, lsObj);
      // update processing
      await this.invalidLinkRepo
        .updateProcess(lsObj.map(fil => fil.id));
      sleep(100);
      if (lsObj.length === mMaxQueue) {
        // page = page + 1;
        return this.collectToQueueToCleanInvalidData(page);
      }
      return lsObj.length;
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_INVALID_DATA_DELETION.QUEUE,
        jobName: WORKER_INVALID_DATA_DELETION.JOB.NAME,
        message: error.code,
        fullMessage: error.message
      });
      return error;
    }
  }
}