import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, QueryFailedError, Repository } from 'typeorm';
import { format } from 'util';
import { APP_IDS, ApiLastModifiedName, DELETED_ITEM_TYPE } from '../../../common/constants/common';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_ERR_LINK, MSG_ERR_WHEN_DELETE } from '../../../common/constants/message.constant';
import { GetAllFilter } from '../../../common/dtos/get-all-filter';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { LinkedObject } from '../../../common/entities/linked-object.entity';
import { IReq } from '../../../common/interfaces';
import { LinkedObjectRepository } from '../../../common/repositories/linked-object.repository';
import { pickObject } from '../../../common/utils/common';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../../common/utils/date.util';
import { buildFailItemResponse } from '../../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../../../modules/bullmq-queue/api-last-modified-queue.service';
import { TrashService } from '../../../modules/trash/trash.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { ThirdPartyAccountService } from '../../third-party-account/third-party-account.service';
import { LinkHelper } from '../helper/link.helper';
import { LinkedObjectWithRef } from './dtos/create-linked-object.response';
import { DeleteLinkedObjectDto } from './dtos/delete-linked-object.dto';
import { LinkedObjectParamError } from './dtos/error.dto';
import { LinkedObjectDto } from './dtos/linked-object.dto';
export interface LinkedObjectServiceOptions {
  fields: (keyof LinkedObject)[];
}
@Injectable()
export class LinkedObjectService {
  constructor(
    // we create a repository for the  entity
    // and then we inject it as a dependency in the service
    @InjectRepository(LinkedObject) private readonly linkedObject: Repository<LinkedObject>,
    private readonly deletedItemService: DeletedItemService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly thirdPartyAccountService: ThirdPartyAccountService,
    private readonly trashService: TrashService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly linkedObjectRepo: LinkedObjectRepository,

  ) { }
  async findOne(user_id: number, id: number) {
    try {
      return this.linkedObject.findOne({
        where: { user_id, id }
      });
    } catch (err) {
      // TODO: log error here
      throw err;
    }
  }
  // this method retrieves all entries
  async findAll(filter: GetAllFilter<LinkedObject>, { user, headers }: IReq) {
    const fields = filter.fields;
    delete filter.fields;
    const _links = user.appId === APP_IDS.web
      ? await this.linkedObjectRepo.getLinkedSupportChannel({
        repository: this.linkedObject,
        filter, userId: user.id
      })
      : await this.databaseUtilitiesService.getAll({
        repository: this.linkedObject,
        filter, userId: user.id
      });
    const links = _links.map((item: LinkedObject) => {
      return {
        ...item,
        source_object_uid: LinkHelper.getObjectUid(item.source_object_uid,
          item.source_object_type),
        destination_object_uid: LinkHelper.getObjectUid(item.destination_object_uid,
          item.destination_object_type),
      };
    });

    // deleted items
    const { modified_gte, modified_lt, ids, page_size } = filter;
    let deletedItems: DeletedItem[] = [];
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItemService.findAll(user.id, DELETED_ITEM_TYPE.LINK, {
        modified_gte,
        modified_lt,
        ids,
        page_size
      });
    }

