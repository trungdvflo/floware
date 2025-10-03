import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { loadConfig } from '../common/configs/aws.config';
import { AppModule } from './app.module';
import { WORKER_NAME } from './common/constants/worker.constant';

async function bootstrap() {
  await loadConfig();
  const app = await NestFactory.createMicroservice(AppModule);
  // app.listen();
  // log info
  Logger.log(`${WORKER_NAME} is running`);
}
bootstrap();