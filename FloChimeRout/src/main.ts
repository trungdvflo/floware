import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { loadEnvironment } from 'configs/env.config';
import { AppModule } from './app.module';

async function bootstrap() {
  await loadEnvironment();

  const app = await NestFactory.create(AppModule);
  const cfgApp = app.get<ConfigService>(ConfigService);
  await app.listen(cfgApp.get('app.port'));

  console.log(
    `is running on: ${await app.getUrl()} - version ${cfgApp.get(
      'app.version',
    )}`,
  );
}
bootstrap();
