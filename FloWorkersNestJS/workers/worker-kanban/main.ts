import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { loadConfig } from '../common/configs/aws.config';
import { WORKER_KANBAN } from '../common/constants/worker.constant';
import { AppModule } from './app.module';

async function bootstrap() {
  await loadConfig();
  const app = await NestFactory.createMicroservice(AppModule);
// app.listen();
  // log info
  Logger.log(`${WORKER_KANBAN.NAME} is running`);
}
bootstrap();