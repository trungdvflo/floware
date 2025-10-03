import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApiLastModifiedName, CIRTERION_TYPE, DELETED_ITEM_TYPE } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_NOT_EXIST, MSG_ERR_WHEN_CREATE,
  MSG_ERR_WHEN_DELETE, MSG_ERR_WHEN_UPDATE
} from '../../common/constants/message.constant';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { Collection } from '../../common/entities/collection.entity';
import { IdenticalSender } from '../../common/entities/identical_sender.entity';
import { SuggestedCollection } from '../../common/entities/suggested_collection.entity';
import { ThirdPartyAccount } from '../../common/entities/third-party-account.entity';
import { IReq } from '../../common/interfaces';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { DeleteSeggestedCollectionDTO } from './dtos/suggested_collection.delete.dto';
import { CreateSuggestedCollectionDTO } from './dtos/suggested_collection.post.dto';
import { UpdateSuggestedCollectionDTO } from './dtos/suggested_collection.put.dto';

@Injectable()
export class SuggestedCollectionService {
  constructor(
    @InjectRepository(SuggestedCollection)
    private readonly suggestedCollectionRepo: Repository<SuggestedCollection>,
    @InjectRepository(IdenticalSender)
    private readonly identicalSenderRepo: Repository<IdenticalSender>,
    @InjectRepository(Collection)
    private readonly collectionRepo: Repository<Collection>,
    @InjectRepository(ThirdPartyAccount)
    private readonly thirdPartyAccountRepo: Repository<ThirdPartyAccount>,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly deletedItem: DeletedItemService) { }

