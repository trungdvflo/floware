import { NestFactory } from '@nestjs/core';
import { loadEnvironment } from 'configs/env.config';
import { AppGenArnModule } from './app.arn.module';

async function mainArn() {
  await loadEnvironment();

  const app = await NestFactory.create(AppGenArnModule);
  await app.init();
  // await app.close();

  console.log(
    `successfull`,
  );
}
mainArn();
