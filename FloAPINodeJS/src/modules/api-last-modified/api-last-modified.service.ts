import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_ERR_DUPLICATE_ENTRY } from '../../common/constants/message.constant';
import { IReq, IUser } from '../../common/interfaces';
import { LoggerService } from '../../common/logger/logger.service';
import { ApiLastModifiedRepository } from '../../common/repositories/api-last-modified.repository';
import { QuotaRepository } from '../../common/repositories/quota.repository';
import { filterDuplicateItemsWithKey } from '../../common/utils/common';
import { buildFailItemResponse } from '../../common/utils/respond';
import cfApp from '../../configs/app';
import { EventNames } from '../communication/events';
import { LastModifiedToIndividual } from '../communication/events/api-last-modified.event';
import { RealTimeMessageCode } from '../communication/interfaces';
import { ApiLastModifiedResponse, GetApiLastModifiedDto } from './dto/get-api-last-modified.dto';
import { PutApiLastModifiedDto } from './dto/put-api-last-modified.dto';
@Injectable()
export class ApiLastModifiedService {
  private readonly mailServerUrl: string;
  constructor(
    @InjectRepository(ApiLastModifiedRepository)
    private readonly apiLastModifiedRepository: ApiLastModifiedRepository,
    @InjectRepository(QuotaRepository)
    private readonly quotaRepository: QuotaRepository,
    private readonly httpClient: HttpService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.mailServerUrl = cfApp().serverMailUrl;
  }
  async updateBatchModify(data: PutApiLastModifiedDto[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    try {
      const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['api_name']);
      if (dataError.length > 0) {
        dataError.map(item => {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }
      if (dataPassed.length === 0) {
        return { itemPass, itemFail };
      }
      for (const modify of dataPassed) {
        const respond = await this.apiLastModifiedRepository
          .insertLastModify(modify, user);
        //
        const eventData: LastModifiedToIndividual = {
          headers,
          message_code: RealTimeMessageCode.API_LAST_MODIFIED,
          email: user.email,
          content: `You got last modified for API: ${modify.api_name}`,
          metadata: {
            api_name: modify.api_name,
            updated_date: modify.updated_date,
            event_timestamp: modify.updated_date
          }
        };
        this.eventEmitter.emit(EventNames.EVENT_TO_INDIVIDUAL, eventData);

        if (respond['error']) {
          itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
            respond['error'], modify));
          continue;
        }
        itemPass.push(respond);
      }
      //
      return { itemPass: itemPass.filter(Boolean), itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(
        ErrorCode.BAD_REQUEST, error.message);
      itemFail.push(errItem);
      return { itemPass, itemFail };
    }
  }

  async findAll(getApiLastModifiedDto: GetApiLastModifiedDto, user: IUser)
    : Promise<ApiLastModifiedResponse[]> {
    try {
      const { email, userId } = user;
      const queryApiNames = getApiLastModifiedDto && getApiLastModifiedDto.api_name ?
        getApiLastModifiedDto.api_name.split(',') : [];

      const uniqQueryApiNames = [
        ...new Set(queryApiNames)
      ];

      const apiLastModifieds = await this.apiLastModifiedRepository.findByApiNames(
        uniqQueryApiNames,
        userId
      );
      // at least 1s per user
      setTimeout(async () => {
        try {
          // get byte from internal mail server and insert into quota of db4.0
          const QuotaUrl = `${this.mailServerUrl}/quota/item`;
          const rs = await this.httpClient
            .axiosRef.post(QuotaUrl, {
              username: email
            });
          if (rs['data']['bytes'] > 0) {
            await this.quotaRepository.update({ username: email }, { bytes: rs.data.bytes });
          }
        } catch (error) {
          LoggerService.getInstance().logError(error);
        }
      }, 1e2);

      return apiLastModifieds.map(el => ({
        api_name: el.api_name,
        updated_date: el.api_modified_date
      }));
    } catch (error) {
      // tslint:disable-next-line: no-console
      LoggerService.getInstance().logError(error);
    }
  }
}