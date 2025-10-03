import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApiLastModifiedName, DELETED_ITEM_TYPE, SOURCE_TYPE_FILE_COMMON
} from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  ERR_COLLECTION_ACTIVITY,
  MSG_ERR_DUPLICATE_ENTRY
} from '../../common/constants/message.constant';
import { BaseGetDTO, GetByCollectionIdDTO } from '../../common/dtos/base-get.dto';
import { CollectionComment } from '../../common/entities/collection-comment.entity';
import { IReq } from '../../common/interfaces';
import {
  CollectionCommentRepository,
  CommentMentionRepository, MentionUser
} from '../../common/repositories';
import {
  LastModify,
  filterDuplicateItemsWithKey, generateLastModifyItem
} from '../../common/utils/common';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse, modifyObjectUidAndType } from '../../common/utils/respond';
import { ApiLastModifiedQueueService, FileAttachmentQueueService } from '../bullmq-queue';
import { EventNames } from '../communication/events';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import {
  CommentMentionDto, CreateCommentDto,
  DeleteCommentDto, UpdateCommentDto
} from './dtos';
@Injectable()
export class CommentService {
  constructor(
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly attachmentQueueService: FileAttachmentQueueService,
    private readonly commentRepo: CollectionCommentRepository,
    private readonly mentionRepo: CommentMentionRepository,
    private readonly deletedItem: DeletedItemService,
    private readonly eventEmitter: EventEmitter2
  ) { }

