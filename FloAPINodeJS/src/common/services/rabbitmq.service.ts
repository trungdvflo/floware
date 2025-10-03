import * as amqplib from 'amqplib';
import rabbitmqConfig from '../../configs/rabbitmq.config';
import { LoggerService } from '../logger/logger.service';

export class JobMQ {
  jobName: string;
  data: any;
}

export class RabbitOptional {
  name: string;
  concurrency?: number;
}

type FunctionTypeMQ = (obj: JobMQ, service: any) => any;

export class RabbitMQQueueService {
  private connection: any;
  private channel: any;
  private queueName: string;
  private concurrency: number = 10;
  private process: FunctionTypeMQ;
  private service: any;
  private timeOut;

  constructor(option: RabbitOptional) {
    if (option) {
      this.queueName = option.name;
      if (option.concurrency) {
        this.concurrency = option.concurrency;
      }
    }
    // make sure only enable Rabbit by FLAG to allow create amq connection
    if (rabbitmqConfig().enable) {
      this.createConnect();
    }
  }

  async createConnect() {
    try {
      const config = rabbitmqConfig();
      this.connection = await amqplib.connect({
        protocol: config.protocol,
        hostname: config.host,
        port: config.port,
        username: config.user,
        password: config.password,
        vhost: config.vhost,
        heartbeat: config.heartbeat,
        publisher_confirms: true,
        timeout: config.timeout
      });
      this.connection.on("error", (err) => {
        LoggerService.getInstance().logInfo(`RabbitMQ:: ${ err.message }`);
        this.resetConnect();
      });
      this.connection.on("close", () => {
        LoggerService.getInstance().logInfo('RabbitMQ:: connection close then reconnect');
        this.resetConnect();
      });
      this.channel = await this.connection.createConfirmChannel();
      await this.channel.assertQueue(this.queueName);
      this.channel.on("error", (err) => {
        LoggerService.getInstance().logInfo(`RabbitMQ:: ${ err.message }`);
        this.resetConnect();
      });
      this.channel.on("close", () => {
        LoggerService.getInstance().logInfo('RabbitMQ:: connection close then reconnect');
        this.resetConnect();
      });
      this.channel.prefetch(this.concurrency);
    } catch (error) {
      LoggerService.getInstance().logInfo('RabbitMQ:: connection error');
      this.resetConnect();
    }
  }

  private clearConnect() {
    // this.connection.close();
    this.connection = undefined;
    this.channel = undefined;
  }

  private resetConnect() {
    clearTimeout(this.timeOut);
    this.clearConnect();
    this.timeOut = setTimeout(async () => {
      await this.createConnect();
    }, 2000);
  }

  async assertQueue(queueName: string) {
    this.queueName = queueName;
  }
  /**
   * Sender. Add job to queue
   * @param jobName
   * @param data
   * @returns
   */
  async addJob(jobName: string, data: object) {
    if (!data || typeof data !== 'object') return;
    try {
      if (!this.connection) {
        await this.createConnect();
      }
      const jobMQ: JobMQ = {
        jobName,
        data
      };
      const dataString = JSON.stringify(jobMQ);
      this.channel.sendToQueue(this.queueName, Buffer.from(dataString));
      return true;
    } catch (error) {
      LoggerService.getInstance().logInfo(`RabbitMQ:: ${ error }`);
      return false;
    }
  }
}