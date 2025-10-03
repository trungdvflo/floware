import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { CreateCommentDto } from "../../modules/collection-comment/dtos/comment.create.dto";
import { DeleteCommentDto } from "../../modules/collection-comment/dtos/comment.delete.dto";
import { UpdateCommentDto } from "../../modules/collection-comment/dtos/comment.update.dto";
import {
  ERR_COLLECTION_ACTIVITY
} from "../constants/message.constant";
import {
  PROC_CREATE_COMMENT, PROC_DELETE_COMMENT, PROC_GET_COMMENTS
} from "../constants/mysql.func";
import { CustomRepository } from "../decorators/typeorm-ex.decorator";
import { BaseGetWithSortPagingDTO } from "../dtos/base-get.dto";
import { GENERAL_OBJ, GeneralObjectId } from "../dtos/object-uid";
import { CollectionComment } from "../entities/collection-comment.entity";
import { IUser } from "../interfaces";
import { getPlaceholderByN } from "../utils/common";
export type GetAllParams = {
  filter: BaseGetWithSortPagingDTO,
  user: IUser,
  isDeleted?: boolean
};

@Injectable()
@CustomRepository(CollectionComment)
export class CollectionCommentRepository extends Repository<CollectionComment> {
  async getAllComment({ filter, user }: GetAllParams) {
    const { collection_id, object_uid, ids, modified_gte, modified_lt,
      filter_type, min_id, page_size, page_no, sort, before_time, after_time } = filter;

    const slaveConnection = this.manager
      .connection
      .createQueryRunner("slave");
    try {
      const { callType, spName, spParam } = PROC_GET_COMMENTS;
      const rawComments = await slaveConnection
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          collection_id
          , !object_uid ? '' : object_uid.getPlain()
          , user.id
          , user.email
          , ids?.length ? ids.join(',') : null
          , filter_type
          , modified_gte
          , modified_lt
          , min_id
          , page_size
          , page_no
          , sort
          , before_time
          , after_time
        ]);
      const comments: CollectionComment[] = !rawComments.length
        ? [] : rawComments[0];
      return !comments.length ? []
        : this.pickObject(user, comments, filter.fields);
    } finally {
      slaveConnection.release();
    }
  }

  pickObject(user: IUser, cmt: CollectionComment[], fields: string[] = []): CollectionComment[] {
    return cmt.map((item: CollectionComment) => {
      const cleaned: CollectionComment = this.commentTransform(user)(item);

      if (!fields.length || fields.includes('object_uid')) {
        cleaned.object_uid = new GeneralObjectId({
          uidBuffer: cleaned.object_uid as Buffer
        }, cleaned.object_type as GENERAL_OBJ).getPlain();
      }
      if (!fields.length || fields.includes('object_type')) {
        cleaned.object_type = cleaned.object_type.toString();
      }

      const respond: CollectionComment = new CollectionComment();
      if (!fields.length)
        return cleaned;
      fields.forEach(field => {
        respond[field] = cleaned[field];
      });
      return respond;
    });
  }

  private commentAttachmentCalc(attachments) {
    return JSON.parse(attachments)
      .map(att => ({
        ...att,
        url: `${process.env.BASE_URL}${att.url}`
      }));
  }

  private commentTransform(user: IUser) {
    return (cmt: CollectionComment): CollectionComment => {
      if (cmt?.object_href
        && cmt.member_calendar_uri
        && cmt.owner_calendar_uri
        && cmt.member_email
        && cmt.owner_username) {
        const isOwner = user.id === cmt.owner_user_id;
        //
        cmt.object_href = isOwner
          ? cmt.object_href
            .replace(new RegExp(cmt.member_calendar_uri, 'g'), cmt.owner_calendar_uri)
          : cmt.object_href
            .replace(new RegExp(cmt.owner_calendar_uri, 'g'), cmt.member_calendar_uri);
        cmt.object_href = cmt.object_href
          .replace(new RegExp([cmt.owner_username, cmt.member_email
          ].filter(Boolean).join('|'), 'g'), user.email);
      }
      // parse JSON from db
      cmt.attachments = typeof cmt.attachments === 'string'
        ? this.commentAttachmentCalc(cmt.attachments as string)
        : cmt.attachments;
      // parse JSON from db
      cmt.mentions = typeof cmt.mentions === 'string'
        ? JSON.parse(cmt.mentions as string)
        : cmt.mentions;

      delete cmt.member_calendar_uri;
      delete cmt.owner_calendar_uri;
      delete cmt.owner_user_id;
      delete cmt.owner_username;
      delete cmt.member_email;
      delete cmt.member_user_id;
      return cmt;
    };
  }
  async updateComment(comment: UpdateCommentDto, user: IUser) {
    try {
      const { callType, spName, spParam } = PROC_CREATE_COMMENT;
      const saved = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          comment.id,
          0,
          '',
          '',
          '',
          user.id,
          comment.action_time || 0,
          comment.comment || '',
          0,
          0,
          comment.updated_date,
          user.email,
          comment.mentions?.length > 0
        ]);
      const updated = saved.length && saved[0].length ? saved[0][0] : {};
      if (!updated || updated.id < 1) {
        return this.getErrorMessageByCode(updated.id || 0,
          ERR_COLLECTION_ACTIVITY.MSG_ERR_UPDATE_COMMENT_FAILED);
      }
      return this.commentTransform(user)(updated);
    } catch (error) {
      return { error };
    }
  }

  async insertComment(comment: CreateCommentDto, user: IUser) {
    try {
      const { callType, spName, spParam } = PROC_CREATE_COMMENT;
      const saved = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          0, // id
          +comment.collection_id || 0,
          comment.object_uid.getPlain() || '',
          '',
          comment.object_type || '',
          user.id,
          +comment.action_time || 0,
          comment.comment || '',
          +comment.parent_id || 0,
          comment.created_date,
          comment.updated_date,
          user.email,
          comment.mentions?.length > 0
        ]);
      const inserted = saved.length && saved[0].length ? saved[0][0] : {};
      if (!inserted || inserted.id < 1) {
        return this.getErrorMessageByCode(inserted.id || 0);
      }
      return this.commentTransform(user)(inserted);
    } catch (error) {

      return { error };
    }
  }

  async deleteComment(comment: DeleteCommentDto, user: IUser) {
    try {
      const { callType, spName, spParam } = PROC_DELETE_COMMENT;
      const saved = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          comment.id,
          user.userId,
          comment.updated_date
        ]);
      const deleted = saved.length && saved[0].length ? saved[0][0] : {};
      if (!deleted || deleted.id < 1) {
        return this.getErrorMessageByCode(deleted.id || 0,
          ERR_COLLECTION_ACTIVITY.MSG_ERR_DELETE_COMMENT_FAILED);
      }
      return this.commentTransform(user)(deleted);
    } catch (error) {
      return { error };
    }
  }
  getErrorMessageByCode(code: string,
    msg0 = ERR_COLLECTION_ACTIVITY.MSG_ERR_CREATE_COMMENT_FAILED) {
    return {
      error: {
        '-6': ERR_COLLECTION_ACTIVITY.MENTION_MEMBER_NOT_FOUND,
        '-5': ERR_COLLECTION_ACTIVITY.OBJECT_TRASHED,
        '-4': ERR_COLLECTION_ACTIVITY.COLLECTION_TRASHED_DELETED,
        '-3': ERR_COLLECTION_ACTIVITY.NOT_ALLOW_CHANGE_COMMENT,
        '-2': ERR_COLLECTION_ACTIVITY.COLLECTION_NOT_JOIN,
        '-1': ERR_COLLECTION_ACTIVITY.COLLECTION_NOT_EDIT_PER,
        '0': msg0,
      }[code]
    };
  }
}
