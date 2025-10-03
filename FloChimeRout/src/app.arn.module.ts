import {
  MiddlewareConsumer,
  Module,
  NestModule
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NODE_ENV } from 'common/constants/environment.constant';
import { LoggerModule } from 'common/logger/logger.module';
import { GenerateArnModule } from 'modules/generate-arn/generate-arn.module';
import appConfig from './configs/app.config';
import chimeConfig from './configs/chime.config';
import redisConfig from './configs/redis.config';
import dbConfig from './configs/sql';
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, dbConfig, redisConfig, chimeConfig],
      expandVariables: true,
      ignoreEnvFile: process.env.NODE_ENV === NODE_ENV.production,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
    }),
    LoggerModule,
    GenerateArnModule,
  ],
})
export class AppGenArnModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
}
