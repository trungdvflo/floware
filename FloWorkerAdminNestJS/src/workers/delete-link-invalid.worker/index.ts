import { CronJob } from 'cron';
import fs from 'fs';
import appRoot from 'app-root-path';
import { DeleteLinkInvalidJob } from './jobs/delete-link.job';
import { Graylog } from '../../configs/graylog.config';
import { QueueName } from '../../commons/constants/queues.contanst';
import { ConnectionOptions, createConnection, getRepository, Repository } from 'typeorm';
import { Config } from './entities/config.entity';
import { join } from 'path';
import { CONN_EXP_NAME } from './constant';

const cronDelLinkStatus = { isRunning: false };
export class DeleteLinkInvalidWorker {
  private deleteJob: DeleteLinkInvalidJob;
  private configRepo: Repository<Config>;

  private readonly connectExport: ConnectionOptions = {
    name: CONN_EXP_NAME,
    type: 'mysql',
    host: process.env.MYSQL_EXPORT_HOST || 'localhost',
    port: Number(process.env.MYSQL_EXPORT_PORT) || 3306,
    username: process.env.MYSQL_EXPORT_USERNAME,
    password: process.env.MYSQL_EXPORT_PASSWORD,
    database: process.env.MYSQL_EXPORT_DB,
    ssl:
      process.env.MYSQL_EXPORT_SSL
      && (process.env.MYSQL_EXPORT_SSL === '1'
        || process.env.MYSQL_EXPORT_SSL.toLowerCase() === 'true')? {
            ca: fs.readFileSync(
              process.env.MYSQL_CERT_PATH || `${appRoot}/pem_files/rds-combined-ca-bundle.pem`
            )
          }
        : { rejectUnauthorized: false },
    logging: false,
    entities: [
      join(__dirname, '/entities/', '*.entity.{ts,js}'),
    ],
    bigNumberStrings: false,
    extra: {
      connectionLimit: 5
    }
  };

  constructor() {
    createConnection(this.connectExport).then(conn => {
      const deleteLinkJob = new DeleteLinkInvalidJob();
      this.deleteJob = deleteLinkJob;
      this.configRepo = getRepository(Config, conn.name);
      this.pushChange();
    }).catch(err => {
      throw err;
    });
  }

  async pushChange() {
    try {
      const config = await this.getConfig();
      const CronPushChange = new CronJob({
        cronTime: config.cron_time,
        onTick: async () => {
          if (cronDelLinkStatus.isRunning) return;
          cronDelLinkStatus.isRunning = true;
          const cron_active = await this.getConfig();
          if (cron_active.cron_active === 1) {
            await this.deleteJob.CleanLinkInvalidData(cronDelLinkStatus, config);
          }
          cronDelLinkStatus.isRunning = false;
        }
      });
      CronPushChange.start();
    } catch (err) {
      Graylog.getInstance().SendLog({
        moduleName: QueueName.DELETE_LINK_INVALID_CRON_JOB,
        message: `ERROR: ${QueueName.DELETE_LINK_INVALID_CRON_JOB}`,
        fullMessage: err.message,
      });
      throw err;
    }
  }

  async getConfig(){
    const config = {
      cron_time: "0 1 * * *",
      cron_active: 0
    };
    const configs = await this.configRepo.find();
    for (const c of configs) {
      config[c.key] = c.value;
    }
    return config;
  }
}
// tslint:disable-next-line: no-unused-expression
new DeleteLinkInvalidWorker();
