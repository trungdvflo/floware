import { InjectQueue } from '@nestjs/bull';
import { Injectable, Optional } from '@nestjs/common';
import { Queue } from 'bull';
import { QuotaEntity } from '../../common/models/quota.entity';
import { QuotaRepository } from '../../common/repository/quota.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import rabbitmqConfig from '../../common/configs/rabbitmq.config';
import {
  SUBSCRIPTION_SEND_EMAIL_JOB,
  SUBSCRIPTION_SEND_EMAIL_QUEUE,
  SubcriptionValue as config
} from '../common/constants/worker.constant';
import { EmailObject } from './email.object';

@Injectable()
export class SubcriptionCronJobService {
  private readonly sendEmailRabbitMQ: RabbitMQQueueService;
  constructor(
    @Optional()
    @InjectQueue(SUBSCRIPTION_SEND_EMAIL_QUEUE)
    private readonly sendEmailQueue: Queue | null,
    private readonly quotaRepo: QuotaRepository
  ) {
    this.sendEmailRabbitMQ = new RabbitMQQueueService({
      name: SUBSCRIPTION_SEND_EMAIL_QUEUE,
    });
  }

  async get_users_full_storage(){
    const sub_sql = `SELECT q.username AS email, q.bytes, q.cal_bytes, q.card_bytes
    , q.file_bytes,q.num_sent
    , CASE
        WHEN (sc.purchase_status IS NULL) THEN
    ((SUM(q.bytes+q.cal_bytes+q.card_bytes+q.file_bytes+q.qa_bytes)*100)/${config.free})
        ELSE
    ((SUM(q.bytes+q.cal_bytes+q.card_bytes+q.file_bytes+q.qa_bytes)*100)/(sd.sub_value*1024*1024*1024))
      END AS percent
    , sc.purchase_status
    FROM quota q
    LEFT JOIN user u ON u.email = q.username
    LEFT JOIN subscription_purchase sc ON sc.user_id = u.id AND sc.is_current = 1
    LEFT JOIN subscription s ON s.id = sc.sub_id
    LEFT JOIN subscription_detail sd ON s.id = sd.sub_id AND sd.com_id = 1
    WHERE (sc.purchase_status IS NULL)
      OR (sc.purchase_status = 1 AND s.subs_type = 0)
      OR (sc.purchase_status = 1 AND s.subs_type = 1)
      OR (sc.purchase_status = 1 AND s.subs_type = 2)
    GROUP BY q.username`;
    const sql = `SELECT res.*
        ,IF(res.percent >= ${config.percent80} && res.percent < ${config.percent100},'${config.nearFullTemp}','${config.fullTemp}') as template
        ,IF(res.percent >= ${config.percent80} && res.percent < ${config.percent100},'${config.nearFullSubj}','${config.fullSubj}') as subject
      FROM (${sub_sql}) AS res
      WHERE
        (res.percent >= ${config.percent80} AND res.percent < ${config.percent95} AND res.num_sent = 0)
        OR (res.percent >= ${config.percent95} AND res.percent < ${config.percent100} AND res.num_sent <= 1)
        OR (res.percent >= ${config.percent100} AND res.num_sent <= 2)`;

    return await this.quotaRepo.manager.query(sql);
  }

  async get_users_expire(){
    const sub_sql = `SELECT  pc.user_id, pc.sub_id
        , pc.purchase_status, pc.created_date, u.email
      FROM subscription_purchase pc
      LEFT JOIN user u ON u.id = pc.user_id
      WHERE pc.purchase_status > 0
      ORDER BY pc.created_date DESC`;
    const sql = `SELECT res.*
        , sc.subs_type
        , '${config.expireTemp}' as template, '${config.expireSubj}' as subject
        , DATE_ADD( DATE(FROM_UNIXTIME(res.created_date)), INTERVAL sc.period DAY ) as expired
      FROM (${sub_sql}) AS res
      LEFT JOIN subscription sc ON sc.id = res.sub_id
      WHERE (
        sc.period > 0 AND
        (
          (DATEDIFF(DATE(CURDATE()), DATE(FROM_UNIXTIME(res.created_date)) ) IN(${config.mSendBefore})
            AND sc.period = ${config.monthly})
          OR
          (DATEDIFF(DATE(CURDATE()), DATE(FROM_UNIXTIME(res.created_date)) ) IN(${config.ySendBefore})
             AND sc.period = ${config.yearly})
        )
      )
      AND res.purchase_status > 0
      GROUP BY res.user_id`;

    return await this.quotaRepo.manager.query(sql);
  }

  async pushQueue(quotas: EmailObject[]) {
    if (quotas && quotas.length > 0){
      const quotaNumSents: QuotaEntity[] = [];
      for(const u of quotas) {
        // sent email, bullmq
        if (rabbitmqConfig().enable) {
          await this.sendEmailRabbitMQ.addJob(SUBSCRIPTION_SEND_EMAIL_JOB.NAME, u);
        } else {
          await this.sendEmailQueue.add(SUBSCRIPTION_SEND_EMAIL_JOB.NAME, u);
        }
        // update num sent
        if (u.num_sent || u.num_sent === 0){
          const numSent = u.num_sent + 1;
          // quotaNumSents.push(this.quotaRepo.create({
          //   username: u.email,
          //   num_sent: numSent,
          // }));
          await this.update_num_sent_query (u.email, numSent);
        }
      }
      // await this.update_num_sent(quotaNumSents);
    }
  }

  async update_num_sent (quotas: QuotaEntity[]) {
    if (quotas.length > 0) {
      await this.quotaRepo.save(quotas);
    }
  }

  async update_num_sent_query (email: string, num_sent: number) {
    const sql = "UPDATE `quota` SET `num_sent` = ? WHERE `username` = ?";
    return await this.quotaRepo.manager.query(sql, [num_sent, email]);
  }

  async executeCron(cronStatus) {
    const users_expire = await this.get_users_expire();
    await this.pushQueue(users_expire);
    const users_full = await this.get_users_full_storage();
    await this.pushQueue(users_full);
  }
}