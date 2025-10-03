import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { loadConfig } from '../common/configs/aws.config';
import { AppModule } from './app.module';

async function bootstrap() {
  await loadConfig();
  await NestFactory.createApplicationContext(AppModule);
  Logger.log(`Realtime worker is running`);
}
bootstrap();