import { Injectable } from '@nestjs/common';
import { LessThan, UpdateResult } from 'typeorm';
import { ILastModify } from '../../interface/api-last-modify.interface';
import { GetOptionInterface } from '../../interface/typeorm.interface';
import { PushChangeEntity } from '../../models/push-change.entity';
import { LastModifyRepository } from '../../repository/api-last-modify.repository';
import { PushChangeRepository } from '../../repository/push-change.repository';
import { TimestampDouble } from '../../utils/common';
import { LastModifiedEventMetadata } from '../communication/events/api-last-modified.event';
import { Persistence, RealTimeMessageCode } from '../communication/interfaces';
import { RealTimeService } from '../communication/services';

@Injectable()
export class CommonApiLastModifiedService {
  constructor(
    private readonly apiLastModifiedRepository: LastModifyRepository,
    private readonly pushChangeRepository: PushChangeRepository,
    private readonly realTimeService: RealTimeService
  ) { }

  async sendLastModifyByCollection(data: ILastModify) {
    return await this.apiLastModifiedRepository.sendLastModifyForShareCollection(data);
  }

  async sendLastModifyByConference(data: ILastModify) {
    return await this.apiLastModifiedRepository.sendLastModifyForShareConference(data);
  }

  async createLastModify(data: ILastModify, fromInternal: boolean) {
    const result: UpdateResult = await this.apiLastModifiedRepository.update({
      api_name: data.api_name,
      user_id: data.user_id,
      api_modified_date: LessThan(data.updated_date)
    }, {
      api_modified_date: data.updated_date
    });
    if (result.affected === 0) {
      const lastModify = await this.apiLastModifiedRepository
        .getItemByOptions({
          fields: ['id'],
          conditions: {
            api_name: data.api_name,
            user_id: data.user_id,
          }
        });
      // If not found, insert new record
      if (!lastModify) {
        const date = TimestampDouble();
        await this.apiLastModifiedRepository.insert({
          api_modified_date: data.updated_date,
          api_name: data.api_name,
          user_id: data.user_id,
          created_date: date,
          updated_date: date
        });
      }
    }
    // Send to realtime service when send from internal
    await this.fwdToRealtimeService(data, fromInternal);
    await this.upsertPushChange(data);
  }

  async fwdToRealtimeService(data: ILastModify, fromInternal: boolean) {
    if (!fromInternal) {
      return;
    }
    await this.realTimeService.sendSystemEventToIndividual
      (data.email,
        RealTimeMessageCode.API_LAST_MODIFIED,
        `You got last modified for API: ${data.api_name}`,
        {
          api_name: data.api_name,
          updated_date: data.updated_date,
          event_timestamp: data.updated_date
        } as LastModifiedEventMetadata,
        Persistence.NONE_PERSISTENCE);
  }

  async upsertPushChange(data: ILastModify) {
    const almOption: GetOptionInterface<PushChangeEntity> = {
      fields: ['id'],
      conditions: {
        user_id: data.user_id
      }
    };
    const existedEntity = await this.pushChangeRepository.getItemByOptions(almOption);

    if (!existedEntity) {
      await this.pushChangeRepository.createPushChange(data);
    }
    return true;
  }
}