    return {
      links: pickObject(links, fields),
      deletedItems
    };
  }

  async create(userId: number, newLink: LinkedObjectDto, dateItem: number): Promise<LinkedObject> {
    const is_trashed = await this.trashService.getIsTrash(
      newLink.is_trashed,
      newLink.source_object_uid.objectUid,
      newLink.source_object_type,
      newLink.source_object_href
    ) || await this.trashService.getIsTrash(
      newLink.is_trashed,
      newLink.destination_object_uid.objectUid,
      newLink.destination_object_type,
      newLink.destination_object_href
    );
    const colEntity = this.linkedObject.create({
      user_id: userId,
      source_object_uid: newLink.source_object_uid.objectUid,
      source_object_type: newLink.source_object_type,
      source_account_id: newLink.source_account_id,
      source_object_href: newLink.source_object_href,
      destination_object_uid: newLink.destination_object_uid.objectUid,
      destination_object_type: newLink.destination_object_type,
      destination_account_id: newLink.destination_account_id,
      destination_object_href: newLink.destination_object_href,
      is_trashed,
      created_date: dateItem,
      updated_date: dateItem,
    });
    return this.linkedObject.save(colEntity);
  }
  async createBatchLinks(
    linkParams: LinkedObjectDto[], {
      user, headers
    }: IReq
  ): Promise<{
    created: LinkedObjectWithRef[];
    errors: LinkedObjectParamError[];
  }> {
    const errors: LinkedObjectParamError[] = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    const createdLinks: LinkedObjectWithRef[] = await Promise.all(
      linkParams.map(async (linkParam, idx) => {
        try {
          if (linkParam.source_account_id > 0) {
            await this.checkAccountId(user.id,
              linkParam.source_account_id,
              'source_account_id');
          }
          if (linkParam.destination_account_id > 0) {
            await this.checkAccountId(user.id,
              linkParam.destination_account_id,
              'destination_account_id');
          }
          const updatedDate = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(updatedDate);
          const newLink = await this.create(user.id, linkParam, updatedDate);
          return new LinkedObjectWithRef({
            id: newLink.id,
            source_object_uid: LinkHelper.getObjectUid(newLink.source_object_uid,
              newLink.source_object_type),
            source_object_type: newLink.source_object_type,
            source_account_id: newLink.source_account_id,
            source_object_href: newLink.source_object_href,
            destination_object_uid: LinkHelper.getObjectUid(newLink.destination_object_uid,
              newLink.destination_object_type),
            destination_object_type: newLink.destination_object_type,
            destination_account_id: newLink.destination_account_id,
            destination_object_href: newLink.destination_object_href,
            is_trashed: newLink.is_trashed,
            created_date: newLink.created_date,
            updated_date: newLink.updated_date,
            ref: linkParam.ref,
          });
        } catch (err) {
          this.handleError(err, ErrorCode.CREATE_FAILED, errors, linkParam);
        }
      }),
    );
    const successLinks = createdLinks.filter(Boolean);
    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.LINKED_OBJECT,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }
    return {
      created: successLinks,
      errors,
    };
  }

  async findByObjectUids(
    userId: number,
    objectUids: string[],
    objectType: string,
    options?: LinkedObjectServiceOptions) {
    const { fields } = options;
    const aliasName = this.linkedObject.metadata.name;
    let query = this.linkedObject.createQueryBuilder(aliasName);
    if (fields && fields.length > 0) {
      query = query.select(fields.map(f => `${aliasName}.${String(f)} as ${String(f)}`));
    }
    query = query.where(`${aliasName}.user_id = :userId`, { userId });
    if (objectUids && objectUids.length) {
      query = query
        .andWhere(
          `((${aliasName}.source_object_type = :objectType AND ${aliasName}.source_object_uid IN (:...objectUids))
          OR (${aliasName}.destination_object_type = :objectType AND ${aliasName}.destination_object_uid IN (:...objectUids)))`,
          { objectType, objectUids });
    } else {
      return { items: [] };
    }
    const items = await query.getRawMany();
    return { items };
  }
  async checkAccountId(userId: number, accountId: number, fieldName: string) {
    let attributes = {};
    switch (fieldName) {
      case 'source_account_id':
        attributes = { source_account_id: accountId };
        break;
      case 'destination_account_id':
        attributes = { destination_account_id: accountId };
        break;
    }
    const isExisted = await this.thirdPartyAccountService.isExist(
      userId,
      accountId);
    if (isExisted === 0) {
      throw new LinkedObjectParamError({
        code: ErrorCode.ACCOUNT_NOT_FOUND,
        message: format(MSG_ERR_LINK.INVALID_ACCOUNT_ID, fieldName),
        attributes
      });
    }
  }
  private handleError(
    err: any,
    code: string,
    errors: LinkedObjectParamError[],
    attributes: Partial<LinkedObjectDto>,
  ) {
    if (err instanceof LinkedObjectParamError) {
      errors.push(err);
      return;
    } else {
      if (err instanceof QueryFailedError || err instanceof EntityNotFoundError) {
        errors.push(new LinkedObjectParamError({
          code,
          message: err.message,
          attributes
        }));
        return;
      }
    }
    throw err;
  }

  async deleteBatchLinks(data: DeleteLinkedObjectDto[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const timeLastModify: number[] = [];
    const currentTime = getUtcMillisecond();
    await Promise.all(data.map(async (item, index) => {
      try {
        const itemLinkObj = await this.linkedObject.findOne({
          where: { id: item.id, user_id: user.id }
        });
        const errLik = MSG_ERR_LINK.LINK_NOT_EXIST;
        if (!itemLinkObj) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, errLik, item);
          return itemFail.push(errItem);
        }
        const delItemLinkObj = await this.linkedObject.delete({ id: item.id, user_id: user.id });
        if (!delItemLinkObj || delItemLinkObj.affected === 0) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, errLik, item);
          itemFail.push(errItem);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, index);
          const isInsertDeletedItem = await this.deletedItemService.create(user.id, {
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.LINK,
            created_date: dateItem,
            updated_date: dateItem
          });
          if (!isInsertDeletedItem) { // push item into itemFail if false
            const errItem = buildFailItemResponse(ErrorCode.DELETE_FAILED,
              MSG_ERR_WHEN_DELETE, item);
            return itemFail.push(errItem);
          }
          timeLastModify.push(dateItem);
          itemPass.push({ id: item.id });
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        // this.logger.logError(error);
        itemFail.push(errItem);
      }
    }));

    if (itemPass.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.LINKED_OBJECT,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return { itemPass, itemFail };
  }
}
