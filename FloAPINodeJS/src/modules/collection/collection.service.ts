import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, In, LessThan, QueryFailedError, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiLastModifiedName,
  CHAT_CHANNEL_TYPE,
  COLLECTION_TYPE,
  DELETED_ITEM_TYPE,
  IS_TRASHED
} from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_ERR_SYSTEM_KANBAN } from '../../common/constants/message.constant';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { CollectionIconEntity } from '../../common/entities/collection-icon.entity';
import { Collection } from '../../common/entities/collection.entity';
import { GlobalSetting } from '../../common/entities/setting.entity';
import { ShareMember } from '../../common/entities/share-member.entity';
import { IReq, IUser } from '../../common/interfaces';
import { CollectionOptionsInterface } from '../../common/interfaces/collection.interface';
import { KanbanRepository } from '../../common/repositories';
import { CollectionRepository } from '../../common/repositories/collection.repository';
import { RuleRepository } from '../../common/repositories/rule.repository';
import { asyncFilter, getMaxUpdatedDate } from '../../common/utils/common';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { CollectionQueueService } from '../bullmq-queue/collection-queue.service';
import {
  CreateChannel, CreateChimeChannel,
  EventNames,
  UpdateCollectionEvent
} from '../communication/events';
import { ChannelType, ChatChannel } from '../communication/interfaces';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { SieveEmailService } from '../manual-rule/sieve.email';
import { GlobalSettingService as SettingService } from '../setting/setting.service';
import {
  CollectionErrorCode,
  CollectionErrorDict,
  CollectionErrorInterface
} from './collection-response-message';
import {
  CollectionType,
  CreateCollectionParam,
  DeleteCollectionParam,
  UpdateCollectionParam
} from './dto/collection-param';
import {
  CollectionParamError,
  DeleteCollectionParamError,
  UpdateCollectionParamError
} from './dto/collection-param-error';
import { CollectionWithRef } from './dto/create-collection.response';

@Injectable()
export class CollectionService {
  constructor(
    // we create a repository for the Collection entity
    // and then we inject it as a dependency in the service
    private readonly collectionRepository: CollectionRepository,
    @InjectRepository(CollectionIconEntity)
    private readonly collectionIcon: Repository<CollectionIconEntity>,
    @InjectRepository(ShareMember) private readonly shareMember: Repository<ShareMember>,
    private readonly manualRuleRepo: RuleRepository,
    private readonly deletedItem: DeletedItemService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly collectionQueueService: CollectionQueueService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly settingService: SettingService,
    private readonly sieveEmailService: SieveEmailService,
    private readonly eventEmitter: EventEmitter2,
    private readonly kanbanRepo: KanbanRepository
  ) { }

