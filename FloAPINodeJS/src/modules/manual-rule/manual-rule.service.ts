import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  ApiLastModifiedName,
  DELETED_ITEM_TYPE,
  OBJ_TYPE,
  TRASH_TYPE
} from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  ACTION_FLO_RULE
} from '../../common/constants/manual_rule.constant';
import {
  MSG_ERR_LINK,
  MSG_ERR_NOT_EXIST, MSG_ERR_WHEN_DELETE,
  MSG_ERR_WHEN_UPDATE
} from '../../common/constants/message.constant';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { RuleEntity } from '../../common/entities/manual-rule.entity';
import { Users } from '../../common/entities/users.entity';
import { IReq } from '../../common/interfaces';
import { RuleRepository } from '../../common/repositories/rule.repository';
import { IDWithoutDuplicates } from '../../common/utils/common';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { LinkedCollectionObjectDto } from '../link/collection/dtos/linked-collection-object.dto';
import { LinkedCollectionObjectService } from '../link/collection/linked-collection-object.service';
import { TrashCreateDto } from '../trash/dtos/trash.create.dto';
import { TrashService } from '../trash/trash.service';
import { ExecuteManualRuleDTO } from './dtos/execute-manual-rule.dto';
import { DeleteManualRuleDTO } from './dtos/manual-rule.delete.dto';
import { CreateManualRuleDTO } from './dtos/manual-rule.post.dto';
import { UpdateManualRuleDTO } from './dtos/manual-rule.put.dto';
import { SieveEmailService } from './sieve.email';

@Injectable()
export class ManualRuleService {
  constructor(
    private readonly manualRuleRepo: RuleRepository,
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly linkedCollectionObjectService: LinkedCollectionObjectService,
    private readonly trashService: TrashService,
    private readonly sieveEmailService: SieveEmailService,
    private readonly deletedItem: DeletedItemService) { }

