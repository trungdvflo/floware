import * as amqplib from 'amqplib';
import { Graylog } from '../configs/graylog.config';
import { rabbitmqConfig } from '../configs/rabbitmq.config';

export class JobMQ {
  jobName: string;
  data: any;
}

class RabbitOptional {
  name: string;
  concurrency?: number;
}

type FunctionTypeMQ = (obj: JobMQ, service: any) => any;

export class RabbitMQQueueService {
  private static connection: any = null;
  private queueName: string;
  private concurrency: number = 10;
  private process: FunctionTypeMQ;
  private service: any;
  private timeOut;
  private static channel: any;
  constructor(option: RabbitOptional) {
    if (option) {
      this.queueName = option.name;
      if (option.concurrency) {
        this.concurrency = option.concurrency;
      }
    }
  }

  async createConnect() {
    try {
      const config = rabbitmqConfig();
      if (!RabbitMQQueueService.connection) {
        RabbitMQQueueService.connection = await amqplib.connect({
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
      }

      Graylog.getInstance().LogError({
        moduleName: 'RabbitMQ::',
        message: "Connected successfully!"
      });

      RabbitMQQueueService.connection.on("error", (err) => {
        Graylog.getInstance().LogError({
          moduleName: 'RabbitMQ::connection error',
          message: err.message
        });
        this.resetConnect();
      });
      RabbitMQQueueService.connection.on("close", () => {
        Graylog.getInstance().LogError({
          moduleName: 'RabbitMQ:: connection close',
          message: 'connection close then reconnect'
        });
        this.resetConnect();
      });
      RabbitMQQueueService.channel = await RabbitMQQueueService.connection.createChannel();
      await RabbitMQQueueService.channel.assertQueue(this.queueName);
      RabbitMQQueueService.channel.prefetch(this.concurrency);
    } catch (error) {
      this.resetConnect();
      Graylog.getInstance().LogError({
        moduleName: 'RabbitMQ::createConnect',
        message: error.message
      });
    }
  }

  private async closeConnection() {
    try {
      if (RabbitMQQueueService.connection) {
        await RabbitMQQueueService.connection.close();
      }
      if (RabbitMQQueueService.channel) {
        await RabbitMQQueueService.channel.close();
      }
    } catch (error) {
      Graylog.getInstance().LogError({
        moduleName: 'RabbitMQ::closeConnection',
        message: error.message
      });
    }
  }
  private async clearConnect() {
    try {
      await this.closeConnection();
      RabbitMQQueueService.connection = undefined;
      RabbitMQQueueService.channel = undefined;
    } catch (error) {
      Graylog.getInstance().LogError({
        moduleName: 'RabbitMQ::clearConnect',
        message: error.message
      });
    }
  }

  private resetConnect() {
    clearTimeout(this.timeOut);
    Promise.resolve(this.clearConnect());
    this.timeOut = setTimeout(async () => {
      await this.createConnect();
      this.addProcessor(this.process, this.service);
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
      if (!RabbitMQQueueService.connection) {
        await this.createConnect();
      }
      const jobMQ: JobMQ = {
        jobName,
        data
      };
      const dataString = JSON.stringify(jobMQ);
      RabbitMQQueueService.channel.sendToQueue(this.queueName, Buffer.from(dataString));
    } catch (error) {
      Graylog.getInstance().LogError({
        moduleName: 'RabbitMQ::addJob',
        message: error.message
      });
      return error;
    }
  }

  async publishMessage(message: object) {
    if (!message || typeof message !== 'object') return;
    try {
      if (!RabbitMQQueueService.connection) {
        await this.createConnect();
      }
      const messageString = JSON.stringify(message);
      RabbitMQQueueService.channel.sendToQueue(this.queueName, Buffer.from(messageString));
    } catch (error) {
      Graylog.getInstance().LogError({
        moduleName: 'RabbitMQ::publishMessage',
        message: error.message
      });
      return error;
    }
  }

  /**
   * Listener. Listen from queue, process jobs from queue
   * @param process function
   * @param service
   */
  async addProcessor(process: FunctionTypeMQ, service) {
    try {
      this.process = process;
      this.service = service;
      if (!RabbitMQQueueService.connection) {
        await this.createConnect();
      }
      RabbitMQQueueService.channel.consume(this.queueName, async (msg) => {
        if (msg !== null) {
          const contentString = msg.content.toString();
          const contentObject = JSON.parse(contentString);
          try {
            await process(contentObject, service);
            RabbitMQQueueService.channel.ack(msg);
          } catch (error) {
            Graylog.getInstance().LogError({
              moduleName: 'RabbitMQ::channel.consume',
              message: error.message
            });
            return error;
          }
        } else {
          Graylog.getInstance().LogError({
            moduleName: this.queueName,
            jobName: 'Message is null',
          });
        }
      });

    } catch (error) {
      this.resetConnect();
      Graylog.getInstance().LogError({
        moduleName: 'RabbitMQ::addProcessor',
        message: error.message
      });
      return error;
    }
  }
}