import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TrashEntity } from '../../common/entities/trash.entity';
import { DeleteNotificationDto, GetAllFilterCollectionNotification } from '../../modules/collection_notification/dtos';
import {
  UpdateNotificationDto
} from '../../modules/collection_notification/dtos/notification.update.dto';
import {
  FindBaseObjectOptions
} from '../../modules/database/database-utilities.service';
import {
  FUNC_CREATE_NOTIFICATION_AFTER_DEL,
  FUNC_UPDATE_NOTIFICATION_STATUS,
  HISTORY_ACTION,
  OBJECT_SHARE_ABLE, PROC_GET_NOTIFICATIONS, SHARE_STATUS, SP_DELETE_NOTIFICATION, TRASH_TYPE
} from '../constants';
import { ERR_COLLECTION_ACTIVITY } from '../constants/message.constant';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { BaseGetNotificationDTO } from '../dtos/base-get.dto';
import { GENERAL_OBJ, GeneralObjectId } from '../dtos/object-uid';
import { CollectionNotificationEntity } from '../entities/collection-notification.entity';
import { IUser } from '../interfaces';
import { getPlaceholderByN } from '../utils/common';
import { getUtcSecond } from '../utils/date.util';
import { sortFiledFilter } from '../utils/typeorm.util';
type GetAllParams = {
  filter: BaseGetNotificationDTO,
  user: IUser,
  isDeleted?: boolean
};
interface GetAllCustomize4WebOptions<T> extends FindBaseObjectOptions<T> {
  filter: GetAllFilterCollectionNotification<T>;
}
@Injectable()
@CustomRepository(CollectionNotificationEntity)
export class CollectionNotificationRepository
  extends Repository<CollectionNotificationEntity> {

  /**
   * @deprecated
   * @param options
   * @param userEmail
   * @returns
   */
  async getAll(options: GetAllCustomize4WebOptions<any>, userEmail: string) {
    const { modified_gte
      , modified_lt
      , min_id
      , page_size
      , ids
      , collection_id
      , sort
      , fields
      , page_no
      , is_web
    } = options.filter;
    const { userId } = options;
    const aliasName = 'Noti';
    const allFields = [`${aliasName}.id id`,
    `${aliasName}.email email`,
    `${aliasName}.collection_id collection_id`,
    `${aliasName}.object_uid object_uid`,
    `${aliasName}.object_type object_type`,
    `${aliasName}.action action`,
    `${aliasName}.content content`,
    `${aliasName}.action_time action_time`,
    `${aliasName}.created_date created_date`,
    `${aliasName}.updated_date updated_date`];
    let selectFields = [];
    if (fields && fields.length > 0) {
      fields.forEach(f => {
        const field = f.toString();
        const index = allFields.indexOf(`${aliasName}.${field} ${field}`);
        if (index >= 0) {
          selectFields.push(allFields[index]);
        }
      });
    } else {
      selectFields = allFields;
    }
    selectFields.push('co.calendar_uri calendar_uri');
    // for member
    selectFields.push('csm.member_user_id member_user_id');
    selectFields.push('csm.calendar_uri member_calendar_uri');
    let query = this
      .createQueryBuilder(aliasName)
      .select(selectFields)
      .innerJoin("collection", 'co', `(co.id = ${aliasName}.collection_id)`)
      .leftJoin("collection_shared_member", 'csm', `(csm.collection_id = ${aliasName}.collection_id
        AND csm.shared_status = :sharedStatus)`, { sharedStatus: SHARE_STATUS.JOINED })
      .leftJoin('collection_comment', 'cm', `${aliasName}.comment_id = cm.id`)
      .where(`(co.user_id = :userId
        OR csm.member_user_id = :userId)`, { userId });  // for member

    if (modified_lt || modified_lt === 0) {
      query = query.andWhere(`${aliasName}.updated_date < :modified_lt`, { modified_lt });
      query = query.addOrderBy(`${aliasName}.updated_date`, "DESC");
    }
    if (modified_gte || modified_gte === 0) {
      query = query.andWhere(`${aliasName}.updated_date >= :modified_gte`, { modified_gte });
      query = query.addOrderBy(`${aliasName}.updated_date`, "ASC");
    }
    if (min_id || min_id === 0) {
      query = query.andWhere(`${aliasName}.id > :min_id`, { min_id });
      query = query.addOrderBy(`${aliasName}.id`, "ASC");
    }
    if (ids) {
      query = query.andWhere(`${aliasName}.id IN (:...ids)`, { ids });
    }
    if (collection_id) {
      query = query.andWhere(`${aliasName}.collection_id = :collection_id`, { collection_id });
      if (sort) {
        const sortFilter = sortFiledFilter(sort);
        query = query.orderBy(`${aliasName}.${sortFilter.sortField}`, sortFilter.sortOrder);
        if (page_no) {
          query = query.offset((page_no - 1) * page_size);
        }
      }
    }
    query = query.addGroupBy(`${aliasName}.id`);
    if (is_web > 0) {
      query = query.addSelect(`(case
        when ${aliasName}.object_type = '${OBJECT_SHARE_ABLE.VEVENT}' then ce.summary
        when ${aliasName}.object_type = '${OBJECT_SHARE_ABLE.VJOURNAL}' then cn.summary
        when ${aliasName}.object_type = '${OBJECT_SHARE_ABLE.VTODO}' then ct.summary
        when ${aliasName}.object_type = '${OBJECT_SHARE_ABLE.URL}' then url.title
      end ) last_object_title`)
        .leftJoin("cal_event", 'ce'
          , `(${aliasName}.object_uid = ce.uid and ${aliasName}.object_type = '${OBJECT_SHARE_ABLE.VEVENT}')`)
        .leftJoin("cal_note", 'cn'
          , `(${aliasName}.object_uid = cn.uid and ${aliasName}.object_type = '${OBJECT_SHARE_ABLE.VJOURNAL}')`)
        .leftJoin("cal_todo", 'ct'
          , `(${aliasName}.object_uid = ct.uid and ${aliasName}.object_type = '${OBJECT_SHARE_ABLE.VTODO}')`)
        .leftJoin("url", 'url'
          , `(${aliasName}.object_uid = url.uid and ${aliasName}.object_type = '${OBJECT_SHARE_ABLE.URL}')`);
    }
    const rs = await query.limit(page_size).getRawMany();

    return rs.map(r => {
      if (r.object_uid) {
        r.object_uid = r.object_uid.toString();
      }
      if (r.object_type) {
        r.object_type = r.object_type.toString();
      }
      if (!fields || fields.length === 0 || fields.indexOf('object_href') >= 0) {
        if (r.object_type !== OBJECT_SHARE_ABLE.URL) {
          if (r.member_user_id === userId) {
            // object_href for member
            r.object_href = `/calendarserver.php/calendars/${userEmail}/${r.member_calendar_uri}/${r.object_uid}.ics`;
          } else {
            r.object_href = `/calendarserver.php/calendars/${userEmail}/${r.calendar_uri}/${r.object_uid}.ics`;
          }
        }
      }

      delete r.member_user_id;
      delete r.member_calendar_uri;
      delete r.calendar_uri;
      return r;
    });
  }

  async createNotiAfterDelete
    (trash: TrashEntity, userEmail: string, updated_date: number): Promise<number> {
    if (trash.object_type === TRASH_TYPE.URL
      || trash.object_type === TRASH_TYPE.VEVENT
      || trash.object_type === TRASH_TYPE.VJOURNAL
      || trash.object_type === TRASH_TYPE.VTODO) {
      const action = HISTORY_ACTION.DELETED;
      // const content = NOTI_CONTENT.DELETED;
      const content = ''; // auto get content form the object
      const { callType, spName, spParam } = FUNC_CREATE_NOTIFICATION_AFTER_DEL;
      const res = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)}) as nReturn`, [
          trash.user_id,
          userEmail,
          trash.object_id,
          trash.object_uid,
          trash.object_type,
          getUtcSecond(),
          updated_date,
          action,
          content
        ]);

      return (res && res[0]) ? res[0].nReturn : 0;
    } else {
      return -1;
    }
  }

  async getNotifications({ filter, user }: GetAllParams) {
    const { collection_id, ids,
      modified_gte, modified_lt, min_id, page_size, page_no, sort
      , status, object_type, action, assignment
    } = filter;
    const slaveConnection = this.manager
      .connection
      .createQueryRunner("slave");
    try {
      const { callType, spName, spParam } = PROC_GET_NOTIFICATIONS;
      const rawHistories = await slaveConnection
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          collection_id
          , user.id
          , user.email
          , ids?.length ? ids.join(',') : null
          , modified_gte
          , modified_lt
          , min_id
          , page_size
          , page_no
          , sort
          , status?.join() || null
          , object_type?.join() || null
          , action?.join() || null
          , assignment?.join() || null
        ]);

      const noti: CollectionNotificationEntity[] = !rawHistories.length
        ? [] : rawHistories[0];
      return !noti.length ? []
        : this.pickObject(user, noti, filter.fields);
    } finally {
      slaveConnection.release();
    }
  }

  pickObject(user: IUser,
    cmt: CollectionNotificationEntity[],
    fields: string[] = [])
    : CollectionNotificationEntity[] {
    const processor = this.replaceHref(user);
    return cmt.map((item: CollectionNotificationEntity) => {
      const cleaned: CollectionNotificationEntity = processor(item);
      if (!fields.length || fields.includes('object_uid')) {
        cleaned.object_uid = new GeneralObjectId({
          uidBuffer: cleaned.object_uid as Buffer
        }, cleaned.object_type as GENERAL_OBJ).getPlain();
      }
      if (!fields.length || fields.includes('object_type')) {
        cleaned.object_type = cleaned.object_type.toString();
      }

      const respond: CollectionNotificationEntity = new CollectionNotificationEntity();
      if (!fields.length)
        return cleaned;
      fields.forEach(field => {
        respond[field] = cleaned[field];
      });
      return respond;
    });
  }

  private replaceHref(user: IUser) {
    return (noti: CollectionNotificationEntity): CollectionNotificationEntity => {
      if (noti?.object_href
        && noti.member_calendar_uri
        && noti.owner_calendar_uri
        && noti.member_email
        && noti.owner_username) {
        const isOwner = user.id === noti.owner_user_id;
        noti.object_href = isOwner
          ? noti.object_href
            .replace(new RegExp(noti.member_calendar_uri, 'g'), noti.owner_calendar_uri)
          : noti.object_href
            .replace(new RegExp(noti.owner_calendar_uri, 'g'), noti.member_calendar_uri);
        noti.object_href = noti.object_href
          .replace(new RegExp([noti.owner_username, noti.member_email
          ].filter(Boolean).join('|'), 'g'), user.email);
      }
      noti.assignees = this.assigneesProcess(noti.assignees as string);

      delete noti.member_calendar_uri;
      delete noti.owner_calendar_uri;
      delete noti.owner_user_id;
      delete noti.owner_username;
      delete noti.member_email;
      delete noti.member_user_id;
      return noti;
    };
  }

  private assigneesProcess(assignees: string) {
    if (!assignees.length) {
      return [];
    }
    return assignees
      .split(',').map(email => ({ email }));
  }

  async updateNotificationStatus(noti: UpdateNotificationDto, user: IUser) {
    try {
      const { callType, spName, spParam } = FUNC_UPDATE_NOTIFICATION_STATUS;
      const saved = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          +noti.id || 0,
          +noti.status || 0,
          +noti.action_time || 0,
          +noti.updated_date || 0,
          user.id
        ]);

      const updated = (saved && saved[0]) ? saved[0][0] : 0;
      if (!updated || updated.id < 1) {
        return { error: ERR_COLLECTION_ACTIVITY.UPDATE_NOTIFICATION_STATUS_FAILED };
      }
      updated.object_uid = new GeneralObjectId({
        uidBuffer: updated.object_uid as Buffer
      }, updated.object_type as GENERAL_OBJ).getPlain();
      updated.object_type = updated.object_type.toString();
      return updated;

    } catch (error) {
      return { error };
    }
  }

  async deleteNotification(noti: DeleteNotificationDto, user: IUser) {
    try {
      const { callType, spName, spParam } = SP_DELETE_NOTIFICATION;
      const res = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)}) as nReturn`, [
          +noti.id || 0,
          user.id,
          +noti.deleted_date || 0,
        ]);
      const id = (res && res[0]) ? res[0].nReturn : 0;
      if (!id || id < 1) {
        return { error: ERR_COLLECTION_ACTIVITY.DELETE_NOTIFICATION_STATUS_FAILED };
      }
      return { id };
    } catch (error) {
      return { error };
    }
  }
}
