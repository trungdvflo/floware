import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadEnvVarFromAwsSsM } from './configs/env.config';

async function bootstrap() {
  await loadEnvVarFromAwsSsM();

  const app = await NestFactory.create(AppModule);
  const cfgApp = app.get<ConfigService>(ConfigService);
  app.enableCors();

  // set redis adapter
  const configService = app.get<ConfigService>(ConfigService);
  const redisWsAdapter = await WebsocketAdapterFactory.createAdapter(app, configService);
  app.useWebSocketAdapter(redisWsAdapter);

  await app.listen(cfgApp.get('app.port'));
  LoggerService.getInstance().logInfo(
    `is running on: ${await app.getUrl()} - version ${cfgApp.get('app.version')}`
  );

  // await bootstrapMicroservice(app)
}
bootstrap();

import { INestApplication } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoggerService } from './common/logger/logger.service';
import { WebsocketAdapterFactory } from './websocket/adapter/websocket-factory.adapter';

async function bootstrapMicroservice(app: INestApplication) {
  const configService = app.get(ConfigService);

  const user = configService.get('RABBIT_MQ_USER');
  const password = configService.get('RABBIT_MQ_PASS');
  const host = configService.get('RABBIT_MQ_HOST');
  const queueName = configService.get('RABBIT_MQ_QUEUE');
  const port = configService.get('RABBIT_MQ_PORT');
  await app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqps://${user}:${password}@${host}:${port}`],
      queue: queueName,
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
}
