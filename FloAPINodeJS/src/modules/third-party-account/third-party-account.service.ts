import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { classToPlain } from 'class-transformer';
import { Equal } from 'typeorm';
import { In } from 'typeorm/find-options/operator/In';
import {
  ApiLastModifiedName, DELETED_ITEM_TYPE,
  THIRD_PARTY_ACCOUNT_WORKER_JOBS as TPA
} from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_CAN_NOT_ADD_FLO_MAIL,
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_INVALID,
  MSG_ERR_NOT_FOUND,
  MSG_ERR_WHEN_DELETE
} from '../../common/constants/message.constant';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { ThirdPartyAccount } from '../../common/entities/third-party-account.entity';
import { IReq } from '../../common/interfaces';
import { LoggerService } from '../../common/logger/logger.service';
import { ThirdPartyAccountRepo } from '../../common/repositories/third-party-account.repository';
import { filterDuplicateItemsWithKey } from '../../common/utils/common';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { IThirdPartyAccountJob, ThirdPartyQueueService } from '../bullmq-queue/third-party-account.queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { DeleteItemParam } from '../deleted-item/dto/deletedItemParam';
import { ACCOUNT_TYPE, THIRD_PARTY_ACCOUNT as TPA_TYPE } from './contants';
import { CreateThirdPartyAccountDto } from './dto/create-third-party-account.dto';
import { Delete3rdAccount } from './dto/req.dto';
import { IThirdPartyAccountDto } from './dto/third-party-account.dto';
import { UpdateThirdPartyAccountDto } from './dto/update-third-party-account.dto';

export interface ThirdPartyAccountServiceOptions {
  fields: (keyof ThirdPartyAccount)[];
}

@Injectable()
export class ThirdPartyAccountService {
  constructor(
    @InjectRepository(ThirdPartyAccountRepo)
    private readonly thirdPartyAccountRepo: ThirdPartyAccountRepo,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly jobQueue: ThirdPartyQueueService,
    private readonly logger: LoggerService,
    private readonly deletedItemService: DeletedItemService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService) {
  }

  private isFloMail(email: string, flo_email_domain: string): boolean {
    if (!email || email.length <= 0) return false;
    return email.split('@')[1] === flo_email_domain;
  }

  private isOtherAcc(acc_type): boolean {
    return acc_type === ACCOUNT_TYPE.OtherAccount
      || acc_type === ACCOUNT_TYPE.OtherCaldav
      || acc_type === ACCOUNT_TYPE.OtherEmail;
  }

  private validFloMail(acc: CreateThirdPartyAccountDto | UpdateThirdPartyAccountDto,
    floEmail: string): boolean {
    const flo_email_domain = floEmail.split('@')[1];
    return (this.isFloMail(acc.user_income, flo_email_domain)
      || this.isFloMail(acc.user_smtp, flo_email_domain)
      || this.isFloMail(acc.user_caldav, flo_email_domain))
      && this.isOtherAcc(acc.account_type);
  }

