const amqplib = require("amqplib");
const RabbitConfig = require('../../../default/configs/RabbitConfig');
const Server = require('../../app').server;
const LogsUtil = require('../../../default/utilities/Logs');
/*
export class JobMQ {
  jobName: string;
  data: any;
}
export class RabbitOptional {
  name: string;
  concurrency?: number;
}
type FunctionTypeMQ = (obj: JobMQ, service: any) => any;
*/

module.exports = class RabbitMQQueueService {
  // private conn: any;
  // private chanel: any;
  // private queueName: string;
  // private concurrency: number = 10;
  // private process: FunctionTypeMQ;
  // private service: any;

  /**
   * 
   * @param {
   *  name: string;
   *  concurrency?: number;
   * } option 
   */
  constructor(option) {
    if (option) {
      this.queueName = option.name;
      if (option.concurrency) {
        this.concurrency = option.concurrency;
      }
    }
  }

  async createConnect() {
    const config = RabbitConfig;
    this.conn = await amqplib.connect({
      protocol: 'amqps',
      hostname: config.host,
      port: config.port,
      username: config.user,
      password: config.password,
      vhost: config.vhost,
      heartbeat: config.heartbeat,
      publisher_confirms: true,
      timeout: config.timeout
    });
    this.conn.on("error", (err) => {
      this.logInfo(err);
      this.resetConnect();
    });
    this.conn.on("close", () => {
      this.logInfo('connection close then reconnect');
      this.resetConnect();
    });
    this.chanel = await this.conn.createChannel();
    await this.chanel.assertQueue(this.queueName);
    this.chanel.on("error", (err) => {
      this.logInfo(err);
      this.resetConnect();
    });
    this.chanel.on("close", () => {
      this.logInfo('connection close then reconnect');
      this.resetConnect();
    });
    this.chanel.prefetch(this.concurrency);
  }

  clearConnect() {
    this.conn = undefined;
    this.chanel = undefined;
  }

  resetConnect() {
    clearTimeout(this.timeOut);
    this.clearConnect();
    this.timeOut = setTimeout(async () => {
      await this.createConnect();
      this.addProcessor(this.process, this.service);
    }, 2000);
  }

  logInfo(obj) {
    // filter const logMessage = LogsUtil.Filter(obj);
    Server.log('RabbitmqService', {
      data: obj
    });
  }

  /**
   * 
   * @param { string } queueName 
   */
  async assertQueue(queueName) {
    this.queueName = queueName;
  }
  /**
   * Sender. Add job to queue
   * @param { string } jobName: name of job
   * @param { object } data: data object
   * @returns
   */
  async addJob(jobName, data) {
    if (!data || typeof data !== 'object') return;
    try {
      if (!this.conn) {
        await this.createConnect();
      }
      const jobMQ = {
        jobName,
        data
      };
      const dataString = JSON.stringify(jobMQ);
      this.chanel.sendToQueue(this.queueName, Buffer.from(dataString));
      return true;
    } catch (error) {
      this.logInfo(error);
      throw error;
    }
  }

}