  async getAllFiles(filter: BaseGetDTO, user_id: number) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const collections: RuleEntity[] = await this.databaseUtilitiesService.getAll({
      userId: user_id,
      filter,
      repository: this.manualRuleRepo
    });

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem
        .findAll(user_id, DELETED_ITEM_TYPE.MANUAL_RULE, {
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

  async createManualRule(data: CreateManualRuleDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    await Promise.all(data.map(async (item: CreateManualRuleDTO, idx) => {
      try {
        const isExist = await this.manualRuleRepo.checkExistCollection(item.destinations, user.id);
        if (isExist) {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(dateItem);

          const colEntity = this.manualRuleRepo.create({
            user_id: user.id,
            ...item,
            created_date: dateItem,
            updated_date: dateItem
          });
          const itemRespond = await this.manualRuleRepo.save(colEntity);
          if (item.ref) itemRespond['ref'] = item.ref;
          timeLastModify.push(dateItem);
          itemPass.push(itemRespond);
        } else {
          itemFail.push(buildFailItemResponse(
            ErrorCode.BAD_REQUEST,
            MSG_ERR_LINK.COLLECTION_NOT_EXIST,
            item
          ));
        }
      } catch (error) {
        itemFail.push(buildFailItemResponse(
          ErrorCode.BAD_REQUEST,
          error.message,
          item
        ));
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      await this.sieveEmailService.modifySieveRule({
        userId: user.id,
        username: user.email,
        repository: this.manualRuleRepo
      });
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.MANUAL_RULE,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }
    return {
      itemPass,
      itemFail
    };
  }

  async executeManualRule(data: ExecuteManualRuleDTO[]) {
    let itemPass = [];
    let itemFail = [];
    interface GroupLinkCollection {
      username: string;
      userId: number;
      links: LinkedCollectionObjectDto[];
    }
    interface GroupTrash {
      username: string;
      userId: number;
      trashs: TrashCreateDto[];
    }
    const groups: GroupLinkCollection[] = [];
    const groupTrashs: GroupTrash[] = [];
    const users = await this.userRepo.find({
      where: {
        username: In(data.map(d => d.username))
      }
    });
    for (const d of data) {
      if (d.action === ACTION_FLO_RULE.move_to_trash) {
        const trash = new TrashCreateDto();
        trash.object_uid = d.uid;
        trash.object_type = TRASH_TYPE.EMAIL;
        trash.trash_time = getUtcMillisecond() / 1000;
        const findGroup = groupTrashs.find(g => g.username === d.username);
        if (findGroup) {
          findGroup.trashs.push(trash);
        } else {
          const user = users.find(u => u.username === d.username);
          if (user && user.id) {
            const groupTrash: GroupTrash = {
              username: d.username,
              userId: user.id,
              trashs: [trash]
            };
            groupTrashs.push(groupTrash);
          } else {
            const errNotFound = buildFailItemResponse(ErrorCode.SYSTEM_NOT_FOUND,
              MSG_ERR_NOT_EXIST, d);
            itemFail.push(errNotFound);
          }
        }
      } else {
        const link = new LinkedCollectionObjectDto();
        link.collection_id = d.collection_id;
        link.object_uid = d.uid;
        link.object_type = OBJ_TYPE.EMAIL;
        link.account_id = 0;
        link.email_time = getUtcMillisecond() / 1000;
        const findGroup = groups.find(g => g.username === d.username);
        if (findGroup) {
          findGroup.links.push(link);
        } else {
          const user = users.find(u => u.username === d.username);
          if (user && user.id) {
            const group: GroupLinkCollection = {
              username: d.username,
              userId: user.id,
              links: [link]
            };
            groups.push(group);
          } else {
            const errNotFound = buildFailItemResponse(ErrorCode.SYSTEM_NOT_FOUND,
              MSG_ERR_NOT_EXIST, d);
            itemFail.push(errNotFound);
          }
        }
      }
    }
    for (const group of groups) {
      const res = await this.linkedCollectionObjectService
        .createBatchLinks(group.links, {
          user: {
            id: group.userId,
            userId: group.userId,
            email: group.username,
            deviceUid: '',
            appId: '',
            userAgent: '',
            token: ''
          }, headers: null,

        });
      itemPass = [...itemPass, ...res.created];
      itemFail = [...itemFail, ...res.errors];
    }
    for (const group of groupTrashs) {
      const res = await this.trashService
        .saveBatch(group.trashs, itemFail, {
          user: {
            id: group.userId,
            userId: group.userId,
            email: group.username,
            deviceUid: '',
            appId: '',
            userAgent: '',
            token: ''
          },
          headers: null
        });
      itemPass = [...itemPass, ...res.results];
      itemFail = res.errors;
    }

    return { itemPass, itemFail };
  }

  async updateManualRule(data: UpdateManualRuleDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    await Promise.all(data.map(async (item: UpdateManualRuleDTO, idx) => {
      try {
        const itemManualRule = await this.manualRuleRepo.findOne({
          where: {
            id: item.id, user_id: user.id
          }
        });

        if (!itemManualRule) {
          itemFail.push(buildFailItemResponse(
            ErrorCode.SYSTEM_NOT_FOUND,
            MSG_ERR_NOT_EXIST,
            item
          ));
        } else {

          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          const result = await this.manualRuleRepo.save({
            ...itemManualRule, // existing fields
            ...item,// updated fields,
            updated_date: dateItem
          });

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
      await this.sieveEmailService.modifySieveRule({
        userId: user.id,
        username: user.email,
        repository: this.manualRuleRepo
      });

      await this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.MANUAL_RULE,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }
    return { itemPass, itemFail };
  }

  async deleteManualRule(data: DeleteManualRuleDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    // remove duplicate id
    const removeDuplicateId = IDWithoutDuplicates(data);
    await Promise.all(removeDuplicateId.map(async (item, idx) => {
      try {
        const itemManualRule = await this.manualRuleRepo.findOne({
          where: {
            id: item.id, user_id: user.id
          }
        });
        if (!itemManualRule) {
          const errNotFound = buildFailItemResponse(ErrorCode.SYSTEM_NOT_FOUND,
            MSG_ERR_NOT_EXIST, item);
          itemFail.push(errNotFound);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          const isInsertDeletedItem = await this.deletedItem.create(user.id, {
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.MANUAL_RULE,
            is_recovery: 0,
            created_date: dateItem,
            updated_date: dateItem
          });
          if (!isInsertDeletedItem) { // push item into itemFail if false
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
            itemFail.push(errItem);
          } else { // remove item in cloud table
            await this.manualRuleRepo.delete({ id: itemManualRule.id, user_id: user.id });
            timeLastModify.push(dateItem);
            itemPass.push({ id: itemManualRule.id });
          }
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        itemFail.push(errItem);
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      await this.sieveEmailService.modifySieveRule({
        userId: user.id,
        username: user.email,
        repository: this.manualRuleRepo
      });
      await this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.MANUAL_RULE,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return { itemPass, itemFail };
  }
}
