import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { CreateHistoryDto } from "../../modules/collection-history/dtos/history.create.dto";
import { DeleteHistoryDto } from "../../modules/collection-history/dtos/history.delete.dto";
import { HISTORY_ACTION, HISTORY_NOTI_ACTION } from "../constants";
import {
  ERR_COLLECTION_ACTIVITY
} from "../constants/message.constant";
import {
  FUNC_CREATE_NOTIFICATION,
  PROC_CREATE_HISTORY, PROC_DELETE_HISTORY, PROC_GET_HISTORIES
} from "../constants/mysql.func";
import { CustomRepository } from "../decorators/typeorm-ex.decorator";
import { BaseGetWithSortPagingDTO } from "../dtos/base-get.dto";
import { CollectionHistory } from "../entities/collection-history.entity";
import { IUser } from "../interfaces";
import { getPlaceholderByN } from "../utils/common";
type GetAllParams = {
  filter: BaseGetWithSortPagingDTO,
  user: IUser,
  isDeleted?: boolean
};
@Injectable()
@CustomRepository(CollectionHistory)
export class CollectionHistoryRepository extends Repository<CollectionHistory> {
  async getAllHistory({ filter, user }: GetAllParams) {
    const { collection_id, object_uid, ids,
      modified_gte, modified_lt, min_id, page_size, page_no, sort } = filter;

    const slaveConnection = this.manager
      .connection
      .createQueryRunner("slave");
    try {
      const { callType, spName, spParam } = PROC_GET_HISTORIES;
      const rawHistories = await slaveConnection
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          collection_id
          , !object_uid ? '' : object_uid.getPlain()
          , user.id
          , ids?.length ? ids.join(',') : null
          , modified_gte
          , modified_lt
          , min_id
          , page_size
          , page_no
          , sort
        ]);
      const history: CollectionHistory[] = !rawHistories.length ? [] : rawHistories[0];
      return !history.length ? []
        : this.pickObject(user, history, filter.fields);
    } finally {
      slaveConnection.release();
    }
  }

  pickObject(user: IUser, cmt: CollectionHistory[], fields: string[] = []): CollectionHistory[] {
    const processor = this.replaceHref(user);
    return cmt.map((item: CollectionHistory) => {
      const cleaned: CollectionHistory = processor(item);
      const respond: CollectionHistory = new CollectionHistory();
      if (!fields.length)
        return cleaned;
      fields.forEach(field => {
        respond[field] = cleaned[field];
      });
      return respond;
    });
  }

  private replaceHref(user: IUser) {
    return (his: CollectionHistory): CollectionHistory => {
      if (his?.object_href
        && his.member_calendar_uri
        && his.owner_calendar_uri
        && his.member_email
        && his.owner_username) {
        const isOwner = user.id === his.owner_user_id;
        his.object_href = isOwner
          ? his.object_href
            .replace(new RegExp(his.member_calendar_uri, 'g'), his.owner_calendar_uri)
          : his.object_href
            .replace(new RegExp(his.owner_calendar_uri, 'g'), his.member_calendar_uri);
        his.object_href = his.object_href
          .replace(new RegExp([his.owner_username, his.member_email
          ].filter(Boolean).join('|'), 'g'), user.email);
      }
      his.assignees = this.assigneesProcess(his.assignees as string);
      delete his.member_calendar_uri;
      delete his.owner_calendar_uri;
      delete his.owner_user_id;
      delete his.owner_username;
      delete his.member_email;
      delete his.member_user_id;
      return his;
    };
  }

  private assigneesProcess(assignees: string) {
    if (!assignees.length) {
      return [];
    }
    return assignees
      .split(',').map(email => ({ email }));
  }

  async insertHistory(history: CreateHistoryDto, user: IUser) {
    try {
      const { callType, spName, spParam } = PROC_CREATE_HISTORY;
      const saved = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          +history.collection_id || 0,
          history.object_uid.getPlain() || '',
          '',
          history.object_type || '',
          user.id,
          +history.action || 0,
          +history.action_time || 0,
          !history.assignees?.length ? ''
            : history.assignees.map(({ email }) => email).join(),
          history.content || '',
          history.created_date,
          history.updated_date
        ]);
      const inserted = saved.length && saved[0].length ? saved[0][0] : {};
      if (!inserted || inserted.id < 1) {
        return this.getErrorMessageByCode(inserted.id || 0);
      }
      return this.replaceHref(user)(inserted);
    } catch (error) {
      return { error };
    }
  }

  async createNotification(history: CreateHistoryDto, user: IUser) {
    history.action = history.action || HISTORY_ACTION.CREATED;
    if (Object.values(HISTORY_NOTI_ACTION)
      .includes(history.action)) {
      const { callType, spName, spParam } = FUNC_CREATE_NOTIFICATION;
      await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          user.userId,
          user.email,
          +history.collection_id || 0,
          +history.comment_id || 0,
          history.object_uid.getPlain() || '',
          history.object_type || '',
          +history.action,
          +history.action_time || 0,
          !history.assignees?.length ? ''
            : history.assignees.map(({ email }) => email).join(),
          history.content || '',
          history.updated_date
        ]);
    }
  }

  async deleteHistory(history: DeleteHistoryDto, user: IUser) {
    try {
      const { callType, spName, spParam } = PROC_DELETE_HISTORY;
      const saved = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          history.id,
          user.userId,
          history.updated_date
        ]);

      const deleted = saved.length && saved[0].length ? saved[0][0] : {};
      if (!deleted || deleted.id < 1) {
        return this.getErrorMessageByCode(deleted.id || 0,
          ERR_COLLECTION_ACTIVITY.MSG_ERR_DELETE_HISTORY_FAILED);
      }
      return deleted;
    } catch (error) {
      return { error };
    }
  }
  getErrorMessageByCode(code: string,
    msg0 = ERR_COLLECTION_ACTIVITY.MSG_ERR_CREATE_HISTORY_FAILED)
    : { error: string } {
    return {
      error: {
        '-5': ERR_COLLECTION_ACTIVITY.OBJECT_TRASHED,
        '-4': ERR_COLLECTION_ACTIVITY.COLLECTION_TRASHED_DELETED,
        '-3': msg0,
        '-2': ERR_COLLECTION_ACTIVITY.COLLECTION_NOT_JOIN,
        '-1': ERR_COLLECTION_ACTIVITY.COLLECTION_NOT_EDIT_PER,
        '0': msg0
      }[code]
    };
  }
}