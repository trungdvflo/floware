import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import cfGraylog from '../../configs/log';
import { LoggerService } from './logger.service';
@Module({
  imports: [ConfigModule.forFeature(cfGraylog)],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
