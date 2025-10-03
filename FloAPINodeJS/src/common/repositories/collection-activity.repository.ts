import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CollectionActivity } from '../../common/entities/collection-activity.entity';
import { CollectionHistory } from '../../common/entities/collection-history.entity';
import { MoveCollectionActivityDTO } from '../../modules/collection_activity/dtos/collection-activity.put.dto';
import { GetAllWithSortPagingOptions } from '../../modules/database/database-utilities.service';
import { COLLECTION_MOVE_ACTIVITY, IS_TRASHED, SHARE_STATUS } from '../constants';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { IUser } from '../interfaces';
import { getPlaceholderByN } from '../utils/common';
import { sortFiledFilter } from '../utils/typeorm.util';

@Injectable()
@CustomRepository(CollectionActivity)
export class CollectionActivityRepository extends Repository<CollectionActivity> {

  async getAll(options: GetAllWithSortPagingOptions<any>) {
    const { modified_gte
      , modified_lt
      , min_id
      , page_size
      , ids
      , collection_id
      , sort
      , fields
      , page_no
    } = options.filter;
    const { userId } = options;
    const aliasName = 'Activity';
    const hAlias = 'History';
    const allFields = [`${hAlias}.id id`,
    `${aliasName}.collection_id collection_id`,
    `${aliasName}.object_uid object_uid`,
    `${aliasName}.object_type object_type`,
    `${aliasName}.object_href object_href`,
    `${hAlias}.collection_activity_id collection_activity_id`,
    `${hAlias}.email email`,
    `${hAlias}.action action`,
    `${hAlias}.action_time action_time`,
    `${hAlias}.content content`,
    `${hAlias}.created_date created_date`,
    `${hAlias}.updated_date updated_date`];
    let selectFields = [];
    if (fields && fields.length > 0) {
      fields.forEach(f => {
        const field = f.toString();
        let index = allFields.indexOf(`${hAlias}.${field} ${field}`);
        if (index < 0) {
          index = allFields.indexOf(`${aliasName}.${field} ${field}`);
        }
        if (index >= 0) {
          selectFields.push(allFields[index]);
        }
      });
    } else {
      selectFields = allFields;
    }
    // for member
    selectFields.push('csm.member_user_id member_user_id');
    selectFields.push('csm.calendar_uri member_calendar_uri');
    selectFields.push('csm.shared_email member_email');
    let query = this
      .createQueryBuilder(aliasName)
      .select(selectFields)
      .innerJoin(CollectionHistory, hAlias, `${aliasName}.id = ${hAlias}.collection_activity_id`)
      .leftJoin("collection_shared_member", 'csm', `(csm.collection_id = ${aliasName}.collection_id
      AND csm.shared_status = :sharedStatus)`, { sharedStatus: SHARE_STATUS.JOINED })
      .where(`(${aliasName}.user_id = :userId
        OR csm.member_user_id = :userId)`, { userId });  // for member

    if (modified_lt || modified_lt === 0) {
      query = query.andWhere(`${hAlias}.updated_date < :modified_lt`, { modified_lt });
      query = query.addOrderBy(`${hAlias}.updated_date`, "DESC");
    }
    if (modified_gte || modified_gte === 0) {
      query = query.andWhere(`${hAlias}.updated_date >= :modified_gte`, { modified_gte });
      query = query.addOrderBy(`${hAlias}.updated_date`, "ASC");
    }
    if (min_id || min_id === 0) {
      query = query.andWhere(`${hAlias}.id > :min_id`, { min_id });
      query = query.addOrderBy(`${hAlias}.id`, "ASC");
    }
    if (ids) {
      query = query.andWhere(`${hAlias}.id IN (:...ids)`, { ids });
    }
    if (collection_id) {
      query = query.andWhere(`${aliasName}.collection_id = :collection_id`, { collection_id });
      if (sort) {
        const sortFilter = sortFiledFilter(sort);
        query = query.orderBy(`${hAlias}.${sortFilter.sortField}`, sortFilter.sortOrder);
        if (page_no) {
          query = query.offset((page_no - 1) * page_size);
        }
      }
    }
    query = query.addGroupBy(`${hAlias}.id`);
    const rs = await query.limit(page_size).getRawMany();

    return rs.map(r => {
      if (r.object_uid) {
        r.object_uid = r.object_uid.toString();
      }
      if (r.object_type) {
        r.object_type = r.object_type.toString();
      }
      if (r.member_user_id === userId && r.object_href) {
        // object_href for member
        r.object_href = `/calendarserver.php/calendars/${r.member_email}/${r.member_calendar_uri}/${r.object_uid}.ics`;
      }
      delete r.member_user_id;
      delete r.member_calendar_uri;
      delete r.member_email;
      return r;
    });
  }

  async getMoveRoleAndCalUri(item: MoveCollectionActivityDTO, userId: number) {
    const aliasName = 'Activity';
    const aliasCollNew = 'CO';
    const aliasSetting = 'S';
    const selectFields = [`${aliasName}.id id`,
    `${aliasName}.collection_id collection_id`,
    `${aliasName}.object_type object_type`,
    ];
    if (item.collection_id === 0) {
      selectFields.push(`${aliasSetting}.omni_cal_id calendar_uri`);
    } else {
      selectFields.push(`${aliasCollNew}.calendar_uri calendar_uri`);
    }
    let query = this
      .createQueryBuilder(aliasName)
      .select(selectFields)
      .where(`${aliasName}.id = :collection_activity_id`,
        { collection_activity_id: item.collection_activity_id })
      .andWhere(`${aliasName}.user_id = :userId`, { userId });  // for owner

    if (item.collection_id === 0) {
      query = query.innerJoin("setting", aliasSetting,
        `${aliasSetting}.user_id = :userId`, {
        userId
      });
    } else {
      query = query.innerJoin("collection", aliasCollNew,
        `${aliasCollNew}.id = ${item.collection_id}
         and ${aliasCollNew}.user_id = :userId
         and ${aliasCollNew}.is_trashed = :isTrashed`, {
        userId,
        isTrashed: IS_TRASHED.NOT_TRASHED
      });
    }

    const rs = await query.getRawOne();
    if (rs) {
      return {
        id: Number(rs.id),
        old_collection_id: Number(rs.collection_id),
        new_calendar_uri: String(rs.calendar_uri),
        object_type: String(rs.object_type),
      };
    } else {
      return null;
    }
  }

  async move(item: MoveCollectionActivityDTO, user: IUser, updatedDate: number) {
    const { callType, spName, spParam } = COLLECTION_MOVE_ACTIVITY;
    const res = await this.manager
      .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
        item.collection_activity_id,
        item.collection_id,
        item.object_uid.objectUid,
        user.userId,
        user.email,
        item.content,
        item.action_time || updatedDate,
        updatedDate
      ]);
    const move = res.length && res[0].length ? res[0][0] : {};

    return {
      max_updated_date: +move.out_max_updated_date || 0,
      old_collection_id: +move.out_collection_id || 0,
      object_href: move.out_object_href,
      has_comment: +move.has_comment || 0,
      object_type: move.object_type,
    };
  }
}
