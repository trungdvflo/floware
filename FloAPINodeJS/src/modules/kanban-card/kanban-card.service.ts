import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { classToPlain } from 'class-transformer';
import { In } from 'typeorm';
import {
  ApiLastModifiedName,
  DELETED_ITEM_TYPE,
  OBJ_TYPE
} from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import {
  SortObjectResponseMessage
} from '../../common/constants/message.constant';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { EmailObjectId, GENERAL_OBJ, GeneralObjectId, GmailObjectId } from '../../common/dtos/object-uid';
import { KanbanCard } from '../../common/entities/kanban-card.entity';
import { IReq } from '../../common/interfaces';
import { KanbanCardOptionsInterface } from '../../common/interfaces/kanban-card.interface';
import { KanbanCardRepository } from '../../common/repositories/kanban-card.repository';
import {
  filterKanbanIdExisted,
  generateMinusOrderNum, getMaxUpdatedDate, getMinTableKanbanCard, removeDuplicateItemsWithKanbanIds
} from '../../common/utils/common';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { DeleteItemParam } from '../deleted-item/dto/deletedItemParam';
import { KanbanService } from '../kanban/kanban.service';
import { LinkedCollectionObjectService } from '../link/collection/linked-collection-object.service';
import { SortObjectService } from '../sort-object/sort-object.service';
import { ThirdPartyAccountService } from '../third-party-account/third-party-account.service';
import { TrashService } from '../trash/trash.service';
import { KanbanCardResponse } from './dto/get-kanban-card.response';
import { DeleteKanbanCardParam, KanbanCardParam } from './dto/kanban-card-param';
import {
  DeleteKanbanCardParamError
} from './dto/kanban-card-request-param-error';
import { KanbanCardErrorCode, KanbanCardErrorDics, KanbanCardResponseMessage } from './kanban-card-response-message';

@Injectable()
export class KanbanCardService {
  constructor(
    // we create a repository for the Collection entity
    // and then we inject it as a dependency in the service

    @InjectRepository(KanbanCardRepository)
    private readonly kanbanCard: KanbanCardRepository,

    // @InjectRepository(KanbanCard) private readonly kanbanCard: KanbanCardRepository,

    private readonly deletedItem: DeletedItemService,
    private readonly kanban: KanbanService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly thirdPartyAccount: ThirdPartyAccountService,
    private readonly linkedCollectionObjectService: LinkedCollectionObjectService,
    private readonly sortObjectService: SortObjectService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly trashService: TrashService,
  ) { }
  // this method retrieves all entries
  async findAll(userId: number, filter?: GetAllFilter<KanbanCard>) {
    const { modified_gte, modified_lt, ids, has_del, page_size } = filter;
    const kanbanCards: KanbanCard[] = await this.databaseUtilitiesService.getAll({
      userId,
      filter: {
        ...filter,
        fields:
          !filter.fields || filter.fields.includes('object_type')
            ? filter.fields
            : [...filter.fields, 'object_type'],
      },
      repository: this.kanbanCard,
    });

    const kanbanCardsResp: KanbanCardResponse[] = kanbanCards.map((kb) => {
      return { ...classToPlain(kb), object_uid: kb.object_uid };
    });

    let deletedItems;
    if (has_del) {
      deletedItems = await this.deletedItem.findAll(userId, DELETED_ITEM_TYPE.CANVAS, {
        modified_gte,
        modified_lt,
        ids,
        page_size,
      });
    }

    return {
      deletedItems,
      kanbanCards: kanbanCardsResp,
    };
  }

  public convertObjectUid(objectUid: EmailObjectId | GeneralObjectId | GmailObjectId
    , typeItem: OBJ_TYPE.GMAIL | OBJ_TYPE.EMAIL | GENERAL_OBJ) {
    switch (typeItem) {
      case OBJ_TYPE.GMAIL:
        const { id } = objectUid as GmailObjectId;
        return id;
      case OBJ_TYPE.EMAIL:
        const { uid, path } = objectUid as EmailObjectId;
        return { uid, path };
      default:
        const { uid: newUid } = objectUid as GeneralObjectId;
        return newUid;
    }
  }

