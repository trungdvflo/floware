import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NODE_ENV } from './common/constants/env';
import { AppRegister } from './common/entities/app-register.entity';
import { GraylogInterceptor } from './common/interceptors/graylog.interceptor';
import appConfig from './configs/app';
import redisConfig from './configs/redis';
import slackConfig from './configs/slack';

import redisClusterConfig from './configs/redis-cluster';
import { externalAuthRoutes, headerNonAuthRoutes, nonAuthRoutes } from './configs/routes';
import uploadConfig from './configs/upload.config';
import { ApiLastModifiedModule } from './modules/api-last-modified/api-last-modified.module';
import { AutoUpdateModule } from './modules/auto-update/auto-update.module';
import { CallingHistoryModule } from './modules/calling-history/call-history.module';
import { ChatModule } from './modules/chat-realtime/chat-realtime.module';
import { ClientReportErrorModule } from './modules/client-report-error/client-report-error.module';
import { CloudModule } from './modules/cloud/cloud.module';
import { CommentModule } from './modules/collection-comment/comment.module';
import { CollectionHistoryModule } from './modules/collection-history/history.module';
import { CollectionIconsModule } from './modules/collection-icons/collection-icons.module';
import { CollectionMemberModule } from './modules/collection-member/collection-member.module';
import { CollectionModule } from './modules/collection/collection.module';
import { SystemCollectionModule } from './modules/collection/system/system-collection.module';
import { CollectionActivityModule } from './modules/collection_activity/collection-activity.module';
import { CollectionInstanceMemberModule } from './modules/collection_instance_member/collection-instance-member.module';
import { CollectionNotificationModule } from './modules/collection_notification/collection-notification.module';
import { CommentAttachmentModule } from './modules/comment-attachment/comment-attachment.module';
import { Communication } from './modules/communication/communication.module';
import { ConferencingModule } from './modules/conference-channel/conference-channel.module';
import { ConferenceChatModule } from './modules/conference-chat/conference-chat.module';
import { ConferenceHistoryModule } from './modules/conference-history/conference-history.module';
import { ConferenceInviteModule } from './modules/conference-invite/conference-invite.module';
import { ConferenceMemberModule } from './modules/conference-member/conference-member.module';
import { ContactAvatarModule } from './modules/contact-avatar/contact-avatar.module';
import { CredentialModule } from './modules/credential/credential.module';
import { DatabaseModule } from './modules/database/database.module';
import { DevicetokenModule } from './modules/devicetoken/devicetoken.module';
import { DynamicKeyModule } from './modules/dynamic-key/dynamic-key.module';
import { FileModule } from './modules/file-attachment/file-attachment.module';
import { FileMemberModule } from './modules/file-member/file-member.module';
import { HistoryModule } from './modules/history/history.module';
import { KanbanCardModule } from './modules/kanban-card/kanban-card.module';
import { KanbanModule } from './modules/kanban/kanban.module';
import {
    LinkedCollectionObjectMemberModule
} from './modules/link/collection-member/linked-collection-object-member.module';
import { LinkedCollectionObjectModule } from './modules/link/collection/linked-collection-object.module';
import { LinkedObjectModule } from './modules/link/object/linked-object.module';
import { ManualRuleModule } from './modules/manual-rule/manual-rule.module';
import { MetadataEmailModule } from './modules/metadata-email/metadata-email.module';
import { MonitorModule } from './modules/monitor/monitor.module';
import { HeadersNonAuthMiddleware } from './modules/oauth/non-auth.middleware';
import { HeaderAuthorizationMiddleware } from './modules/oauth/oauth.middleware';
import { OAuthModule } from './modules/oauth/oauth.module';
import { PlatformReleaseModule } from './modules/platform-release/platform-release.module';
import { PlatformSettingDefaultModule } from './modules/platform-setting-default/platform-setting-default.module';
import { PlatformSettingModule } from './modules/platform-setting/platform-setting.module';
import { ProtectPageModule } from './modules/protect_page/protect_page.module';
import { RecentObjectModule } from './modules/recent-object/recent-object.module';
import { GlobalSettingModule } from './modules/setting/setting.module';
import { ShareMemberModule } from './modules/share-member/share-member.module';
import { SortObjectsModule } from './modules/sort-object/sort-object.module';
import { SubscriptionModule } from './modules/subcription/subscription.module';
import { SeggestedCollectionModule } from './modules/suggested_collection/suggested_collection.module';
import { TodoModule } from './modules/todo/todo.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { TrashMemberModule } from './modules/trash-member/trash-member.module';
import { TrashModule } from './modules/trash/trash.module';
import { UrlMembersModule } from './modules/url-member/url-member.module';
import { UrlsModule } from './modules/urls/urls.module';
import { UsersModule } from './modules/users/users.module';
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // set this to `true` to use wildcards
      wildcard: false,
      // the delimiter used to segment namespaces
      delimiter: '.',
      // set this to `true` if you want to emit the newListener event
      newListener: false,
      // set this to `true` if you want to emit the removeListener event
      removeListener: false,
      // the maximum amount of listeners that can be assigned to an event
      maxListeners: 10,
      // show event name in memory leak message
      // ..when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
      // disable throwing uncaughtException if an error
      // ..event is emitted and it has no listeners
      ignoreErrors: false,
    }),
    ConfigModule.forRoot({
      expandVariables: true,
      ignoreEnvFile: process.env.NODE_ENV === NODE_ENV.production,
    }),
    ConfigModule.forFeature(appConfig),
    ConfigModule.forFeature(redisConfig),
    ConfigModule.forFeature(redisClusterConfig),
    ConfigModule.forFeature(uploadConfig),
    ConfigModule.forFeature(slackConfig),
    TypeOrmModule.forFeature([AppRegister]),
    DatabaseModule,
    OAuthModule,
    UsersModule,
    TrashModule,
    TrashMemberModule,
    UrlsModule,
    UrlMembersModule,
    AutoUpdateModule,
    CloudModule,
    RecentObjectModule,
    SortObjectsModule,
    PlatformReleaseModule,
    ApiLastModifiedModule,
    HistoryModule,
    CallingHistoryModule,
    FileModule,
    TrackingModule,
    GlobalSettingModule,
    CollectionModule,
    DynamicKeyModule,
    PlatformSettingModule,
    LinkedCollectionObjectModule,
    LinkedCollectionObjectMemberModule,
    LinkedObjectModule,
    MetadataEmailModule,
    DevicetokenModule,
    KanbanModule,
    KanbanCardModule,
    PlatformSettingDefaultModule,
    TodoModule,
    SystemCollectionModule,
    MonitorModule,
    ShareMemberModule,
    CollectionMemberModule,
    ManualRuleModule,
    CollectionInstanceMemberModule,
    SeggestedCollectionModule,
    FileMemberModule,
    ContactAvatarModule,
    SubscriptionModule,
    ConferencingModule,
    ContactAvatarModule,
    SubscriptionModule,
    ConferenceMemberModule,
    ProtectPageModule,
    ConferenceHistoryModule,
    ConferenceInviteModule,
    CollectionIconsModule,
    CommentModule,
    CollectionHistoryModule,
    CollectionActivityModule,
    CollectionNotificationModule,
    CommentAttachmentModule,
    ConferenceChatModule,
    CredentialModule,
    Communication,
    ChatModule,
    ClientReportErrorModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: GraylogInterceptor,
    },
  ],
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