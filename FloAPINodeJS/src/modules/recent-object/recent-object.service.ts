import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApiLastModifiedName, DELETED_ITEM_TYPE } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_WHEN_DELETE,
  MSG_FIND_NOT_FOUND,
  MSG_TERMINATE_ACC_NOT_EXIST
} from '../../common/constants/message.constant';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { RecentObject } from '../../common/entities/recent-object.entity';
import { ThirdPartyAccount } from '../../common/entities/third-party-account.entity';
import { IReq } from '../../common/interfaces';
import { LoggerService } from '../../common/logger/logger.service';
import { RecentObjectRepository } from '../../common/repositories/recent-object.repository';
import { getMaxUpdatedDate } from '../../common/utils/common';
import { generateDeletedDateByLength } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { RecentObjectDeleteDto } from './dto/recent-object.delete.dto';
import { RecentObjectDto, RecentObjectResponse } from './dto/recent-object.dto';
import { RecentObjectError } from './recent-object.error';

@Injectable()
export class RecentObjectService {
  constructor(
    @InjectRepository(RecentObjectRepository)
    private readonly recentObjectRepository: RecentObjectRepository,
    @InjectRepository(ThirdPartyAccount)
    private readonly thirdPartyAccountRepository: Repository<ThirdPartyAccount>,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly deletedItem: DeletedItemService,
    private readonly loggerService: LoggerService
  ) { }

  async create(recentObjects: RecentObjectDto[], { user, headers }: IReq) {
    const accountIds = (await this.thirdPartyAccountRepository.find({
      select: ['id'],
      where: {
        id: In(recentObjects.map(r => r.account_id)),
        user_id: user.id
      }
    })).map(a => a.id);

    const errors: RecentObjectError[] = [];
    let data: RecentObjectResponse[] = [];

    recentObjects = recentObjects.filter((ro) => {
      if (ro.account_id && (!accountIds.length || !accountIds.includes(ro.account_id))) {
        errors.push(new RecentObjectError({
          code: ErrorCode.INVALID_DATA,
          message: MSG_TERMINATE_ACC_NOT_EXIST,
          attributes: ro
        }));
        return false;
      }
      return true;
    });
    if (recentObjects.length) {
      data = await this.recentObjectRepository.batchUpsert(recentObjects, user.id);
    }
    if (data.length) {
      const updatedDate = getMaxUpdatedDate(data);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.RECENT_OBJECT,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }
    return { data, errors };
  }

  async deleteRecentObjs(data: RecentObjectDeleteDto[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const deletedItem = [];
    const deletedDates: number[] = generateDeletedDateByLength(data.length);
    await Promise.all(data.map(async (item, index) => {
      try {
        const itemRecent = await this.recentObjectRepository.findOne({
          where: { id: item.id, user_id: user.id }
        });

        if (!itemRecent) {
          const errItem = buildFailItemResponse(ErrorCode.RECENT_OBJ_NOT_FOUND,
            MSG_FIND_NOT_FOUND, item);
          itemFail.push(errItem);
        } else {
          const isInsertDeletedItem = await this.deletedItem.create(user.id, {
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.RECENT_OBJ,
            is_recovery: 0,
            created_date: deletedDates[index],
            updated_date: deletedDates[index]
          });
          if (!isInsertDeletedItem) { // push item into itemFail if false
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
            itemFail.push(errItem);
          } else { // remove item in cloud table
            await this.recentObjectRepository.delete({ id: itemRecent.id, user_id: user.id });
            itemPass.push({ id: itemRecent.id });
            deletedItem.push({ updated_date: deletedDates[index] });
          }
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        this.loggerService.logError(error);
        itemFail.push(errItem);
      }
    }));

    if (itemPass.length > 0) {
      const updatedDate = getMaxUpdatedDate(deletedItem);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.RECENT_OBJECT,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return { itemPass, itemFail };
  }

  async findAll(filter: BaseGetDTO, userId: number) {
    const { ids, modified_gte, modified_lt, page_size } = filter;
    const objs: RecentObject[] = await this.databaseUtilitiesService.getAll({
      userId,
      filter,
      repository: this.recentObjectRepository
    });

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(userId, DELETED_ITEM_TYPE.RECENT_OBJ, {
        ids,
        modified_gte,
        modified_lt,
        page_size
      });
    }

    return {
      data: objs,
      data_del: deletedItems
    };
  }
}
