import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WORKER_CALDAV_QUEUE } from '../common/constants/worker.constant';
import { loadConfig } from '../common/configs/aws.config';
import { AppModule } from './app.module';

async function bootstrap() {
  await loadConfig();
  const app = await NestFactory.createMicroservice(AppModule);
  // app.listen();
  // log info
  Logger.log(`${WORKER_CALDAV_QUEUE.NAME} is running `);
}
bootstrap();