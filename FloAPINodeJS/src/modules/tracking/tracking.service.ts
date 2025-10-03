import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { classToPlain } from 'class-transformer';
import { IReq } from 'src/common/interfaces';
import { Repository } from 'typeorm';
import {
  ApiLastModifiedName,
  DELETED_ITEM_TYPE,
  OBJ_TYPE,
  SQL_ENTITY_NAME,
  TRACKING_STATUS
} from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_ERR_DUPLICATE_ENTRY, MSG_ERR_NOT_EXIST, MSG_TERMINATE_ACC_NOT_EXIST } from '../../common/constants/message.constant';
import { TypeOrmErrorCode } from '../../common/constants/typeorm-code';
import { ErrorDTO } from '../../common/dtos/error.dto';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { ThirdPartyAccount } from '../../common/entities/third-party-account.entity';
import { Tracking } from '../../common/entities/tracking.entity';
import { pickObject } from '../../common/utils/common';
import { generateDeletedDateByLength, getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { CreateTrackingDTO } from './dtos/create-tracking.dto';
import { DeleteTrackingDTO } from './dtos/delete-tracking.dto';
import { TrackingResponse } from './dtos/tracking.dto';
import { UpdateTrackingDTO } from './dtos/update-tracking.dto';
@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(Tracking) private readonly trackingRepository: Repository<Tracking>,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly deletedItemService: DeletedItemService,
    @InjectRepository(ThirdPartyAccount)
    private readonly thirdPartyAccountRepository: Repository<ThirdPartyAccount>,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService
  ) { }

  async findOne(userId: number, trackingId: number) {
    try {
      return this.trackingRepository.findOne({
        where: {
          user_id: userId,
          id: trackingId
        }
      });
    } catch (err) {
      // TODO: log error here
      throw err;
    }
  }

  async findAll(filter: GetAllFilter<Tracking>, { user, headers }: IReq) {
    try {
      const {
        modified_gte,
        modified_lt,
        ids,
        has_del,
        page_size
      } = filter;
      const fields = !filter.fields ? []
        : filter.fields.map(f => f.replace(/_buf$/, ''));
      delete filter.fields;
      const collections: Tracking[] = await this.databaseUtilitiesService.getAll({
        userId: user.id,
        filter,
        repository: this.trackingRepository
      });

      const dataResponse: TrackingResponse[] = collections.map((entity: Tracking) => {
        return {
          ...classToPlain(entity),
          object_uid: entity.object_uid
        };
      });

      let deletedItems;
      if (has_del && has_del === 1) {
        deletedItems = await this.deletedItemService.findAll(user.id, DELETED_ITEM_TYPE.TRACK, {
          modified_gte,
          modified_lt,
          ids,
          page_size
        });
      }
      return {
        data_del: deletedItems,
        data: pickObject(dataResponse, fields)
      };
    } catch (err) {
      // TODO: log error here
      throw err;
    }
  }

  async removeMultiple(dtos: DeleteTrackingDTO[], { user, headers }: IReq): Promise<{
    removed: { id: number }[],
    errors: ErrorDTO[]
  }> {
    const errors: ErrorDTO[] = [];
    const deletedDates: number[] = generateDeletedDateByLength(dtos.length);

    let removed =
      await Promise.all(dtos.map(async (dto: DeleteTrackingDTO, index) => {
        try {
          return await this.remove(user.id, dto.id, deletedDates[index]);
        } catch (err) {
          errors.push(err);
          return undefined;
        }
      }));

    removed = removed.filter(Boolean);

    if (removed.length > 0) {
      const updatedDate = Math.max(...deletedDates);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.EMAIL_TRACKING,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return {
      removed,
      errors
    };
  }

  async remove(userId: number, id: number, deleted_date: number) {
    try {
      const found = await this.findOne(userId, id);
      if (!found) {
        throw new ErrorDTO({
          attributes: { id },
          code: ErrorCode.TRACKING_DOES_NOT_EXIST,
          message: MSG_ERR_NOT_EXIST
        });
      }

      const insertDeletedItemResult = await this.deletedItemService.create(userId,
        {
          item_id: id,
          item_type: DELETED_ITEM_TYPE.TRACK,
          updated_date: deleted_date,
          created_date: deleted_date
        });
      if (insertDeletedItemResult) {
        const deleteResult = await this.trackingRepository.delete({
          id,
          user_id: userId
        });

        if (deleteResult && deleteResult.affected) {
          return {
            id
          };
        }
      }

      throw new ErrorDTO({
        attributes: { id },
        code: ErrorCode.TRACKING_DOES_NOT_EXIST,
        message: MSG_ERR_NOT_EXIST
      });
    } catch (err) {
      // TODO: log error here
      throw err;
    }
  }

  async createMultiple(dtos: CreateTrackingDTO[], { user, headers }: IReq): Promise<{
    created: TrackingResponse[],
    errors: ErrorDTO[]
  }> {
    let errors: ErrorDTO[] = [];

    const {
      data: validationData,
      errors: validatedErrors
    } = await this.validateAccountId(user.id, dtos);

    errors = [...validatedErrors];
    if (validationData.length === 0) {
      return {
        created: [],
        errors
      };
    }
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    let created =
      await Promise.all(validationData.map(async (dto: CreateTrackingDTO, idx) => {
        try {
          const updatedDate = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(updatedDate);
          return await this.create(user.id, dto, updatedDate);
        } catch (err) {
          errors.push(
            new ErrorDTO({
              attributes: {
                ...dto,
                object_uid: [OBJ_TYPE.GMAIL, OBJ_TYPE.EMAIL365
                ].includes(dto.object_type)
                  ? dto.object_uid['id']
                  : dto.object_uid
              },
              code: err.code || ErrorCode.CREATE_FAILED,
              message: err.message
            })
          );
          return undefined;
        }
      }));

    created = created.filter(Boolean);
    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.EMAIL_TRACKING,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return {
      created,
      errors
    };
  }

  async create(userId: number, dto: CreateTrackingDTO, dateItem: number)
    : Promise<TrackingResponse> {
    try {
      const entity = this.trackingRepository.create({
        user_id: userId,
        account_id: dto.account_id,
        message_id: dto.message_id,
        emails: dto.emails,
        object_type: dto.object_type,
        object_uid_buf: dto.object_uid?.objectUid,
        replied_time: dto.replied_time,
        status: dto.status || TRACKING_STATUS.WAITING,
        subject: dto.subject,
        time_send: dto.time_send,
        time_tracking: dto.time_tracking,
        created_date: dateItem,
        updated_date: dateItem,
      });

      const result = await this.trackingRepository.insert(entity);
      return {
        id: result.raw.insertId,
        ...entity,
        user_id: undefined,
        object_uid_buf: undefined,
        object_uid: dto.object_uid?.getPlain(),
        ref: dto.ref
      };
    } catch (err) {
      if (err.code === TypeOrmErrorCode.ER_DUP_ENTRY) {
        throw new ErrorDTO({
          attributes: dto,
          code: ErrorCode.DUPLICATE_ENTRY,
          message: MSG_ERR_DUPLICATE_ENTRY
        });
      }
      throw new ErrorDTO({
        attributes: this.buildErrFromDTO(dto),
        code: err.code,
        message: err.message
      });
    }
  }

  async updateMultiple(dtos: UpdateTrackingDTO[], { user, headers }: IReq): Promise<{
    updated: TrackingResponse[],
    errors: ErrorDTO[]
  }> {
    let errors: ErrorDTO[] = [];

    const {
      data: validationData,
      errors: validatedErrors
    } = await this.validateAccountId(user.id, dtos, true);

    errors = [...validatedErrors];

    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    let updated =
      await Promise.all(validationData.map(async (dto: UpdateTrackingDTO, idx) => {
        try {
          const updatedDate = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(updatedDate);
          return await this.update(user.id, dto, updatedDate);
        } catch (err) {
          errors.push(err);
          return undefined;
        }
      }));

    updated = updated.filter(Boolean);
    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.EMAIL_TRACKING,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return {
      updated,
      errors
    };
  }

  async update(userId: number, dto: UpdateTrackingDTO, dateItem: number)
    : Promise<TrackingResponse> {
    const data = await this.trackingRepository.findOne({
      where: {
        id: dto.id,
        user_id: userId
      }
    });
    if (!data || !data.id) {
      throw new ErrorDTO({
        attributes: this.buildErrFromDTO(dto),
        code: ErrorCode.TRACKING_DOES_NOT_EXIST,
        message: MSG_ERR_NOT_EXIST
      });
    }
    const entity = this.trackingRepository.create({
      id: dto.id,
      account_id: dto.account_id,
      message_id: dto.message_id,
      user_id: userId,
      emails: dto.emails,
      replied_time: dto.replied_time,
      status: dto.status,
      subject: dto.subject,
      time_send: dto.time_send,
      time_tracking: dto.time_tracking,
      updated_date: dateItem,
    });

    const result = await this.trackingRepository.update({
      id: entity.id,
      user_id: userId
    }, entity);
    if (result && result.affected) {
      return {
        ...data,
        ...entity,
        user_id: undefined,
        object_uid_buf: undefined,
        object_uid: dto.object_uid?.getPlain()
      };
    } else {
      throw new ErrorDTO({
        attributes: this.buildErrFromDTO(dto),
        code: ErrorCode.TRACKING_DOES_NOT_EXIST,
        message: MSG_ERR_NOT_EXIST
      });
    }
  }

  async validateAccountId(userId: number, data: any[], update = false) {
    try {
      const errors: ErrorDTO[] = [];
      if (update) return { data, errors };
      const ids = data.map(r => r.account_id).filter(i => i > 0);
      const accountIds = ids.length > 0 ? await this.thirdPartyAccountRepository.
        createQueryBuilder(SQL_ENTITY_NAME.THIRD_PARTY_ACCOUNT)
        .select(['id'])
        .andWhere("id in (:ids)", { ids })
        .andWhere("user_id = :user_id", { user_id: userId })
        .execute() : [];
      data = data.filter((ro) => {
        if (accountIds.length === 0 && ro.account_id > 0) {
          errors.push(new ErrorDTO({
            code: ErrorCode.INVALID_ACCOUNT_ID,
            message: MSG_TERMINATE_ACC_NOT_EXIST,
            attributes: ro
          }));
          return false;
        }
        if (ro.account_id === 0) return true;
        const foundAcc = accountIds.find(i => {
          return i.id === ro.account_id;
        });
        if (!foundAcc) {
          errors.push(new ErrorDTO({
            code: ErrorCode.INVALID_ACCOUNT_ID,
            message: MSG_TERMINATE_ACC_NOT_EXIST,
            attributes: ro
          }));
          return false;
        }
        return true;
      });

      return {
        data,
        errors
      };
    } catch (err) {
      // TODO: log error here
      throw err;
    }
  }
  buildErrFromDTO(dto) {
    if (!!dto && !!dto.object_uid && typeof dto.object_uid === 'object') {
      dto.object_uid = dto.object_uid.getPlain();
    }
    return dto;
  }
}
