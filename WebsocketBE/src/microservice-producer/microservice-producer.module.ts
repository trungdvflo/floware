import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelModule } from '../channel/channel.module';
import { ClientName } from '../common/constants/subscriber';
import { Message, MessageSendItem } from '../database/entities';
import { ChannelMemberRepository } from '../database/repositories';
import { ChannelRepository } from '../database/repositories/channel.reposotory';
import { MessageModule } from '../message/message.module';
import { MicroserviceProducerService } from './miccroservice-producer.service';
import { TestController } from './test.contoller';
@Module({
  imports: [
    MessageModule,
    ChannelModule,
    TypeOrmModule.forFeature([Message, MessageSendItem, MessageChannel]),
    ClientsModule.registerAsync([
      {
        name: ClientName.RMQ_REALTIME_MODULE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              `amqps://${configService.get('RABBIT_MQ_USER')}:${configService.get(
                'RABBIT_MQ_PASS'
              )}@${configService.get('RABBIT_MQ_HOST')}:${configService.get('RABBIT_MQ_PORT')}`,
            ],
            queue: configService.get('RABBIT_MQ_QUEUE'),
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [TestController],
  providers: [MicroserviceProducerService, ChannelRepository, ChannelMemberRepository],
})
export class MicroServiceProducerModule {}
