import { Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { ApiLastModifiedName, DELETED_ITEM_TYPE } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_NOT_EXIST,
  MSG_ERR_WHEN_CREATE,
  MSG_ERR_WHEN_DELETE,
  MSG_ERR_WHEN_UPDATE
} from '../../common/constants/message.constant';
import { TypeOrmErrorCode } from '../../common/constants/typeorm-code';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { CredentialEntity } from '../../common/entities/credential.entity';
import { IReq, IUser } from '../../common/interfaces';
import { CredentialRepository } from '../../common/repositories/credential.repository';
import { SaltRepository } from '../../common/repositories/salt.repository';
import { IDWithoutDuplicates, generateSalt, getSaltUser } from '../../common/utils/common';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { CredentialDeleteDTO } from './dto/credential.delete.dto';
import { CredentialDTO } from './dto/credential.post.dto';
import { CredentialUpdateDTO } from './dto/credential.put.dto';
@Injectable()
export class CredentialService {
  constructor(
    private readonly credentialRepository: CredentialRepository,
    private readonly saltRepository: SaltRepository,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly deletedItem: DeletedItemService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
  ) { }

  async getSalt(user: IUser) {
    const currentTime = getUtcMillisecond();
    const saltItem = await this.saltRepository.findOne({
      where: {
        user_id: user.userId
      }
    });
    if (saltItem) {
      const saltRespond = getSaltUser(saltItem, user.userId);
      return {
        data: {
          ...saltRespond,
          created_date: saltItem.created_date,
          updated_date: saltItem.updated_date
        }
      };
    }
    // generate items Salt
    const saltItems = await generateSalt();
    const dateItem = getUpdateTimeByIndex(currentTime, 0);
    const saltEntity = this.saltRepository.create({
      user_id: user.userId,
      email: user.email,
      ...saltItems,
      created_date: dateItem,
      updated_date: dateItem
    });
    const salts = await this.saltRepository.save(saltEntity);
    const saltRs = getSaltUser(salts, user.userId);
    return {
      data: {
        ...saltRs,
        created_date: dateItem,
        updated_date: dateItem
      }
    };
  }

  async getAllFiles(filter: BaseGetDTO, { user, headers }: IReq) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const credentialItems: CredentialEntity[] = await this.databaseUtilitiesService.getAll({
      userId: user.id,
      filter,
      repository: this.credentialRepository
    });
    credentialItems.map((item) => {
      delete item.checksum;
      return item;
    });

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem
        .findAll(user.id, DELETED_ITEM_TYPE.CREDENTIAL, {
          ids,
          modified_gte,
          modified_lt,
          page_size
        });
    }

    return {
      data: credentialItems,
      data_del: deletedItems
    };
  }

  async createCredential(data: CredentialDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    await Promise.all(data.map(async (itemCredential, idx) => {
      try {
        const dateItem = getUpdateTimeByIndex(currentTime, idx);
        timeLastModify.push(dateItem);
        // create checksum
        const dataSHA = `${user.id}${itemCredential.type}${itemCredential.data_encrypted}`;
        const checksum = CryptoUtil.converToMd5(dataSHA);
        const credentialEntity: CredentialEntity = this.credentialRepository.create({
          user_id: user.id,
          checksum,
          ...itemCredential,
          created_date: dateItem,
          updated_date: dateItem
        });

        const rs = await this.credentialRepository.save(credentialEntity);
        if (itemCredential.ref) rs['ref'] = itemCredential.ref;
        delete rs.checksum;
        itemPass.push(rs);
      } catch (error) {
        if (error instanceof QueryFailedError &&
          error.message.includes(TypeOrmErrorCode.ER_DUP_ENTRY)) {
          const errDubItem = buildFailItemResponse(
            ErrorCode.BAD_REQUEST, MSG_ERR_DUPLICATE_ENTRY, itemCredential);
          itemFail.push(errDubItem);
          return true;
        }
        const errItem = buildFailItemResponse(
          ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_CREATE, itemCredential);
        itemFail.push(errItem);
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      await this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.CREDENTIAL,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return { itemPass, itemFail };
  }

  async updateCredential(data: CredentialUpdateDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    await Promise.all(data.map(async (item: CredentialUpdateDTO, idx) => {
      try {
        const itemCredential = await this.credentialRepository.findOne({
          where: { id: item.id, user_id: user.id }
        });

        if (!itemCredential) {
          itemFail.push(buildFailItemResponse(
            ErrorCode.CREDENTIAL_NOT_FOUND,
            MSG_ERR_NOT_EXIST,
            item
          ));
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          const dataMD5 = `${user.id}${item.type || 0}${item.data_encrypted}`;
          const checksum = CryptoUtil.converToMd5(dataMD5);
          const result = await this.credentialRepository.save({
            ...itemCredential, // existing fields
            ...item,// updated fields,
            checksum,
            updated_date: dateItem
          });
          // remove checksum field
          delete result.checksum;
          timeLastModify.push(dateItem);
          itemPass.push(result);
        }
      } catch (error) {
        itemFail.push(buildFailItemResponse(
          ErrorCode.BAD_REQUEST,
          MSG_ERR_WHEN_UPDATE,
          item
        ));
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      await this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.CREDENTIAL,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }
    return { itemPass, itemFail };
  }

  async deleteCredentials(data: CredentialDeleteDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    // remove duplicate id
    const removeDuplicateId = IDWithoutDuplicates(data);
    await Promise.all(removeDuplicateId.map(async (item, idx) => {
      try {
        const itemCredential = await this.credentialRepository.findOne({
          where: { id: item.id, user_id: user.id }
        });
        if (!itemCredential) {
          itemFail.push(buildFailItemResponse(
            ErrorCode.CREDENTIAL_NOT_FOUND,
            MSG_ERR_NOT_EXIST,
            item
          ));
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          const isInsertDeletedItem = await this.deletedItem.create(user.id, {
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.CREDENTIAL,
            is_recovery: 0,
            created_date: dateItem,
            updated_date: dateItem
          });
          if (!isInsertDeletedItem) {
            // push item into itemFail if false
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
            itemFail.push(errItem);
          } else {
            await this.credentialRepository.delete({ id: item.id, user_id: user.id });
            timeLastModify.push(dateItem);
            itemPass.push({ id: itemCredential.id });
          }
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        itemFail.push(errItem);
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      await this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.CREDENTIAL,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }
    return { itemPass, itemFail };
  }
}