  // this method retrieves all entries
  async getAllFiles(filter: BaseGetDTO, user_id: number) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const collections: Collection[] = await this.databaseUtilitiesService.getAll({
      userId: user_id,
      filter: {
        ...filter,
        remove_deleted: true
      },
      repository: this.collectionRepository
    });

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(user_id, DELETED_ITEM_TYPE.FOLDER, {
        ids,
        modified_gte,
        modified_lt,
        page_size
      });
    }

    return {
      data: collections,
      data_del: deletedItems
    };
  }

  // this method retrieves only one entry, by entry ID
  findOneById(userId: number, id: number, options?: CollectionOptionsInterface) {
    return this.collectionRepository.findOne({
      select: options && options.fields,
      where: {
        id,
        user_id: userId,
      }
    });
  }

  // this method retrieves only one entry, by entry ID
  findOneWithCondition(options?: CollectionOptionsInterface) {
    return this.collectionRepository.findOne({
      select: options && options.fields,
      where: options.conditions
    });
  }

  // this method retrieves entries by entry ID
  findByIds(userId: number, ids: number[], options?: CollectionOptionsInterface) {
    return this.collectionRepository.find({
      select: options && options.fields,
      where: {
        id: In(ids),
        user_id: userId,
        is_trashed: IS_TRASHED.NOT_TRASHED
      }
    });
  }

  checkParentCollectionShare(colParams: CreateCollectionParam[]) {
    const valid: CreateCollectionParam[] = [];
    const shareColErrs: CreateCollectionParam[] = [];
    const errors = [];
    for (const col of colParams) {
      if (
        (col.type === COLLECTION_TYPE.SHARE_COLLECTION &&
          col.parent_id !== 0 &&
          col.parent_id !== undefined) ||
        col.parent_id === null
      )
        shareColErrs.push(col);
      else valid.push(col);
    }

    shareColErrs.forEach((item) => {
      errors.push(
        new CollectionParamError({
          ...CollectionErrorDict.UNABLE_TO_SET_PARENT,
          attributes: {
            type: item.type,
            parent_id: item.parent_id,
            ref: item.ref,
          },
        }),
      );
    });

    return { valid, errors };
  }

  checkDuplicateCollNamePayload(colParams) {
    const duplicatedNameErrs = [];
    const errors = [];
    const valid = colParams.filter((value, index, self) => {
      if (
        index === self.findIndex((t) =>
          t.name?.toLowerCase() === value.name?.toLowerCase() && t.parent_id === value.parent_id)
      ) {
        return value;
      }
      duplicatedNameErrs.push(value);
    });

    duplicatedNameErrs.forEach((item) => {
      errors.push(
        new CollectionParamError({
          ...CollectionErrorDict.DUPLICATED_COLLECTION_NAME,
          attributes: {
            name: item.name,
            parent_id: item.parent_id,
            ref: item.ref,
          },
        }),
      );
    });

    return { valid, errors };
  }

  // this method saves an entry in the database
  async checkDbLevelAndCreateEntity(
    user: IUser, colParam: CreateCollectionParam, dateItem: number): Promise<Collection> {
    const { result, error } = await this.checkValidLevelCollection(user.id, colParam.parent_id);
    if (!result) {
      throw new CollectionParamError({
        ...error,
        attributes: {
          parent_id: colParam.parent_id,
          ref: colParam.ref
        }
      });
    }

    if (!colParam.calendar_uri) {
      colParam.calendar_uri = uuidv4();
    }
    const colEntity = this.collectionRepository.create({
      user_id: user.id,
      ...colParam,
      icon: colParam.icon || '',
      created_date: dateItem,
      updated_date: dateItem
    });
    return colEntity;
  }

  async createBatchCollections(collectionParams: CreateCollectionParam[],
    { user, headers }: IReq): Promise<{
      created: CollectionWithRef[],
      errors: CollectionParamError[]
    }> {
    // check icon collection is valid or not
    let errors: CollectionParamError[] = [];
    const iconErr: CollectionParamError[] = [];
    const colParams = await asyncFilter(collectionParams, async (colItem) => {
      if (colItem.icon) {
        const validIcon = await this.collectionIcon.findOne({
          where: { shortcut: colItem.icon }
        });
        if (validIcon) {
          return colItem;
        }
        iconErr.push(new CollectionParamError({
          ...CollectionErrorDict.ICON_INVALID,
          attributes: {
            icon: colItem.icon,
            ref: colItem.ref,
          },
        }));
        return;
      }
      return colItem;
    });
    if (colParams && colParams.length > 0) {
      const { valid: unique, errors: duplicated } = this.getUniqueCalendarUidCollection(colParams);
      const { valid: parentValid, errors: shareColErrs } = this.checkParentCollectionShare(unique);
      const { valid: dupValid, errors: dupErrs } = this.checkDuplicateCollNamePayload(parentValid);
      const { valid, errors: dupDbErrs } = await this.checkDupNameOrCalendarDb(user.id, dupValid);

      errors = [...duplicated, ...shareColErrs, ...dupErrs, ...dupDbErrs, ...iconErr];

      const checkError = (err, colParam) => {
        if (err instanceof CollectionParamError) {
          errors.push(err);
          return true;
        }

        if (err instanceof QueryFailedError && err.message.includes('ER_DUP_ENTRY')) {
          errors.push(new CollectionParamError({
            ...CollectionErrorDict.DUPLICATED_ENTRY,
            attributes: colParam
          }));
          return true;
        }

        if (err instanceof QueryFailedError || err instanceof EntityNotFoundError) {
          errors.push(new CollectionParamError({
            code: CollectionErrorCode.COLLECTION_ENTITY_ERROR,
            message: err.message,
            attributes: colParam
          }));
          return true;
        }
        return false;
      };

      const currentTime = getUtcMillisecond();
      const timeLastModify = [];
      const createdCols: Collection[] =
        await Promise.all(valid.map(async (colParam, idx) => {
          try {
            // buffer 50 ms for create kanban without duplicate
            const updatedDate = getUpdateTimeByIndex(currentTime, idx + 50);
            timeLastModify.push(updatedDate);
            const colEntity = await this.checkDbLevelAndCreateEntity(user,
              colParam, updatedDate);
            return colEntity;
          } catch (err) {
            const check = checkError(err, colParam);
            if (check) return;
            throw err;
          }
        }));

      const insResult = await this.collectionRepository
        .save(createdCols.filter(Boolean));
      const { itemPass, itemFail } =
        await this.createSystemKanbanAndMergeResult(insResult, valid, { user, headers });
      if (itemFail.length > 0) {
        errors = [...itemFail];
      }

      if (timeLastModify.length > 0) {
        const updatedDate = getMaxUpdatedDate(createdCols);
        await this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.COLLECTION,
          userId: user.id,
          email: user.email,
          updatedDate
        }, headers);
      }

      // call to Chime create channel
      const channelData: ChatChannel[] = itemPass
        .filter(item => item.type === CollectionType.SharedCollection)
        .map(item => ({
          internal_title: item.name,
          internal_channel_id: item.id,
          internal_channel_type: CHAT_CHANNEL_TYPE.SHARED_COLLECTION,
          ref: item.id
        }));
      this.eventEmitter
        .emit(EventNames.CHATTING_CREATE_CHANNEL, {
          headers,
          user,
          channels: channelData
        } as CreateChimeChannel);

      return {
        created: itemPass,
        errors
      };
    }
    return {
      created: [],
      errors: iconErr
    };
  }

  async updateWithReturn(
    listCollection,
    userId: number,
    colParam: UpdateCollectionParam,
    setting: GlobalSetting,
    updatedDate: number
  ) {
    if (colParam.id && Object.keys(colParam).length === 1)
      throw new UpdateCollectionParamError({
        ...CollectionErrorDict.NOTHING_TO_UPDATE,
        attributes: {
          id: colParam.id
        }
      });

    if (colParam.id === colParam.parent_id) throw new UpdateCollectionParamError({
      ...CollectionErrorDict.PARENT_ITSELF,
      attributes: {
        id: colParam.id,
        parent_id: colParam.parent_id,
      }
    });

    if (colParam.parent_id) {
      const { result, error } =
        await this.checkValidLevelCollectionUpdate(userId, colParam.parent_id, colParam.id);

      if (!result) {
        throw new UpdateCollectionParamError({
          ...error,
          attributes: {
            id: colParam.id,
            parent_id: colParam.parent_id,
          }
        });
      }
    }

    const collection = listCollection.find(col => (col.id === colParam.id));
    delete collection.realtime_channel;
    if (!collection) throw new UpdateCollectionParamError({
      ...CollectionErrorDict.COLLECTION_NOT_FOUND,
      attributes: {
        id: colParam.id,
      }
    });

    const colEntity = this.collectionRepository.create({
      ...colParam,
      updated_date: updatedDate
    });

    const updateResult = await this.collectionRepository.update({
      id: colParam.id,
      user_id: userId
    }, colEntity);
    if (updateResult.affected === 0) throw new UpdateCollectionParamError({
      ...CollectionErrorDict.COLLECTION_NOT_FOUND,
      attributes: {
        id: colParam.id
      }
    });
    return {
      ...collection,
      ...colEntity
    };
  }

  async updateBatchCollectionsWithReturn(colParams: UpdateCollectionParam[],
    { user, headers }: IReq):
    Promise<{
      updated: Collection[],
      errors: UpdateCollectionParamError[]
    }> {
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    const icErrors: UpdateCollectionParamError[] = [];
    // check icon collection is valid or not
    colParams = await asyncFilter(colParams, async (colItem) => {
      if (colItem.icon) {
        const validIcon = await this.collectionIcon
          .findOne({ where: { shortcut: colItem.icon } });
        if (validIcon) {
          return colItem;
        }
        icErrors.push(new UpdateCollectionParamError({
          ...CollectionErrorDict.ICON_INVALID,
          attributes: {
            icon: colItem.icon,
          },
        }));
        return;
      }
      return colItem;
    });
    const { valid: unique, errors: duplicate } = this.checkDuplicateCollectionIdUpdate(colParams);
    const ids = colParams.map(item => item.id);
    const listCollection = await this.collectionRepository.findOnMasterByUids(ids, user.id);

    const { valid: validParent, errors: shareColErrs
    } = await this.checkParentCollectionUpdate(unique, listCollection);

    const { valid, errors: dupDbErrs } = await this.checkDupName4UpdateDb(user.id, validParent);
    const errors: UpdateCollectionParamError[] = [
      ...icErrors
      , ...duplicate
      , ...shareColErrs
      , ...dupDbErrs
    ];

    const setting = await this.settingService.findOneByUserId(user.id, {
      fields: ['default_folder']
    });

    const updatedCols: Collection[] = [];
    for (const [idx, colParam] of valid.entries()) {
      try {
        const updatedDate = getUpdateTimeByIndex(currentTime, idx);
        timeLastModify.push(updatedDate);
        const itemUpdate = await this.updateWithReturn(
          listCollection,
          user.id,
          colParam,
          setting,
          updatedDate
        );

        updatedCols.push(itemUpdate);
        // emit when update collection
        const collection = listCollection.find(col => (col.id === colParam.id));
        this.eventEmitter
          .emit(EventNames.UPDATE_COLLECTION, {
            collection,
            new_collection: itemUpdate,
            email: user.email
          } as UpdateCollectionEvent);
      } catch (err) {
        if (err instanceof UpdateCollectionParamError) {
          errors.push(err);
        }
        if (err instanceof QueryFailedError) {
          errors.push(new UpdateCollectionParamError({
            code: CollectionErrorCode.COLLECTION_ENTITY_ERROR,
            message: err.message,
            attributes: colParam
          }));
        }
        if (err instanceof EntityNotFoundError) {
          errors.push(new UpdateCollectionParamError({
            code: CollectionErrorCode.COLLECTION_ENTITY_ERROR,
            message: err.message,
            attributes: colParam
          }));
        }
      }
    }

    const maxUpdatedDate = Math.max(...timeLastModify);
    if (timeLastModify.length > 0) {
      await this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.COLLECTION,
        userId: user.id,
        email: user.email,
        updatedDate: maxUpdatedDate
      }, headers);
    }

    const filterCollections = updatedCols.filter((e) => {
      return e !== undefined;
    });

    if (filterCollections.length > 0) {
      const sharedCollectionIds = [];
      filterCollections.forEach(collection => {
        if (collection.type === COLLECTION_TYPE.SHARE_COLLECTION) {
          sharedCollectionIds.push(collection.id);
        }
      });

      const members = [];
      if (sharedCollectionIds.length > 0) {
        const shareMembers = await this.shareMember.find({
          select: ['member_user_id', 'shared_email'],
          where: {
            collection_id: In(sharedCollectionIds),
            // lastmodify for all member with all status
            // shared_status: SHARE_STATUS.JOINED
          }
        });

        if (shareMembers.length > 0) {
          shareMembers.forEach(shareMember => {
            members.push(shareMember);
          });
        }
      }
      const filterMembers = [...new Set(members)];
      filterMembers.forEach(({ member_user_id, shared_email }) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.COLLECTION_MEMBER,
          userId: member_user_id,
          email: shared_email,
          updatedDate: maxUpdatedDate
        }, headers);
      });
    }
    return {
      updated: filterCollections,
      errors
    };

  }

  async delete(userId, collectionParam: DeleteCollectionParam) {
    const collection = await this.collectionRepository.findOne({
      select: ['id', 'calendar_uri', 'is_trashed'],
      where: {
        user_id: userId,
        id: collectionParam.id
      }
    });

    if (!collection) {
      throw new DeleteCollectionParamError({
        ...CollectionErrorDict.COLLECTION_NOT_FOUND,
        attributes: {
          id: collectionParam.id
        }
      });
    }

    if (collection?.is_trashed === IS_TRASHED.DELETED) {
      throw new DeleteCollectionParamError({
        ...CollectionErrorDict.ALREADY_DELETED,
        attributes: {
          id: collectionParam.id
        }
      });
    }

    collection.is_trashed = IS_TRASHED.DELETED;
    await this.collectionRepository.update(collection.id, {
      is_trashed: IS_TRASHED.DELETED
    });
  }

  async deleteWorker42(userId, collectionParam: DeleteCollectionParam) {
    const collection = await this.collectionRepository.findOne({
      select: ['id', 'calendar_uri', 'type'],
      where: {
        user_id: userId,
        is_trashed: LessThan(IS_TRASHED.DELETED),
        id: collectionParam.id
      }
    });

    if (!collection) {
      throw new DeleteCollectionParamError({
        ...CollectionErrorDict.COLLECTION_NOT_FOUND,
        attributes: {
          id: collectionParam.id
        }
      });
    }

    return collection;
  }

  async batchDelete(collectionParams: DeleteCollectionParam[], { user, headers }: IReq) {
    const errors: DeleteCollectionParamError[] = [];
    const mergeChildren = [];
    const collectionShareMemberIds = [];
    const deleted = (await Promise.all(collectionParams.map(async c => {
      try {
        const collection: Collection = await this.deleteWorker42(user.userId, c);
        if (collection.type === COLLECTION_TYPE.SHARE_COLLECTION) {
          collectionShareMemberIds.push(collection.id);
        }
        const children =
          await this.findAllChildrenRecursivelyAndMarkDeleted(user.userId, collection.id);

        if (children.length === 0) {
          mergeChildren.push(collection.id);
        }
        children.map(item => mergeChildren.push(item.id, item.parent_id));
        return c;
      } catch (err) {
        if (err instanceof DeleteCollectionParamError) {
          errors.push(err);
          return;
        }
        if (err instanceof QueryFailedError) {
          errors.push(new DeleteCollectionParamError({
            code: CollectionErrorCode.COLLECTION_ENTITY_ERROR,
            message: err.message,
            attributes: c
          }));
          return;
        }
        if (err instanceof EntityNotFoundError) {
          errors.push(new DeleteCollectionParamError({
            code: CollectionErrorCode.COLLECTION_ENTITY_ERROR,
            message: err.message,
            attributes: c
          }));
          return;
        }
        throw err;
      }
    }))).filter(Boolean);
    const dataArrWithSet = new Set(mergeChildren);
    const collectionParentAndChildren = [...dataArrWithSet];

    // Create queue to delete share member collection and child collection
    if (collectionShareMemberIds.length > 0) {
      // delete chime
      const channelData: ChatChannel[] = collectionShareMemberIds
        .map(item => ({
          internal_channel_id: item,
          internal_channel_type: CHAT_CHANNEL_TYPE.SHARED_COLLECTION,
          ref: item
        }));

      const eventChimeData: CreateChimeChannel = {
        headers,
        user,
        channels: channelData
      };
      this.eventEmitter
        .emit(EventNames.CHATTING_DELETE_CHANNEL, eventChimeData);
      await this.collectionQueueService
        .deleteCollectionOfMember(user.userId, collectionShareMemberIds);
    }
    if (collectionParentAndChildren.length > 0) {
      await this.collectionQueueService
        .deleteCollectionTree(user.userId, collectionParentAndChildren);
      await this.sieveEmailService.deleteRuleByCollection(
        collectionParentAndChildren, user.userId, user.email
        , this.manualRuleRepo
        , this.apiLastModifiedQueueService
        , this.deletedItem
      );
    }

    return {
      deleted,
      errors
    };
  }

  async findAllChildrenRecursivelyAndMarkDeleted(userId: number, parentIdCol: number) {
    try {
      let validLevel = 0;
      const findAllRecursive = async (collectionId) => {
        const cols = await this.collectionRepository.find({
          select: ['parent_id', 'id'],
          where: {
            user_id: userId,
            parent_id: collectionId
          }
        });
        const recursiveCols = await Promise.all(cols.map(async c => {
          validLevel++;
          if (validLevel > 8) throw Error;
          return await findAllRecursive(c.id);
        }));
        return recursiveCols.reduce((prev, cur) => [...prev, ...cur], cols);
      };
      const results: Collection[] = await findAllRecursive(parentIdCol);
      return results;
    } catch (error) {
      return [];
    }
  }

  // Check any duplicate calendar_uri in array of CreateCollectionParam
  // Remove the second collection which has duplicated calendar_uri
  // Return: valid collection
  private getUniqueCalendarUidCollection(cols: CreateCollectionParam[]): {
    valid: CreateCollectionParam[],
    errors: CollectionParamError[]
  } {
    const invalidColIndexs: number[] = [];
    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        if (cols[i].calendar_uri === cols[j].calendar_uri &&
          cols[i].calendar_uri) {
          invalidColIndexs.push(j);
        }
      }
    }
    const duplicated: CreateCollectionParam[] = cols.filter(
      (col, index) => invalidColIndexs.includes(index)
    );
    const errors: CollectionParamError[] = [];
    duplicated.forEach(item => {
      errors.push(new CollectionParamError({
        ...CollectionErrorDict.DUPLICATED_CALID_BATCH,
        attributes: {
          calendar_uri: item.calendar_uri,
          ref: item.ref,
        },
      }));
    });

    return {
      valid: cols.filter((col, index) => !invalidColIndexs.includes(index)),
      errors
    };
  }

  private async checkValidLevelCollection(userId: number,
    colParentId: number): Promise<{
      result: boolean,
      error?: CollectionErrorInterface
    }> {
    let level = 0;
    let curParentId = colParentId || 0;
    while (level < 7) {
      if (curParentId === 0) {
        return {
          result: true
        };
      }
      const col = await this.collectionRepository.findOne({
        select: ['user_id', 'parent_id', 'type', 'is_trashed'],
        where: {
          id: curParentId
        }
      });
      if (!col) return {
        result: false,
        error: CollectionErrorDict.PARENT_NOT_FOUND
      };
      if (col.user_id !== userId) return {
        result: false,
        error: CollectionErrorDict.PARENT_NOT_FOUND
      };
      if (col.is_trashed === IS_TRASHED.TRASHED) return {
        result: false,
        error: CollectionErrorDict.COLLECTION_TRASHED
      };
      // Check no children for share collection
      if (col.type === COLLECTION_TYPE.SHARE_COLLECTION)
        return {
          result: false,
          error: CollectionErrorDict.UNABLE_TO_SET_CHILDREN,
        };
      level++;
      curParentId = col.parent_id;
    }
    return {
      result: false,
      error: CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED
    };
  }

  private async findAllRecursive(
    colId: number,
    userId: number,
    colParentId: number,
    collectionId: number,
    level = 0) {

    const optionItems: CollectionOptionsInterface = {
      fields: ['id', 'parent_id'],
      conditions: { user_id: userId, parent_id: colId }
    };
    const cols = await this.collectionRepository.findAllOnMaster(optionItems);

    if (cols.length === 0) return level;
    const levels = await Promise.all(cols.map(async c => {
      if (c.id === colParentId) {
        throw new UpdateCollectionParamError({
          ...CollectionErrorDict.CIRCULAR_REFERENCE,
          attributes: { id: collectionId, parent_id: colParentId }
        });
      }
      return this.findAllRecursive(c.id, userId, colParentId, collectionId, level + 1);
    }));
    return Math.max(...levels);
  }

  private async checkValidLevelCollectionUpdate(userId: number,
    colParentId: number, collectionId: number): Promise<{
      result: boolean,
      error?: CollectionErrorInterface
    }> {
    let upLevel = 0;
    let curParentId = colParentId || 0;
    while (upLevel < 7) {
      if (curParentId === 0) {
        break;
      }

      const optionItem: CollectionOptionsInterface = {
        fields: ['user_id', 'parent_id', 'type', 'is_trashed'],
        conditions: { id: curParentId }
      };

      const col = await this.collectionRepository.findOneOnMaster(optionItem);
      if (!col || (!!col && col.user_id !== userId)) {
        return {
          result: false,
          error: CollectionErrorDict.PARENT_NOT_FOUND
        };
      }
      if (col.is_trashed === IS_TRASHED.TRASHED) {
        return {
          result: false,
          error: CollectionErrorDict.COLLECTION_TRASHED
        };
      }
      // Check no children for share collection
      if (col.type === COLLECTION_TYPE.SHARE_COLLECTION) {
        return {
          result: false,
          error: CollectionErrorDict.UNABLE_TO_SET_CHILDREN,
        };
      }

      upLevel++;
      curParentId = col.parent_id;
    }

    if (upLevel >= 7) {
      return {
        result: false,
        error: CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED
      };
    }

    const downLevel = await this.findAllRecursive(collectionId, userId, colParentId, collectionId);
    if (upLevel + downLevel >= 7) {
      return {
        result: false,
        error: CollectionErrorDict.COLLECTION_LEVEL_EXCEEDED
      };
    }

    return { result: true };
  }

  private async checkDupNameOrCalendarDb(userId: number,
    colParams: CreateCollectionParam[]): Promise<{
      valid: CreateCollectionParam[],
      errors: CollectionParamError[]
    }> {
    const names: string[] = [];
    const calendar_uris: string[] = [];
    for (const p of colParams) {
      names.push(p.name);
      if (p.calendar_uri) calendar_uris.push(p.calendar_uri);
    }
    const colDuplicate = await this.collectionRepository.find({
      select: ['id', 'name', 'calendar_uri', 'parent_id'],
      where: [{
        user_id: userId,
        name: In(names)
      }, {
        user_id: userId,
        calendar_uri: In(calendar_uris)
      }]
    });

    const duplicated: CreateCollectionParam[] = [];
    const duplicatedCal: CreateCollectionParam[] = [];
    const valid: CreateCollectionParam[] = [];
    for (const p of colParams) {
      if (p.parent_id === null || p.parent_id === undefined) {
        p.parent_id = 0;
      }
      let isDup = false;
      for (const c of colDuplicate) {
        if (p.name?.toLowerCase() === c.name.toLowerCase()
          && p.parent_id === c.parent_id) {
          duplicated.push(p);
          isDup = true;
          break;
        }
        if (p.calendar_uri === c.calendar_uri) {
          duplicatedCal.push(p);
          isDup = true;
          break;
        }
      }
      if (!isDup) {
        valid.push(p);
      }
    }
    const errors: CollectionParamError[] = [];
    duplicated.forEach(item => {
      errors.push(new CollectionParamError({
        ...CollectionErrorDict.DUPLICATED_COLLECTION_NAME,
        attributes: {
          name: item.name,
          ref: item.ref,
        },
      }));
    });
    duplicatedCal.forEach(item => {
      errors.push(new CollectionParamError({
        ...CollectionErrorDict.CALID_ALREADY_EXISTS,
        attributes: {
          calendar_uri: item.calendar_uri,
          ref: item.ref,
        },
      }));
    });

    return {
      valid,
      errors
    };
  }

  private async checkDupName4UpdateDb(userId: number,
    colParams: UpdateCollectionParam[]): Promise<{
      valid: UpdateCollectionParam[],
      errors: UpdateCollectionParamError[]
    }> {
    const errors: UpdateCollectionParamError[] = [];
    const valid: UpdateCollectionParam[] = [];
    await Promise.all(colParams.map(async colParam => {
      const optionItem: CollectionOptionsInterface = {
        fields: ['parent_id', 'name'],
        conditions: {
          id: colParam.id,
          user_id: userId
        }
      };
      const col = await this.collectionRepository.findOneOnMaster(optionItem);
      if (!col) {
        errors.push(new UpdateCollectionParamError({
          ...CollectionErrorDict.COLLECTION_NOT_FOUND,
          attributes: {
            id: colParam.id,
          },
        }));
        return;
      }

      if (colParam.parent_id === undefined) {
        colParam.parent_id = col.parent_id;
      }
      if (!colParam.name) {
        colParam.name = col.name;
      }

      const optionDubItem: CollectionOptionsInterface = {
        fields: ['id', 'parent_id', 'name'],
        conditions: {
          name: colParam.name,
          user_id: userId
        }
      };
      const duplicatedNameCol = await this.collectionRepository.findAllOnMaster(optionDubItem);
      let isDup = true;
      if (duplicatedNameCol && duplicatedNameCol.length > 0) {
        await Promise.all(duplicatedNameCol.map(async c => {
          if (((c.parent_id === colParam.parent_id)
            && (colParam.name?.toLowerCase() === c.name.toLowerCase()))
            && colParam.id !== c.id) {
            errors.push(new UpdateCollectionParamError({
              ...CollectionErrorDict.DUPLICATED_COLLECTION_NAME,
              attributes: {
                id: colParam.id,
                name: colParam.name
              },
            }));
            isDup = false;
            return;
          }
        }));
      }
      if (isDup) return valid.push(colParam);
    }));
    return {
      valid,
      errors
    };
  }

  private async checkParentCollectionUpdate(colParams: UpdateCollectionParam[]
    , collections: Collection[]) {
    const valid: UpdateCollectionParam[] = [];
    const shareColErrs: UpdateCollectionParam[] = [];
    const errors = [];
    for (const col of colParams) {
      const checkCol: Collection = collections.find((item) => item.id === col.id);
      if (checkCol?.type === COLLECTION_TYPE.SHARE_COLLECTION
        && (col.parent_id > 0 || col.parent_id === null)
      ) {
        shareColErrs.push(col);
      } else {
        if (checkCol?.parent_id && !col.parent_id && col.parent_id !== 0) {
          col.parent_id = checkCol.parent_id;
        }
        valid.push(col);
      }
    }
    shareColErrs.forEach((item) => {
      errors.push(
        new UpdateCollectionParamError({
          ...CollectionErrorDict.UNABLE_TO_SET_PARENT,
          attributes: {
            id: item.id,
            parent_id: item.parent_id
          },
        }),
      );
    });

    return { collections, valid, errors };
  }

  private checkDuplicateCollectionIdUpdate(colParams: UpdateCollectionParam[]) {
    const duplicate: UpdateCollectionParam[] = [];
    const errors = [];
    const valid = colParams.filter((value, index, self) => {
      if (index === self.findIndex((t) => t.id === value.id)) {
        return value;
      }
      duplicate.push(value);
    });
    duplicate.forEach((item) => {
      errors.push(
        new UpdateCollectionParamError({
          ...CollectionErrorDict.DUPLICATED_ID_BATCH,
          attributes: {
            id: item.id,
          },
        }),
      );
    });

    return { valid, errors };
  }

  private async createSystemKanbanAndMergeResult(generatedMaps: Collection[],
    params: CreateCollectionParam[],
    { user, headers }: IReq) {
    const itemPass: CollectionWithRef[] = [];
    const itemFail = [];
    await Promise.all(generatedMaps.map(async (collection, idx) => {
      const isGeneratedSystemKanban = await this.kanbanRepo
        .generateSystemKanban(collection.id, user.id,
          collection.updated_date + (idx * 20)); // 20 buffer time
      if (isGeneratedSystemKanban === 0) {
        return itemFail.push(new CollectionParamError({
          code: CollectionErrorCode.COLLECTION_SYSTEM_ERROR,
          message: MSG_ERR_SYSTEM_KANBAN,
          attributes: collection
        }));
      }
      // Keep logic of A Trung
      const mergeDataPassed = new CollectionWithRef({
        ...collection,
        ...params.find(v => v.calendar_uri === collection.calendar_uri),
        user_id: undefined
      });
      // 15-Apr-2024: open for all collection types
      // if (collection?.type === COLLECTION_TYPE.SHARE_COLLECTION)
      // create real-time channel for shared collection
      const realtimeChannel = await this.eventEmitter
        .emitAsync(EventNames.CREATE_REALTIME_CHANNEL, {
          headers,
          channelId: collection?.id,
          title: collection?.name,
          type: ChannelType.SHARED_COLLECTION,
          members: [{ email: user.email }]
        } as CreateChannel);

      if (realtimeChannel.length) {
        const { channel, error } = realtimeChannel[0] || {
          channel: null, error: null
        };
        if (error) {
          itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
            error?.message, {}));
        } else if (channel) {
          this.collectionRepository.updateRealtimeChannel(
            channel?.name, collection?.id);
          mergeDataPassed.realtime_channel = realtimeChannel[0]?.channel?.name;
        }
      }
      itemPass.push(mergeDataPassed);
    }));
    return { itemPass, itemFail };
  }
}