  async create(createDto: CreateThirdPartyAccountDto[], { user, headers }: IReq) {
    const rok = [];
    const rer = [];
    const timeLastModify = [];
    const currentTime = getUtcMillisecond();

    await Promise.all(createDto.map(async (value, idx) => {
      try {
        if (this.validFloMail(value, user.email)) {
          rer.push({
            message: MSG_CAN_NOT_ADD_FLO_MAIL,
            attributes: {
              user_income: value.user_income,
              user_smtp: value.user_smtp,
              user_caldav: value.user_caldav
            },
            code: ErrorCode.BAD_REQUEST,
          });
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(dateItem);
          const data = {
            ...value,
            user_id: user.userId,
            created_date: dateItem,
            updated_date: dateItem
          };
          const result = await this.eachCreate(data);
          if (typeof result !== 'number') rok.push(result);
        }
      } catch (e) {
        rer.push({
          message: e.message,
          attributes: {
            user_income: e.parameters[1], // always user income
          },
          code: ErrorCode.BAD_REQUEST,
        });
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.THIRD_PARTY_ACCOUNT,
        userId: user.userId,
        email: user.email,
        updatedDate
      }, headers);
    }
    return { rok, rer };
  }

  async eachCreate(am: CreateThirdPartyAccountDto) {
    const r = await this.thirdPartyAccountRepo.save3rdPatrtyAccount(am);
    // const ids = r.identifiers.map(x => x.id);
    // if (ids.length > 0) {
    //   await r;
    // }
    // const res = await this.thirdPartyAccountRepo.findOne(r.raw.insertId);

    return { ...r, ref: am.ref };
  }

  /**
   * Find third party account
   * @param userId
   * @param filter
   * @returns {data_del, data}
   */
  async findAll(userId: number, filter?: GetAllFilter<ThirdPartyAccount>) {
    try {
      const { modified_gte, modified_lt, ids, has_del, page_size } = filter;

      const data: IThirdPartyAccountDto[] = await this.databaseUtilitiesService.getAll({
        userId,
        filter,
        repository: this.thirdPartyAccountRepo,
      });

      const thirdData: IThirdPartyAccountDto[] = data.map(dta => {
        return new IThirdPartyAccountDto(classToPlain(dta));
      });

      let deletedItems;

      if (has_del) {
        deletedItems = await this.deletedItemService.findAll(
          userId, DELETED_ITEM_TYPE.SET_3RD_ACC,
          {
            modified_gte,
            modified_lt,
            ids,
            page_size
          });
      }

      return {
        data_del: deletedItems,
        data: thirdData
      };
    } catch (err) {
      this.logger.logError(err);
      throw err;
    }
  }

  findAllByUserId(pg: { userId: number, ids?: number[] },
    excludes?: string[], selected?: string) {
    let columns: any;
    const condition: { user_id: number, id?: any } = {
      user_id: pg.userId
    };
    if (selected) {
      columns = [selected];
    }
    if (pg.ids) {
      condition.id = In(pg.ids);
    }
    return this.thirdPartyAccountRepo.find({
      select: columns,
      where: condition,
      cache: true
    });
  }

  async update(dto: UpdateThirdPartyAccountDto[], { user, headers }: IReq) {
    if (dto === null) {
      throw new Error(MSG_ERR_INVALID);
    }
    const rok = [];
    const rer = [];
    const timeLastModify = [];
    const currentTime = getUtcMillisecond();

    await Promise.all(
      dto.map(async (value, idx) => {
        try {
          if (this.validFloMail(value, user.email)) {
            rer.push({
              message: MSG_CAN_NOT_ADD_FLO_MAIL,
              attributes: {
                user_income: value.user_income,
                user_smtp: value.user_smtp,
                user_caldav: value.user_caldav
              },
              code: ErrorCode.BAD_REQUEST,
            });
          } else {
            const dateItem = getUpdateTimeByIndex(currentTime, idx);
            timeLastModify.push(dateItem);
            let data = { ...value, updated_date: dateItem };
            data = this.thirdPartyAccountRepo.removeNullProperties(data);
            const result = await this.thirdPartyAccountRepo.updateAndReturn(
              { id: value.id, user_id: user.userId },
              data,
            );
            if (result) rok.push(result);
            else {
              rer.push({
                message: `Third party account ${MSG_ERR_NOT_FOUND}`,
                attributes: { id: value.id },
                code: ErrorCode.THIRD_PARTY_ACCOUNT,
              });
            }
          }
        } catch (e) {
          rer.push({
            message: e.message,
            attributes: {
              user_income: value.user_income, // always user income
            },
            code: ErrorCode.BAD_REQUEST,
          });
        }
      }),
    );

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.THIRD_PARTY_ACCOUNT,
        userId: user.userId,
        email: user.email,
        updatedDate,
      }, headers);
    }

    return { rok, rer };
  }

  async delete(data: Delete3rdAccount[], { user, headers }: IReq) {
    const ids = [];
    const itemPass = [];
    const itemFail = [];
    const currentTime: number = getUtcMillisecond();
    const timeLastModify: number[] = [];
    const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['id']);

    if (dataError.length > 0) {
      dataError.map(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    if (dataPassed.length > 0) {
      await Promise.all(dataPassed.map(async ({ id }: Delete3rdAccount, idx: number) => {
        const deleted = await this.thirdPartyAccountRepo
          .delete({
            id,
            user_id: Equal(user.id)
          });
        if (deleted && deleted.affected > 0) {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(dateItem);
          const deletedItem: DeleteItemParam = new DeleteItemParam();
          deletedItem.item_id = id;
          deletedItem.item_type = DELETED_ITEM_TYPE.SET_3RD_ACC;
          deletedItem.updated_date = dateItem;
          deletedItem.created_date = dateItem;
          itemPass.push(deletedItem);
          ids.push(id);
        } else {
          itemFail.push(buildFailItemResponse(ErrorCode.DELETE_FAILED,
            MSG_ERR_WHEN_DELETE, { id }));
        }
      }));
    }
    // insert ton deleted_item
    await this.deletedItemService.batchCreateWithDate(user.id, itemPass);
    if (timeLastModify.length > 0) {
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.THIRD_PARTY_ACCOUNT,
        userId: user.id,
        email: user.email,
        updatedDate: Math.max(...timeLastModify)
      }, headers);
    }
    if (ids.length) {
      const childJobs: IThirdPartyAccountJob[] = TPA_TYPE.WORKER_JOBS
        .map((name: string) => ({
          name: TPA[name], ids
        }));
      this.jobQueue.addJob(childJobs, user.id);
    }
    return { itemFail, itemPass: ids.map(id => ({ id })) };
  }

  // this method retrieves only one entry, by entry ID
  findOneById(userId: number, id: number, options?: ThirdPartyAccountServiceOptions) {
    return this.thirdPartyAccountRepo.findOne({
      select: options && options.fields,
      where: {
        id,
        user_id: userId
      }
    });
  }

  findByIds(userId: number, ids: number[], options?: ThirdPartyAccountServiceOptions) {
    return this.thirdPartyAccountRepo.find({
      select: options && options.fields,
      where: {
        id: In(ids),
        user_id: userId
      }
    });
  }

  // this method check account ids existed
  async isExist(userId: number, id: number): Promise<0 | 1> {
    const respond = await this.thirdPartyAccountRepo.findOne({
      where: {
        user_id: userId,
        id
      }
    });
    return !respond ? 0 : 1;
  }
}
