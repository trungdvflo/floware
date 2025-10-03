import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { json, static as exStatic, urlencoded } from 'express';
import { join } from 'path';
import { AllExceptionsFilter } from '../../common/filters/validation-exception.filters';
import { loadConfig } from '../../configs/config';
import { AppUploadModule } from './app.module';

async function bootstrap() {
  await loadConfig();
  const app = await NestFactory.create(AppUploadModule);
  app.use(cookieParser());
  app.use(exStatic(join(__dirname, 'assets')));
  const httpAdapter = app.getHttpAdapter() as any;
  const cfgApp = app.get<ConfigService>(ConfigService);
  const logger = new Logger(); // set logger global
  if (cfgApp.get('app.swaggerUi')) {
    const config = new DocumentBuilder()
      .setTitle(`${cfgApp.get('app.name')}`)
      .setDescription('The NestJS API Download/Upload')
      .setVersion(`${cfgApp.get('app.version')}`)
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.use(json({ limit: cfgApp.get('app.limitBodySize') }));
  app.use(urlencoded({ limit: cfgApp.get('app.limitBodySize'), extended: true }));
  await app.listen(cfgApp.get('app.port'));
  // log info
  logger.log(`is running on: ${await app.getUrl()} - version ${cfgApp.get('app.version')}`);
  logger.log(`URL: ${process.env.BASE_URL} - version ${cfgApp.get('app.version')}`);
}
bootstrap();
