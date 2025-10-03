import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import rabbitmqConfig from '../../common/configs/rabbitmq.config';
import { WORKER_CALDAV_QUEUE } from '../../common/constants/worker.constant';
import { CalendarInstanceRepository } from '../../common/repository/calendar-instance.repository';
import { CalendarObjectsRepository } from '../../common/repository/calendar-objects.repository';
import { CalendarRepository } from '../../common/repository/calendar.repository';
import { CollectionRepository } from '../../common/repository/collection.repository';
import { LinksCollectionObjectRepository } from '../../common/repository/links-collection-object.repository';
import { SettingRepository } from '../../common/repository/setting.repository';
import { UserRepository } from '../../common/repository/user.repository';
import { CommonCollectionService } from '../../common/services/collection.common.service';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { CaldavService } from './caldav.service';
import { CaldavRabbitMQProcessor } from './delete-caldav-rabbitmq.processor';
import { CaldavProcessor } from './delete-caldav.processor';
@Module({
  imports: [
    ConfigModule,
    TypeORMModule.forCustomRepository([
      CollectionRepository,
      UserRepository,
      SettingRepository,
      CalendarRepository,
      CalendarInstanceRepository,
      CalendarObjectsRepository,
      LinksCollectionObjectRepository
    ]),
    BullModule.registerQueueAsync(
      { name: rabbitmqConfig().enable ? null : WORKER_CALDAV_QUEUE.QUEUE },
    )
  ],
  providers: [
    CaldavService,
    CommonCollectionService,
    ...(rabbitmqConfig().enable
      ? [RabbitMQQueueService, CaldavRabbitMQProcessor]
      : [CaldavProcessor])
  ],
})
export class DeleteCaldavWorker { }