  async getAll(filter: GetAllFilter<SuggestedCollection>, { user, headers }: IReq) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const collections: SuggestedCollection[]
      = await this.databaseUtilitiesService.getAllSuggestedCollection({
        userId: user.id,
        filter,
        repository: this.suggestedCollectionRepo
      });
    if (collections.length > 0) {
      await Promise.all(collections.map(async (item: CreateSuggestedCollectionDTO) => {
        delete item['criterion_checksum'];
        if (item.criterion_value === '' || item.criterion_value === null) {
          const lstEmail = await this.identicalSenderRepo.createQueryBuilder('is')
            .select('is.email_address AS email')
            .where('is.suggested_collection_id = :suggestedID', {
              suggestedID: item['id']
            }).getRawMany();
          item.criterion_value = lstEmail as [];
        }
      }));
    }

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(user.id,
        DELETED_ITEM_TYPE.SUGGESTED_COLLECTION,
        {
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

  public filterDuplicateDelItem(data: DeleteSeggestedCollectionDTO[]) {
    const dataError = [];
    const dataFilter = data.filter((value, index, self) => {
      if (
        index ===
        self.findIndex(
          (t) =>
            t.id === value.id
        )
      ) {
        return value;
      }
      dataError.push(value);
    });
    return { dataFilter, dataError };
  }

  async createBatch(data: CreateSuggestedCollectionDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    await Promise.all(data.map(async (item: CreateSuggestedCollectionDTO, idx) => {
      let criterionValue = "";
      let itemRespond: SuggestedCollection;
      const lstIndetify = [];
      const { collection_id, criterion_type } = item;

      try {
        const dateItem = getUpdateTimeByIndex(currentTime, idx);
        if (criterion_type === CIRTERION_TYPE.EVENT_INVITEE
          || criterion_type === CIRTERION_TYPE.EMAIL_ADDRESS
          || criterion_type === CIRTERION_TYPE.EMAIL_SENDER) {
          const otherCriterionValue = item.criterion_value as [];
          await Promise.all(otherCriterionValue.map(async (criterionItem, index) => {
            const criterionTime = getUpdateTimeByIndex(currentTime, index);
            const indetifyEntity = this.identicalSenderRepo.create({
              user_id: user.id,
              suggested_collection_id: 0,
              email_address: criterionItem['email'],
              created_date: criterionTime,
              updated_date: criterionTime
            });
            lstIndetify.push(indetifyEntity);
          }));
        } else {
          criterionValue = (item.criterion_value) as string;
        }

        if (collection_id > 0) {
          const isExisted = await this.collectionRepo.findOne({
            select: ['id'],
            where: {
              user_id: user.id,
              id: collection_id,
              is_trashed: 0
            }
          });
          if (!isExisted) {
            const errNotFound = buildFailItemResponse(ErrorCode.COLLECTION_NOT_FOUND,
              MSG_ERR_NOT_EXIST, item);
            return itemFail.push(errNotFound);
          }
          const createEntity = this.suggestedCollectionRepo.create({
            user_id: user.id,
            ...item,
            criterion_value: criterionValue,
            criterion_checksum: CryptoUtil.converToMd5(JSON.stringify(item.criterion_value)),
            account_id: 0,
            third_object_uid: "",
            third_object_type: 0,
            created_date: dateItem,
            updated_date: dateItem
          });
          itemRespond = await this.suggestedCollectionRepo.save(createEntity);
        } else {
          const isExisted = await this.thirdPartyAccountRepo.findOne({
            select: ['id'],
            where: {
              user_id: user.id,
              id: item.account_id
            }
          });
          if (!isExisted) {
            const errNotFound = buildFailItemResponse(ErrorCode.THIRD_PARTY_ACCOUNT,
              MSG_ERR_NOT_EXIST, item);
            return itemFail.push(errNotFound);
          }
          const createEntity = this.suggestedCollectionRepo.create({
            user_id: user.id,
            ...item,
            criterion_value: criterionValue,
            criterion_checksum: CryptoUtil.converToMd5(JSON.stringify(item.criterion_value)),
            created_date: dateItem,
            updated_date: dateItem
          });
          itemRespond = await this.suggestedCollectionRepo.save(createEntity);
        }
        // insert data into identify table
        if (lstIndetify.length > 0) {
          for (const iItem of lstIndetify) {
            iItem.suggested_collection_id = itemRespond.id;
          }
          this.identicalSenderRepo.insert(lstIndetify);
        }
        if (item.ref) itemRespond['ref'] = item.ref;
        delete itemRespond['criterion_checksum'];
        timeLastModify.push(dateItem);
        itemPass.push(itemRespond);
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_CREATE, item);
        itemFail.push(errItem);
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.SUGGESTED_COLLECTION,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }
    return { itemPass, itemFail };
  }

  async updateBatch(data: UpdateSuggestedCollectionDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    await Promise.all(data.map(async (item: UpdateSuggestedCollectionDTO, idx) => {
      try {
        const itemSuggestedCollecion = await this.suggestedCollectionRepo.findOne({
          where: {
            id: item.id,
            user_id: user.id
          }
        });

        if (!itemSuggestedCollecion) {
          const errNotFound = buildFailItemResponse(ErrorCode.SUGGESTED_NOT_FOUND,
            MSG_ERR_NOT_EXIST, item);
          return itemFail.push(errNotFound);
        }
        const dateItem = getUpdateTimeByIndex(currentTime, idx);
        if (item.frequency_used > 0) {
          item.frequency_used =
            itemSuggestedCollecion.frequency_used + item.frequency_used;
        }
        const result = await this.suggestedCollectionRepo.save({
          ...itemSuggestedCollecion, // existing fields
          ...item,// updated fields,
          updated_date: dateItem
        });
        timeLastModify.push(dateItem);
        itemPass.push({
          "id": result.id,
          "frequency_used": result.frequency_used,
          "action_time": result.action_time,
        });

      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_UPDATE, item);
        itemFail.push(errItem);
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.SUGGESTED_COLLECTION,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }
    return { itemPass, itemFail };
  }

  async deleteInstanceBatch(data: DeleteSeggestedCollectionDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const filterData = this.filterDuplicateDelItem(data);
    if (filterData && filterData.dataError.length > 0) {
      filterData.dataError.map(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    if (filterData && filterData.dataFilter.length > 0) {
      const lastData = filterData.dataFilter;
      const currentTime = getUtcMillisecond();
      const timeLastModify = [];
      await Promise.all(lastData.map(async (item, idx) => {
        try {
          const itemDB = await this.suggestedCollectionRepo.findOne({
            where: {
              id: item.id,
              user_id: user.id
            }
          });
          if (!itemDB) {
            const errNotFound = buildFailItemResponse(ErrorCode.VALIDATION_FAILED,
              MSG_ERR_NOT_EXIST, item);
            itemFail.push(errNotFound);
          } else {
            const dateItem = getUpdateTimeByIndex(currentTime, idx);
            const isInsertDeletedItem = await this.deletedItem.create(user.id, {
              item_id: item.id,
              item_type: DELETED_ITEM_TYPE.SUGGESTED_COLLECTION,
              is_recovery: 0,
              created_date: dateItem,
              updated_date: dateItem
            });
            if (!isInsertDeletedItem) { // push item into itemFail if false
              const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
                MSG_ERR_WHEN_DELETE, item);
              itemFail.push(errItem);
            } else { // remove item in cloud table
              await this.suggestedCollectionRepo.delete({ id: itemDB.id, user_id: user.id });
              timeLastModify.push(dateItem);
              itemPass.push({ id: itemDB.id });
            }
          }
        } catch (error) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
          itemFail.push(errItem);
        }
      }));

      if (timeLastModify.length > 0) {
        const updatedDate = Math.max(...timeLastModify);
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.SUGGESTED_COLLECTION,
          userId: user.id,
          email: user.email,
          updatedDate
        }, headers);
      }
    }

    return { itemPass, itemFail };
  }

  async deleteByColIdsAndUserId(colIds: number[], { user, headers }: IReq) {
    if (colIds.length === 0) return;
    const colInstances = await this.suggestedCollectionRepo.find({
      where: {
        collection_id: In(colIds),
        user_id: user.id
      }
    });
    if (colInstances.length === 0) return;
    const data = colInstances.map(item => {
      const dto = new DeleteSeggestedCollectionDTO();
      dto.id = item.id;
      return dto;
    });
    return this.deleteInstanceBatch(data, { user, headers });
  }
}