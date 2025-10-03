import { Worker } from 'bullmq';
import { IGraylog } from '../commons/interfaces/graylog.interface';
import { Graylog } from '../configs/graylog.config';

export type WorkerHealth = {
  name: string,
  isRunning: boolean,
  isPaused: boolean,
  isSlow: boolean
};
export abstract class BaseWorker {
  private readonly job: any;
  private readonly worker: Worker;
  constructor(job: any, worker: Worker) {
    this.job = job;
    this.worker = worker;
  }

  async pause(): Promise<void> {
    return await this.worker.pause();
  }

  resume(): void {
    return this.worker.resume();
  }

  async terminate() {
    // 1. emit socket notice to server
    // 2. server send mail to admin
    // tslint:disable-next-line: no-console
    console.log("Start close");
    await this.worker.close();
    // tslint:disable-next-line: no-console
    console.log("Close Done");
    process.exit();
  }

  async healthCheck(): Promise<WorkerHealth> {
    return {
      name: this.worker.name,
      isPaused: this.worker.isPaused(),
      isRunning: this.worker.isRunning(),
      isSlow: false// SOON
    };
  }

  listenHandler() {
    process.on('SIGTERM', async () => {
      this.terminate();
    });

    this.worker.on('completed', (job) => {
      const graylogData: IGraylog = {
        moduleName: job.queueName,
        jobName: job.name,
        message: 'Queue is completed',
        fullMessage: job.data
      };
      Graylog.getInstance().SendLog(graylogData);
    });

    this.worker.on('failed', (job, err) => {
      // Sentry.captureException(err);
      Graylog.getInstance().SendLog({
        moduleName: job.queueName,
        jobName: job.name,
        message: 'Queue is failed',
        fullMessage: err.message,
      });
    });

    this.worker.on('error', (err) => {
      Graylog.getInstance().LogError(err);
    });
  }
}