  async getComments(filter: BaseGetDTO, { user, headers }: IReq) {
    try {
      const comment: CollectionComment[] = await this.commentRepo.getAllComment({
        user,
        filter
      });
      let deletedItems;
      if (filter.has_del && filter.has_del === 1) {
        deletedItems = await this.deletedItem.findAll(user.id,
          [DELETED_ITEM_TYPE.COLLECTION_COMMENT, DELETED_ITEM_TYPE.COMMENT_ATTACHMENT],
          {
            ids: filter.ids,
            modified_gte: filter.modified_gte,
            modified_lt: filter.modified_lt,
            page_size: filter.page_size
          }
        );
      }
      return {
        data: comment,
        data_del: deletedItems
      };
    } catch (error) {
      const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message);
      return { data: [], error: errItem };
    }
  }

  async getAllMentionsUser(filter: GetByCollectionIdDTO, { user, headers }: IReq) {
    try {
      const mentionUsers: MentionUser[] = await this.mentionRepo.getAllMentionUsers({
        user,
        filter
      });
      if (mentionUsers.length && +mentionUsers[0]['result'] < 0) {
        throw Error(ERR_COLLECTION_ACTIVITY.COLLECTION_NOT_JOIN);
      }
      return {
        data: mentionUsers
      };
    } catch (error) {
      const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message);
      return { data: [], error: errItem };
    }
  }

  async createBatchComment(data: CreateCommentDto[], { user, headers }: IReq) {
    const itemFail = [];
    const itemPass = [];
    try {
      const currentTime: number = getUtcMillisecond();
      let itemLastModify: LastModify[] = [];
      let idx: number = 0;
      for (const comment of data) {
        const dateItem: number = getUpdateTimeByIndex(currentTime, idx++);
        // 1. create comment
        const respond = await this.commentRepo
          .insertComment({
            ...comment,
            updated_date: dateItem,
            created_date: dateItem
          }, user);
        // 2. add mention
        if (comment.mentions?.length && +respond['id']) {
          await this.addMention(comment.mentions, +respond['id'], user.id);
          // emit event add mention comment
          this.eventEmitter.emit(EventNames.MENTION_COMMENT_COLLECTION,
            {
              comment: { ...comment, object_uid: comment.object_uid.getPlain() },
              comment_id: respond['id'],
              new_mentions: comment.mentions.map((m) => { return m.email; }),
              email: user.email,
              object_href: respond['object_href'],
              collection_activity_id: respond['collection_activity_id']
            });
        }
        if (respond['error']) {
          itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
            respond['error'], {
            ...comment,
            object_uid: comment.object_uid.getPlain(),
            object_type: comment.object_type.toString()
          }));
          continue;
        }

        // emit event add comment
        this.eventEmitter.emit(EventNames.ADD_COMMENT_COLLECTION, {
          comment: { ...respond, mentions: comment.mentions },
          email: user.email
        });

        itemLastModify = generateLastModifyItem(itemLastModify,
          respond['collection_id'], dateItem);

        itemPass.push(modifyObjectUidAndType({
          ...respond,
          mentions: comment.mentions || [],
          ref: comment.ref
        }));
      }
      //

      this.apiLastModifiedQueueService
        .sendLastModifiedByCollectionId(itemLastModify,
          ApiLastModifiedName.COLLECTION_COMMENT, headers);
      return { itemPass: itemPass.filter(Boolean), itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST
        , error.message);
      itemFail.push(errItem);
      return { itemPass, itemFail };
    }
  }

  async addMention(mentions, commentId, userId) {
    // 2. add mention as needed
    await Promise.all(mentions.map((mention: CommentMentionDto, idx) =>
      this.mentionRepo
        .addMention(mention, commentId, userId, idx === mentions.length - 1 ? 1 : 0)
    ));
  }

  async updateBatchComment(data: UpdateCommentDto[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    try {
      const currentTime: number = getUtcMillisecond();
      let itemLastModify: LastModify[] = [];
      const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['id']);
      if (dataError.length > 0) {
        dataError.map(item => {
          const errItem = buildFailItemResponse(
            ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }
      if (dataPassed.length === 0) {
        return { itemPass, itemFail };
      }
      let idx: number = 0;
      for (const comment of dataPassed) {
        const dateItem: number = getUpdateTimeByIndex(currentTime, idx++);
        // 1. update mentions
        const respond = await this.commentRepo
          .updateComment({
            ...comment,
            updated_date: dateItem
          }, user);

        // 2. add mention
        if (+respond['id']) {
          // emit event update comment
          this.eventEmitter.emit(EventNames.UPDATE_COMMENT_COLLECTION,
            {
              comment: { ...respond, mentions: comment.mentions },
              email: user.email
            });
          const oldMentionsEmail = await this.mentionRepo.getMentionUserByComment(comment.id);
          const currentMentionsEmail = comment.mentions?.map((m: CommentMentionDto) => {
            return m.email;
          }) || [];

          const newMentionsEmail = currentMentionsEmail.filter(
            (email: string) => !oldMentionsEmail.includes(email));
          // 1. remove all mention
          await this.mentionRepo.removeAllMention(+respond['id'], user.id);
          // add new mention as needed
          if (comment.mentions?.length) {
            await this.addMention(comment.mentions, +respond['id'], user.id);
            if (newMentionsEmail?.length > 0) {
              // emit event update mention comment
              this.eventEmitter.emit(EventNames.MENTION_COMMENT_COLLECTION,
                {
                  comment: { ...respond, ...comment },
                  comment_id: respond['id'],
                  new_mentions: newMentionsEmail,
                  email: user.email,
                  object_href: respond['object_href'],
                  collection_activity_id: respond['collection_activity_id']
                });
            }
          }
        }

        if (respond['error']) {
          itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
            respond['error'], comment));
          continue;
        }
        itemLastModify = generateLastModifyItem(itemLastModify,
          respond['collection_id'], dateItem);
        itemPass.push(modifyObjectUidAndType({
          ...respond,
          mentions: comment.mentions || []
        }));
      }
      //
      this.apiLastModifiedQueueService
        .sendLastModifiedByCollectionId(itemLastModify,
          ApiLastModifiedName.COLLECTION_COMMENT, headers);
      return { itemPass: itemPass.filter(Boolean), itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(
        ErrorCode.BAD_REQUEST, error.message);
      itemFail.push(errItem);
      return { itemPass, itemFail };
    }
  }

  async deleteBatchComment(data: DeleteCommentDto[], { user, headers }: IReq) {
    let itemPass = [];
    const itemFail = [];
    try {
      const currentTime: number = getUtcMillisecond();
      let itemLastModify: LastModify[] = [];
      const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['id']);
      if (dataError.length > 0) {
        dataError.map(item => {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }
      if (dataPassed.length === 0) {
        return { itemPass, itemFail };
      }
      itemPass = await Promise.all(
        dataPassed.map(async (comment: DeleteCommentDto, idx: number) => {
          const dateItem: number = getUpdateTimeByIndex(currentTime, idx);
          const respond = await this.
            commentRepo.deleteComment({
              ...comment,
              updated_date: dateItem
            }, user);

          if (respond['error']) {
            itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
              respond['error'], comment));
            return false;
          }
          // send last modified
          itemLastModify = generateLastModifyItem(itemLastModify,
            respond['collection_id'], dateItem);
          // delete files
          await this.deleteFileComment(user.id, comment.id, respond['collection_id']);

          // emit event delete comment
          this.eventEmitter.emit(EventNames.DELETE_COMMENT_COLLECTION,
            {
              comment: respond,
              email: user.email
            });
          delete respond['collection_id'];
          return { id: respond['id'] };
        }));

      this.apiLastModifiedQueueService
        .sendLastModifiedByCollectionId(itemLastModify,
          ApiLastModifiedName.COLLECTION_COMMENT, headers);

      return { itemPass: itemPass.filter(Boolean), itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(
        ErrorCode.BAD_REQUEST, error.message);
      itemFail.push(errItem);
      return { itemPass, itemFail };
    }
  }

  async deleteFileComment(userId: number, commentId: number, collection_id: number) {
    return this.attachmentQueueService.addJobFileCommon({
      userId,
      data: {
        source_id: commentId,
        collection_id,
        source_type: SOURCE_TYPE_FILE_COMMON.COMMENT
      }
    });
  }
}