  async createKanbanCard(data: KanbanCardParam[],
    { user, headers }: IReq) {
    let itemFail = [];
    const itemPass = [];
    const isRunning = await this.sortObjectService.isResetOrderRunning(
      user.id,
      OBJ_TYPE.CANVAS.toString()
    );
    if (isRunning) {
      return {
        itemFail: data.map((i) => {
          return buildFailItemResponse(ErrorCode.BAD_REQUEST,
            SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS, i);
        }),
      };
    }
    const kanbanItems = await this.kanban.findAndSelectByIds(user.id, data);

    if (kanbanItems.length === 0) {
      data.forEach(item => {
        const errItem = buildFailItemResponse(
          KanbanCardErrorCode.KANBAN_CARD_NOT_FOUND,
          KanbanCardResponseMessage.KANBAN_CARD_NOT_FOUND, item);
        itemFail.push(errItem);
      });
    } else {
      // filter id existed
      const { itemExisted, itemNoExisted } = filterKanbanIdExisted(kanbanItems, data);

      if (itemNoExisted.length > 0) itemFail = [...itemFail, ...itemNoExisted];
      if (itemExisted.length > 0) {
        // get smallest value of kanban card
        const { othersKanbanCard, kanbanCards } = removeDuplicateItemsWithKanbanIds(itemExisted);

        const [othersRespond, dataRespond] = await Promise.all([
          (othersKanbanCard.length > 0)
            ? (this.generateOrderNumber(othersKanbanCard, user.id)) : [],
          (kanbanCards.length > 0) ?
            (this.generateOrderNumberKanbanCards(kanbanCards,
              user.id, kanbanCards[0].kanban_id)) : []
        ]);

        const dataWithOrderNumber = [...othersRespond, ...dataRespond];
        if (dataWithOrderNumber.length > 0) {
          const currentTime = getUtcMillisecond();
          const timeLastModify = [];

          await Promise.all(dataWithOrderNumber.map(async (itemKanbanCard, idx) => {
            const dateItem = getUpdateTimeByIndex(currentTime, idx);
            const colLink = await this.linkedCollectionObjectService
              .findOneByObjectUidAndCollectionId(
                itemKanbanCard.object_uid.objectUid,
                itemKanbanCard.collection_id,
                { fields: ['id'] },
              );

            if (!colLink) {
              itemKanbanCard.object_uid = this
                .convertObjectUid(itemKanbanCard.object_uid, itemKanbanCard.object_type);
              const errItem = buildFailItemResponse(
                KanbanCardErrorCode.OBJECT_NOT_LINKED_TO_COLLECTION,
                KanbanCardResponseMessage.OBJECT_NOT_LINKED_TO_COLLECTION,
                itemKanbanCard);
              return itemFail.push(errItem);
            }
            if (itemKanbanCard.account_id > 0) {
              const thirdPartyAccount = await this.thirdPartyAccount.findOneById(
                user.id,
                itemKanbanCard.account_id,
                { fields: ['id'] },
              );
              if (!thirdPartyAccount) {
                itemKanbanCard.object_uid = this
                  .convertObjectUid(itemKanbanCard.object_uid, itemKanbanCard.object_type);
                const errItem = buildFailItemResponse(
                  KanbanCardErrorCode.THIRD_PARTY_ACCOUNT_NOT_FOUND,
                  KanbanCardResponseMessage.THIRD_PARTY_ACCOUNT_NOT_FOUND,
                  itemKanbanCard);
                return itemFail.push(errItem);
              }
            }

            const kanbanCardEntity: any = this.kanbanCard.create({
              user_id: user.id,
              ...itemKanbanCard,
              ...{
                created_date: dateItem,
                updated_date: dateItem,
                order_update_time: dateItem,
                recent_date: itemKanbanCard.recent_date ? itemKanbanCard.recent_date : dateItem
              },
              is_trashed: await this.trashService.getIsTrash(
                itemKanbanCard.is_trashed,
                itemKanbanCard.object_uid.objectUid,
                itemKanbanCard.object_type,
                itemKanbanCard.object_href)
            });
            kanbanCardEntity.mapped_object_uid = itemKanbanCard.object_uid;
            try {
              const respond = await this.kanbanCard.save(kanbanCardEntity);
              timeLastModify.push(dateItem);
              // parse to object that convert object_uid_buf to object_uid
              const newRespond = classToPlain(respond);
              itemPass.push({
                ...newRespond,
                ref: itemKanbanCard.ref
              });
            } catch (err) {
              if (err.message.indexOf('ER_DUP_ENTRY') !== -1) {
                const errItem = buildFailItemResponse(
                  KanbanCardErrorCode.DUPLICATED_ENTRY,
                  KanbanCardResponseMessage.DUPLICATED_ENTRY,
                  {
                    kanban_id: itemKanbanCard.kanban_id,
                    account_id: itemKanbanCard.account_id,
                    object_type: itemKanbanCard.object_type,
                    ref: itemKanbanCard.ref,
                  });
                itemFail.push(errItem);
              }
            }
          }));
          if (timeLastModify.length > 0) {
            const updatedDate = Math.max(...timeLastModify);
            await this.apiLastModifiedQueueService.addJob({
              apiName: ApiLastModifiedName.KANBAN_CARD,
              userId: user.id,
              email: user.email,
              updatedDate
            }, headers);
          }
        }
      }
    }
    return { itemPass, itemFail };
  }

