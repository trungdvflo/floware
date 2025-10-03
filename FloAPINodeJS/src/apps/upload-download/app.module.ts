import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NODE_ENV } from '../../common/constants/env';
import { AppRegister } from '../../common/entities/app-register.entity';
import { LoggerModule } from '../../common/logger/logger.module';
import appConfig from '../../configs/app';
import redisConfig from '../../configs/redis';
import {
  CommentAttachmentModule
} from '../../modules/comment-attachment/comment-attachment.module';
import { DatabaseModule } from '../../modules/database/database.module';
import { MonitorModule } from '../../modules/monitor/monitor.module';
import { HeadersNonAuthMiddleware } from '../../modules/oauth/non-auth.middleware';
import { HeaderAuthorizationMiddleware } from '../../modules/oauth/oauth.middleware';
import { OAuthModule } from '../../modules/oauth/oauth.module';
import { externalAuthRoutes, headerNonAuthRoutes, nonAuthRoutes } from './routes';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
      ignoreEnvFile: process.env.NODE_ENV === NODE_ENV.production,
    }),
    ConfigModule.forFeature(appConfig),
    ConfigModule.forFeature(redisConfig),
    TypeOrmModule.forFeature([AppRegister]),
    LoggerModule,
    DatabaseModule,
    OAuthModule,
    MonitorModule,
    CommentAttachmentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppUploadModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HeadersNonAuthMiddleware)
      .forRoutes(...headerNonAuthRoutes);
    consumer.apply(HeaderAuthorizationMiddleware)
      .exclude(...nonAuthRoutes)
      .forRoutes(...externalAuthRoutes);
  }
}