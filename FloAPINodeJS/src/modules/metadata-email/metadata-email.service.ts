import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { classToPlain } from 'class-transformer';
import { In, Repository } from 'typeorm';
import { ApiLastModifiedName, OBJ_TYPE } from '../../common/constants';
import { DELETED_ITEM_TYPE } from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_NOT_EXIST,
  MSG_TERMINATE_ACC_NOT_EXIST
} from '../../common/constants/message.constant';
import { TypeOrmErrorCode } from '../../common/constants/typeorm-code';
import { ErrorDTO } from '../../common/dtos/error.dto';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { MetadataEmail } from '../../common/entities/metadata-email.entity';
import { ThirdPartyAccount } from '../../common/entities/third-party-account.entity';
import { IReq } from '../../common/interfaces';
import { pickObject } from '../../common/utils/common';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { generateDeletedDateByLength, getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { CreateMetadataEmailDTO } from './dtos/create-metadata-email.dto';
import { DeleteMetadataEmailDTO } from './dtos/delete-metadata-email.dto';
import { MetadataEmailResponse } from './dtos/metadata-email.dto';
import { UpdateMetadataEmailDTO } from './dtos/update-metadata-email.dto';

@Injectable()
export class MetadataEmailService {
  constructor(
    @InjectRepository(MetadataEmail)
    private readonly metadataEmailRepository: Repository<MetadataEmail>,
    private readonly deletedItemService: DeletedItemService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,

    @InjectRepository(ThirdPartyAccount)
    private readonly thirdPartyAccountRepository: Repository<ThirdPartyAccount>

  ) { }

  async findOne(userId: number, id: number) {
    try {
      return this.metadataEmailRepository.findOne({
        where: {
          id,
          user_id: userId
        }
      });
    } catch (err) {
      // TODO: log error here
      throw err;
    }
  }

  async findAll(userId: number, filter: GetAllFilter<MetadataEmail>) {
    const fields = !filter.fields ? []
      : filter.fields.map(f => f.replace(/_buf$/, ''));
    delete filter.fields;
    try {
      const { modified_gte, modified_lt, ids, has_del, page_size } = filter;
      if (filter.fields && filter.fields.length > 0) {
        filter.fields.push('object_type');
      }

      const collections: MetadataEmail[] = await this.databaseUtilitiesService.getAll({
        userId,
        filter,
        repository: this.metadataEmailRepository
      });

      const dataResponse: MetadataEmailResponse[] = collections.map(entity => {
        entity = this.decryptData(entity);
        if (filter.fields && filter.fields.length > 0 && filter.fields.includes('object_type')) {
          delete entity.object_type;
        }
        return {
          ...classToPlain(entity),
          object_uid: entity.object_uid
        };
      });
      let deletedItems;
      if (has_del && has_del === 1) {
        deletedItems = await this.deletedItemService.findAll(
          userId,
          DELETED_ITEM_TYPE.METADATA_EMAIL,
          {
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
      return {
        error: new ErrorDTO({
          attributes: { ...filter, fields },
          code: err.code || ErrorCode.DELETE_FAILED,
          message: err.message
        })
      };
    }
  }

  private decryptData(entity: MetadataEmail) {
    if (entity.object_type === OBJ_TYPE.GMAIL
      || entity.object_type === OBJ_TYPE.EMAIL365) {
      try {
        entity.subject = entity.subject ? CryptoUtil.aes256Decrypt(entity.subject)
          : entity.subject;
      } catch (e) {
        // temp catch here. old data not encrypted will show raw data
      }
      try {
        entity.snippet = entity.snippet ? CryptoUtil.aes256Decrypt(entity.snippet)
          : entity.snippet;
      } catch (e) {
        // temp catch here. old data not encrypted will show raw data
      }
    }
    return entity;
  }

  async removeMultiple(metadataEmails: DeleteMetadataEmailDTO[], { user, headers }: IReq): Promise<{
    removed: { id: number }[],
    errors: ErrorDTO[]
  }> {
    const errors: ErrorDTO[] = [];
    const deletedDates: number[] = generateDeletedDateByLength(metadataEmails.length);

    const removedMetadataEmails = await Promise.all(
      metadataEmails.map(async (metadataEmail, index) => {
        try {
          return await this.remove(user.id, metadataEmail.id, deletedDates[index]);
        } catch (err) {
          errors.push(
            new ErrorDTO({
              attributes: metadataEmail,
              code: err.code || ErrorCode.DELETE_FAILED,
              message: err.message
            })
          );
          return undefined;
        }
      })
    );

    if (removedMetadataEmails.length > 0) {
      const updatedDate = deletedDates[metadataEmails.length - 1];
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.METADATA_EMAIL,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return {
      removed: removedMetadataEmails.filter(Boolean),
      errors
    };
  }

  async remove(userId: number, id: number, deleted_date: number) {
    try {
      const found = await this.findOne(userId, id);
      if (found) {
        const insertDeletedItemResult = await this.deletedItemService.create(userId,
          {
            item_id: id,
            item_type: DELETED_ITEM_TYPE.METADATA_EMAIL,
            created_date: deleted_date,
            updated_date: deleted_date
          });
        if (insertDeletedItemResult) {
          const deleteResult = await this.metadataEmailRepository.delete({ id });
          if (deleteResult && deleteResult.affected) {
            return {
              id
            };
          }
        }
      }

      throw new ErrorDTO({
        attributes: { id },
        code: ErrorCode.METADATA_EMAIL_DOES_NOT_EXIST,
        message: MSG_ERR_NOT_EXIST
      });
    } catch (err) {
      // TODO: log error here
      throw err;
    }
  }

  async createMultiple(metadataEmails: CreateMetadataEmailDTO[], { user, headers }: IReq): Promise<{
    created: MetadataEmailResponse[],
    errors: ErrorDTO[]
  }> {
    let errors: ErrorDTO[] = [];
    const {
      data: validationData,
      errors: validatedErrors
    } = await this.validateAccountId(user.id, metadataEmails);

    errors = [...validatedErrors];

    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    const createdMetadataEmails =
      await Promise.all(validationData.map(async (metadataEmail, idx) => {
        try {
          const updatedDate = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(updatedDate);
          let entity: MetadataEmail | any = await this.create(user.id, metadataEmail, updatedDate);
          entity = this.decryptData(entity);
          return entity;
        } catch (err) {
          errors.push(
            new ErrorDTO({
              attributes: metadataEmail,
              code: err.code || ErrorCode.CREATE_FAILED,
              message: err.message
            })
          );
          return undefined;
        }
      }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.METADATA_EMAIL,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return {
      created: createdMetadataEmails.filter(Boolean),
      errors
    };
  }

  async create(userId: number, dto: CreateMetadataEmailDTO,
    dateItem: number): Promise<MetadataEmailResponse> {
    try {
      let snippet = dto.snippet;
      let subject = dto.subject;
      if (dto.object_type === OBJ_TYPE.GMAIL
        || dto.object_type === OBJ_TYPE.EMAIL365) {
        subject = subject ? CryptoUtil.aes256Encrypt(subject) : subject;
        snippet = snippet ? CryptoUtil.aes256Encrypt(snippet) : snippet;
      }
      const entity = this.metadataEmailRepository.create({
        user_id: userId,
        account_id: dto.account_id,
        from: dto.from,
        to: dto.to,
        cc: dto.cc || [],
        bcc: dto.bcc || [],
        object_type: dto.object_type,
        object_uid_buf: dto.object_uid?.objectUid,
        received_date: dto.received_date,
        sent_date: dto.sent_date,
        snippet,
        subject,
        message_id: dto.message_id,
        created_date: dateItem,
        updated_date: dateItem,
      });

      const result = await this.metadataEmailRepository.save(entity);
      return {
        ...classToPlain(result),
        user_id: undefined,
        object_uid: dto.object_uid?.getPlain(),
        ref: dto.ref
      };
    } catch (err) {
      // TODO: log error here
      if (err.code === TypeOrmErrorCode.ER_DUP_ENTRY) {
        throw new ErrorDTO({
          attributes: this.buildErrFromDTO(dto),
          code: ErrorCode.DUPLICATE_ENTRY,
          message: MSG_ERR_DUPLICATE_ENTRY
        });
      }
      throw (err);
    }
  }

  async updateMultiple(metadataEmails: UpdateMetadataEmailDTO[], { user, headers }: IReq): Promise<{
    updated: MetadataEmailResponse[],
    errors: ErrorDTO[]
  }> {
    let errors: ErrorDTO[] = [];
    const {
      data: validationData,
      errors: validatedErrors
    } = await this.validateAccountId(user.id, metadataEmails);

    errors = [...validatedErrors];

    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    const updatedMetadataEmails =
      await Promise.all(validationData.map(async (metadataEmail, idx) => {
        try {
          const updatedDate = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(updatedDate);
          return await this.update(user.id, metadataEmail, updatedDate);
        } catch (err) {
          errors.push(
            new ErrorDTO({
              attributes: metadataEmail,
              code: err.code || ErrorCode.UPDATE_FAILED,
              message: err.message
            })
          );
          return undefined;
        }
      }));

    if (updatedMetadataEmails.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.METADATA_EMAIL,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return {
      updated: updatedMetadataEmails.filter(Boolean),
      errors
    };
  }

  async update(userId: number, dto: UpdateMetadataEmailDTO, dateItem: number)
    : Promise<MetadataEmailResponse> {
    try {
      let snippet = dto.snippet;
      let subject = dto.subject;
      const found = await this.findOne(userId, dto.id);
      if (!found || !found.id) {
        throw new ErrorDTO({
          attributes: this.buildErrFromDTO(dto),
          code: ErrorCode.METADATA_EMAIL_DOES_NOT_EXIST,
          message: MSG_ERR_NOT_EXIST
        });
      }
      if (found.object_type === OBJ_TYPE.GMAIL || found.object_type === OBJ_TYPE.EMAIL365) {
        subject = subject ? CryptoUtil.aes256Encrypt(subject) : subject;
        snippet = snippet ? CryptoUtil.aes256Encrypt(snippet) : snippet;
      }
      const entity = this.metadataEmailRepository.create({
        ...found,
        id: dto.id,
        user_id: userId,
        account_id: dto.account_id,
        from: dto.from,
        to: dto.to,
        cc: dto.cc,
        bcc: dto.bcc,
        received_date: dto.received_date,
        sent_date: dto.sent_date,
        snippet,
        subject,
        message_id: dto.message_id,
        updated_date: dateItem,
      });

      const updateResult = await this.metadataEmailRepository.update({
        id: entity.id,
        user_id: userId
      }, entity);

      if (updateResult && updateResult.affected) {
        const object_uid = entity.object_uid;
        delete entity.object_uid_buf;
        return {
          ...this.decryptData(entity),
          object_uid,
          user_id: undefined
        };
      }

      throw new ErrorDTO({
        attributes: this.buildErrFromDTO(dto),
        code: ErrorCode.METADATA_EMAIL_DOES_NOT_EXIST,
        message: MSG_ERR_NOT_EXIST
      });
    } catch (err) {
      if (err.code === TypeOrmErrorCode.ER_DUP_ENTRY) {
        throw new ErrorDTO({
          attributes: this.buildErrFromDTO(dto),
          code: ErrorCode.DUPLICATE_ENTRY,
          message: MSG_ERR_DUPLICATE_ENTRY
        });
      }
      throw (err);
    }
  }

  async validateAccountId(userId: number, data: any[]) {
    try {
      const thirdPartyAccounts = data.filter(r => r.account_id > 0);
      const ids = thirdPartyAccounts.map(r => r.account_id);
      const rs = (await this.thirdPartyAccountRepository.find({
        select: ['id'],
        where: {
          id: In(ids),
          user_id: userId
        }
      }));
      const accountIds = rs.map(a => a.id);
      const errors: ErrorDTO[] = [];
      data = data.filter((ro) => {
        if (ro.account_id && ro.account_id > 0
          && (!accountIds.length || !accountIds.includes(ro.account_id))) {
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