  async generateOrderNumberKanbanCards(data: KanbanCardParam[], userId: number, kanban_id: number) {
    const handleOrderNumber = [];
    const minNumber = await getMinTableKanbanCard(this.kanbanCard,
      'order_number', userId, kanban_id);
    await Promise.all(data.map(async (itemKanbanCard, index) => {
      itemKanbanCard['order_number'] = Number(generateMinusOrderNum(minNumber, index));
      handleOrderNumber.push(itemKanbanCard);
    }));
    return handleOrderNumber;
  }

  async generateOrderNumber(data: KanbanCardParam[], userId: number) {
    const handleOrderNumber = [];
    await Promise.all(data.map(async (itemKanbanCard, index) => {
      const minNumber =
        await getMinTableKanbanCard(this.kanbanCard,
          'order_number', userId, itemKanbanCard.kanban_id);
      itemKanbanCard['order_number'] = Number(generateMinusOrderNum(minNumber, 0));
      handleOrderNumber.push(itemKanbanCard);
    }));
    return handleOrderNumber;
  }

  async deleteById(userId: number, id: number) {
    await this.kanbanCard.delete({
      user_id: userId,
      id,
    });
  }

  async batchDeleteByIds(user, headers, ids: number[]) {
    const optionItem: KanbanCardOptionsInterface = {
      fields: ['id'],
      conditions: {
        user_id: user.id,
        id: In(Array.from(new Set(ids))),
      }
    };

    const items = await this.kanbanCard.findAllOnMaster(optionItem);
    if (!items || items.length === 0) return { items, delItems: [] };
    const _now = Date.now();
    const updatedDates = [];
    const deletedItems: DeleteItemParam[] = items.map((item, index) => {
      const updatedDate = (_now + index) / 1000;
      updatedDates.push(updatedDate);
      return {
        item_id: item.id,
        item_type: DELETED_ITEM_TYPE.CANVAS,
        updated_date: updatedDate,
        created_date: updatedDate
      };
    });
    await this.kanbanCard.delete(items.map((item) => item.id));
    const delItems = await this.deletedItem.batchCreateWithDate(user.id, deletedItems);

    if (deletedItems.length > 0) {
      const updatedDate = getMaxUpdatedDate(deletedItems);
      await this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.KANBAN_CARD,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return { items, delItems };
  }

  async batchDeleteKanbanCards(deleteKanbanCardParams: DeleteKanbanCardParam[],
    { user, headers }: IReq) {
    const { items } = await this.batchDeleteByIds(
      user,
      headers,
      deleteKanbanCardParams.map((item) => item.id),
    );
    const deletedIds = items.map((item) => item.id);
    const errors = deleteKanbanCardParams.map((param) => {
      if (!deletedIds.includes(param.id)) {
        return new DeleteKanbanCardParamError({
          ...KanbanCardErrorDics.KANBAN_CARD_NOT_FOUND,
          attributes: {
            id: param.id,
          },
        });
      }
    }).filter(Boolean);

    return {
      deleted: items,
      errors,
    };
  }
}
