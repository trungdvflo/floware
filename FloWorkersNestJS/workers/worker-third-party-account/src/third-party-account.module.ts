import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import rabbitmqConfig from '../../common/configs/rabbitmq.config';
import { WORKER_THIRD_PARTY_ACCOUNT } from '../../common/constants/worker.constant';
import { ApiLastModifiedCommonModule } from '../../common/modules/last-modified/api-last-modify-common.module';
import { LastModifyRepository } from '../../common/repository/api-last-modify.repository';
import { ContactHistoryRepository } from '../../common/repository/contact-history.repository';
import { DeleteItemRepository } from '../../common/repository/delete-item.repository';
import { EmailTrackingRepository } from '../../common/repository/email-tracking.repository';
import { KanbanCardRepository } from '../../common/repository/kanban-card.repository';
import { LinksCollectionObjectRepository } from '../../common/repository/links-collection-object.repository';
import { LinksObjectRepository } from '../../common/repository/links-object.repository';
import { RecentObjectRepository } from '../../common/repository/recent-object.repository';
import { SortObjectRepository } from '../../common/repository/sort-object.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { ThirdPartyAccountRabbitMQProcessor } from './third-party-account-rabbitmq.processor';
import { ThirdPartyAccountProcessor } from './third-party-account.processor';
import { ThirdPartyAccountService } from './third-party-account.service';
@Module({
  imports: [
    ConfigModule,
    ApiLastModifiedCommonModule,
    TypeORMModule.forCustomRepository([
      LinksCollectionObjectRepository,
      LinksObjectRepository,
      SortObjectRepository,
      ContactHistoryRepository,
      EmailTrackingRepository,
      KanbanCardRepository,
      RecentObjectRepository,
      DeleteItemRepository,
      LastModifyRepository,
    ]),
    BullModule.registerQueueAsync({
      name: rabbitmqConfig().enable ? null : WORKER_THIRD_PARTY_ACCOUNT.QUEUE
    })
  ],
  providers: [
    ThirdPartyAccountService,
    ...(rabbitmqConfig().enable
      ? [RabbitMQQueueService, ThirdPartyAccountRabbitMQProcessor]
      : [ThirdPartyAccountProcessor])
  ],
})
export class ThirdPartyAccountWorker { }
