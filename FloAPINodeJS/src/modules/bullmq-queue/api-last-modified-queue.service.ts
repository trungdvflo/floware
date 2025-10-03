import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bull';
import { ApiLastModifiedName, QueueName } from '../../common/constants';
import { JobName } from '../../common/constants/job.constant';
import { HeaderAuth } from '../../common/interfaces';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { LastModify } from '../../common/utils/common';
import rabbitmqConfig from '../../configs/rabbitmq.config';
import {
  EventNames
} from '../communication/events';
import { LastModifiedToCollection, LastModifiedToConference, LastModifiedToIndividual } from '../communication/events/api-last-modified.event';
import { ChannelType, Persistence, RealTimeMessageCode, SendOffline } from '../communication/interfaces';

export interface LastModified {
  userId: number;
  email: string;
  updatedDate?: number;
}

export interface LastModifiedCollection {
  userId: number;
  collectionId?: number;
  updatedDate?: number;
}

export interface LastModifiedConference {
  userId: number;
  channelId?: number;
  updatedDate?: number;
}

export interface LastModifiedMember {
  memberId: number;
  email: string;
  updatedDate?: number;
}

export interface JobLastModified extends LastModified {
  apiName: ApiLastModifiedName;
}

export interface JobLastModifiedCollection extends LastModifiedCollection {
  apiName: ApiLastModifiedName;
}

export interface JobLastModifiedConference extends LastModifiedConference {
  apiName: ApiLastModifiedName;
}

@Injectable()
export class ApiLastModifiedQueueService {
  private readonly rabbitMQQueueService: RabbitMQQueueService;
  constructor(
    @InjectQueue(QueueName().API_LAST_MODIFIED_QUEUE)
    private readonly apiLastModifiedQueue: Queue,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.rabbitMQQueueService = new RabbitMQQueueService({
      name: QueueName().API_LAST_MODIFIED_QUEUE
    });
  }

  async addJob(input: JobLastModified, headers: HeaderAuth) {
    try {
      const jobName = JobName.API_LAST_MODIFIED;
      const jobId = `${jobName}_${input.apiName}_${input.userId}_${input.updatedDate}`;
      // send real-time message individual
      if (input.email) {
        const eventData: LastModifiedToIndividual = {
          headers,
          message_code: RealTimeMessageCode.API_LAST_MODIFIED,
          email: input.email,
          content: `You got last modified for API: ${input.apiName}`,
          metadata: {
            api_name: input.apiName,
            updated_date: input.updatedDate,
            event_timestamp: input.updatedDate
          },
          persistence:Persistence.NONE_PERSISTENCE,
          send_offline: SendOffline.no
        };
        if (headers) {
          this.eventEmitter.emit(EventNames.EVENT_TO_INDIVIDUAL, eventData);
        } else {
          this.eventEmitter.emit(EventNames.SYS_EVENT_TO_INDIVIDUAL, eventData);
        }
      }
      if (rabbitmqConfig().enable) {
        return await this.rabbitMQQueueService.addJob(jobName, { ...input });
      } else {
        return await this.apiLastModifiedQueue.add(jobName, input, { jobId });
      }
    } catch (error) {
      return false;
    }
  }

  async addJobCollection(input: JobLastModifiedCollection, headers: HeaderAuth) {
    try {
      const jobName = JobName.API_LAST_MODIFIED_SHARED_COLLECTION;
      const jobId = `${jobName}_${input.apiName}_${input.userId}_${input.updatedDate}`;
      // send real-time message for shared collection
      if (headers) {
        const eventData: LastModifiedToCollection = {
          headers,
          message_code: RealTimeMessageCode.API_LAST_MODIFIED,
          channelId: input.collectionId,
          type: ChannelType.SHARED_COLLECTION,
          content: `You got last modified for API: ${input.apiName}`,
          metadata: {
            api_name: input.apiName,
            updated_date: input.updatedDate,
            event_timestamp: input.updatedDate
          },
          persistence:Persistence.NONE_PERSISTENCE,
          send_offline: SendOffline.no
        };
        await this.eventEmitter.emit(EventNames.EVENT_TO_CHANNEL, eventData);
      }
      if (rabbitmqConfig().enable) {
        return await this.rabbitMQQueueService.addJob(jobName, { ...input, jobId });
      } else {
        return await this.apiLastModifiedQueue.add(jobName, input, { jobId });
      }
    } catch (error) {
      return false;
    }
  }

  async addJobConference(input: JobLastModifiedConference, headers: HeaderAuth) {
    try {
      const jobName = JobName.API_LAST_MODIFIED_CONFERENCE;
      const jobId = `${jobName}_${input.apiName}_${input.userId}_${input.updatedDate}`;
      // send real-time message for shared collection
      if (headers) {
        const eventData: LastModifiedToConference = {
          headers,
          message_code: RealTimeMessageCode.API_LAST_MODIFIED,
          channelId: input.channelId,
          type: ChannelType.CONFERENCE,
          content: `You got last modified for API: ${input.apiName}`,
          metadata: {
            api_name: input.apiName,
            updated_date: input.updatedDate,
            event_timestamp: input.updatedDate
          },
          persistence:Persistence.NONE_PERSISTENCE,
          send_offline: SendOffline.no
        };
        await this.eventEmitter.emit(EventNames.EVENT_TO_CHANNEL, eventData);
      }
      if (rabbitmqConfig().enable) {
        return await this.rabbitMQQueueService.addJob(jobName, { ...input, jobId });
      } else {
        return await this.apiLastModifiedQueue.add(jobName, input, { jobId });
      }
    } catch (error) {
      return false;
    }
  }

  async sendLastModified(
    itemLastModify: LastModify[], apiName: ApiLastModifiedName, headers?: HeaderAuth) {
    if (!itemLastModify.length) {
      return;
    }
    itemLastModify.forEach(async ({ userId, timeLastModify, email }: LastModify) => {
      if (!timeLastModify.length) {
        return;
      }
      await this.addJob({
        apiName,
        userId,
        email,
        updatedDate: Math.max(...timeLastModify)
      }, headers);
    });
  }

  async sendLastModifiedByCollectionId(
    itemLastModify: LastModify[], apiName: ApiLastModifiedName, headers: HeaderAuth) {
    if (!itemLastModify.length) {
      return;
    }
    itemLastModify.forEach(async ({ collectionId, timeLastModify }: LastModify) => {
      if (!timeLastModify.length) {
        return;
      }
      await this.addJobCollection({
        apiName,
        userId: 0,
        collectionId,
        updatedDate: Math.max(...timeLastModify)
      }, headers);
    });
  }

  async sendLastModifiedByConference(
    itemLastModify: LastModify[], apiName: ApiLastModifiedName, headers: HeaderAuth) {
    if (!itemLastModify.length) {
      return;
    }
    itemLastModify.forEach(async ({ channelId, timeLastModify }: LastModify) => {
      if (!timeLastModify.length) {
        return;
      }
      await this.addJobConference({
        apiName,
        userId: 0,
        channelId,
        updatedDate: Math.max(...timeLastModify)
      }, headers);
    });
  }
}