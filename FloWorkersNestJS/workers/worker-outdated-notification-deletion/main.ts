import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { loadConfig } from '../common/configs/aws.config';
import { NOTIFICATION_OUTDATED_CLEANER } from '../common/constants/worker.constant';
import { AppModule } from './app.module';

async function bootstrap() {
  await loadConfig();
  const app = await NestFactory.createMicroservice(AppModule);
  // app.listen();
  // log info
  Logger.log(`${NOTIFICATION_OUTDATED_CLEANER.QUEUE} is running`);
}
bootstrap();