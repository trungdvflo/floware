import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NODE_ENV } from './common/constants/env';
import { externalAuthRoutes, headerNonAuthRoutes, nonAuthRoutes } from './configs/routes';
import { HeadersNonAuthMiddleware } from './modules/oauth/non-auth.middleware';
import { HeaderAuthorizationMiddleware } from './modules/oauth/oauth.middleware';
import { OAuthModule } from './modules/oauth/oauth.module';
import appConfig from './configs/app';
import redisConfig from './configs/redis';
import { DatabaseModule } from './modules/database/database.module';
import { CommentAttachmentModule } from './modules/comment-attachment/comment-attachment.module';
import { MonitorModule } from './modules/monitor/monitor.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
      ignoreEnvFile: process.env.NODE_ENV === NODE_ENV.production,
    }),
    ConfigModule.forFeature(appConfig),
    ConfigModule.forFeature(redisConfig),
    LoggerModule,
    DatabaseModule,
    OAuthModule,
    MonitorModule,
    CommentAttachmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HeadersNonAuthMiddleware)
      .forRoutes(...headerNonAuthRoutes);
    consumer.apply(HeaderAuthorizationMiddleware)
      .exclude(...nonAuthRoutes)
      .forRoutes(...externalAuthRoutes);
  }
}