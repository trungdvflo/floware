import { Injectable } from "@nestjs/common";
import { In, Repository } from "typeorm";
import { COLLECTION_TYPE, IS_TRASHED, OBJ_TYPE, SHARE_STATUS } from "../../common/constants/common";
import {
  GetAllFilter, GetAllFilter4Collection,
  GetAllFilterWithSortPaging
} from "../../common/dtos/get-all-filter";
import { CalendarInstance } from "../../common/entities/calendar-instance.entity";
import { ConferenceChannelEntity } from "../../common/entities/conference-channel.entity";
import { ConferenceMemberEntity } from "../../common/entities/conference-member.entity";
import {
  LinkedCollectionObject
} from "../../common/entities/linked-collection-object.entity";
import { ShareMember } from "../../common/entities/share-member.entity";
import { SortObject } from "../../common/entities/sort-object.entity";
import { Url } from "../../common/entities/urls.entity";
import { Users } from "../../common/entities/users.entity";
import { IUser } from "../../common/interfaces";
import { filterGetAllFields } from "../../common/utils/typeorm.util";
import { GetAllFilterMemberItem } from "../share-member/dtos/share-member.get.dto";
import { GetSortObjectTodoDto } from "../todo/dtos/get-sort-object.dto";
export interface FindBaseObjectOptions<T> {
  repository?: Repository<T>;
  userId: number;
}
export interface GetAllAPIOptions<T> extends FindBaseObjectOptions<T> {
  filter: GetAllFilter<T>;
}
export interface GetAllWithSortPagingOptions<T> extends FindBaseObjectOptions<T> {
  filter: GetAllFilterWithSortPaging<T>;
}

export interface GetFileShareOptions<T> extends FindBaseObjectOptions<T> {
  colId: number;
  uid: string;
}

export interface GetCalendarObjectOptions<T> {
  filter: GetAllFilter<T>;
  repository: Repository<T>;
  user: IUser;
}

export interface GetMemberObjectOptions {
  filter: GetAllFilterMemberItem<ShareMember>;
  repository: Repository<ShareMember>;
  userId: number;
}

export interface GetUrlMemberObjectOptions {
  filter: GetAllFilter4Collection<Url>;
  repository: Repository<Url>;
  memberId: number;
}

export interface FindObjectOptions<T> {
  repository: Repository<T>;
  user?: IUser;
  filter: {
    fields: string[],
    uids?: string[],
    ids?: number[],
    email?: string,
  };
}

export interface GetShareMemberByMeOptions<T> {
  filter: GetAllFilter4Collection<T>;
  repository: Repository<T>;
}

export interface GetFileMemberByMeOptions<T> {
  filter: GetAllFilter<T>;
  repository: Repository<T>;
  collectionIds: number[];
}

@Injectable()
export class DatabaseUtilitiesService {
  async getAllSuggestedCollection(options: GetAllAPIOptions<any>) {
    const { modified_gte, modified_lt, min_id, page_size, ids, remove_deleted }
      = options.filter;
    const { repository, userId } = options;
    const fields = filterGetAllFields(repository, options.filter.fields);
    const aliasName = repository.metadata.name || 'model';

    let query = repository
      .createQueryBuilder(aliasName)
      .select(fields && fields.map(f => `${aliasName}.${String(f)}`))
      .addSelect(`${aliasName}.id`)
      .where(`${aliasName}.user_id = :userId`, { userId });

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
    return query.limit(page_size).getMany();
  }

  async findTodoObjectOrders(params: GetSortObjectTodoDto, userId: number
    , repository: Repository<SortObject>) {
    const { page_size, min_id, modified_lt, modified_gte, ids, order_number } = params;

    const aliasName = 'todo';
    const allField = `${aliasName}.id
    , ${aliasName}.account_id
    , ${aliasName}.object_uid
    , ${aliasName}.object_type
    , ${aliasName}.object_href
    , ${aliasName}.order_number
    , ${aliasName}.order_update_time
    , ${aliasName}.created_date
    , ${aliasName}.updated_date`;

    let query = repository.createQueryBuilder(aliasName).addSelect([allField])
      .where(`${aliasName}.user_id = :userId`, { userId });

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
    if (order_number || order_number === 0) {
      query = query.andWhere(`${aliasName}.order_number > :order_number`, { order_number });
      query = query.addOrderBy(`${aliasName}.order_number`, "ASC");
    }
    if (ids) {
      query = query.andWhere(`${aliasName}.id IN (:...ids)`, { ids });
    }

    return query.limit(page_size).getMany();

  }

  async getAll(options: GetAllAPIOptions<any>, collection_id?: number) {
    const { modified_gte, modified_lt, min_id, page_size, ids, remove_deleted }
      = options.filter;
    const { repository, userId } = options;
    const fields = filterGetAllFields(repository, options.filter.fields);
    const aliasName = repository.metadata.name || 'model';

    let query = repository
      .createQueryBuilder(aliasName)
      .select(fields && fields.length > 0 && fields.map(f => `${aliasName}.${String(f)}`))
      .where(`${aliasName}.user_id = :userId`, { userId });

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
    }

    if (remove_deleted &&
      repository.metadata.ownColumns.find(c => c.databaseName === 'is_trashed')) {
      query =
        query.andWhere(
          `${aliasName}.is_trashed != :is_trashed`, { is_trashed: IS_TRASHED.DELETED });
    }

    return query.limit(page_size).getMany();
  }

  async synDataMember(options: GetAllAPIOptions<any>) {
    const {
      page_size,
      modified_lt,
      modified_gte,
      min_id,
      ids,
      remove_deleted
    } = options.filter;

    const { repository, userId } = options;
    const fields = filterGetAllFields(repository, options.filter.fields);
    const aliasName = 'c';
    const allField = `${aliasName}.id
    , ${aliasName}.parent_id
    , ${aliasName}.realtime_channel
    , ${aliasName}.name
    , ${aliasName}.color
    , ${aliasName}.flag
    , ${aliasName}.due_date
    , ${aliasName}.is_hide
    , ${aliasName}.alerts
    , ${aliasName}.type
    , ${aliasName}.recent_time
    , ${aliasName}.kanban_mode
    , ${aliasName}.is_trashed
    , ${aliasName}.is_expand
    , ${aliasName}.view_mode
    , ${aliasName}.created_date`;

    let query = repository
      .createQueryBuilder(aliasName)
      .select(['s.shared_status AS shared_status', 's.calendar_uri as calendar_uri', 's.access AS access', 'u.email AS owner'])
      .addSelect(
        fields
          ? fields.map((f) => {
            if (String(f) === 'updated_date') {
              return `GREATEST(${aliasName}.${String(f)}, s.${String(f)}) AS ${String(f)}`;
            }
            const filterAlias = (String(f) === 'calendar_uri') ? 's' : aliasName;
            return `${filterAlias}.${String(f)} AS ${String(f)}`;
          }) : [`${allField}, GREATEST(${aliasName}.updated_date, s.updated_date) AS updated_date`],
      )
      .innerJoin(ShareMember, 's', `${aliasName}.id = s.collection_id`)
      .innerJoin(Users, 'u', 's.user_id = u.id')
      .where(`${aliasName}.type = :typeCollection AND s.member_user_id = :userMemberId`, {
        typeCollection: COLLECTION_TYPE.SHARE_COLLECTION,
        userMemberId: userId
      });
    if (modified_lt || modified_lt === 0) {
      if (fields && fields.indexOf('updated_date') < 0) {
        query.addSelect(`GREATEST(${aliasName}.updated_date, s.updated_date) AS updated_date`);
      }
      query = query.andWhere(
        `(${aliasName}.updated_date < :modified_lt AND s.updated_date < :modified_lt)`,
        { modified_lt }
      );
      query = query.addOrderBy('updated_date', 'DESC');
    }
    if (modified_gte || modified_gte === 0) {
      if (fields && fields.indexOf('updated_date') < 0) {
        query.addSelect(`GREATEST(${aliasName}.updated_date, s.updated_date) AS updated_date`);
      }
      query = query.andWhere(
        `(${aliasName}.updated_date >= :modified_gte OR s.updated_date >= :modified_gte)`,
        { modified_gte }
      );
      query = query.addOrderBy('updated_date', 'ASC');
    }
    if (min_id || min_id === 0) {
      query = query.andWhere(`${aliasName}.id > :min_id`, { min_id });
      query = query.addOrderBy(`${aliasName}.id`, 'ASC');
    }
    if (ids) {
      query = query.andWhere(`${aliasName}.id IN (:...ids)`, { ids });
    }
    if (remove_deleted) {
      query =
        query.andWhere(
          `${aliasName}.is_trashed != :is_trashed`, { is_trashed: IS_TRASHED.DELETED });
    }
    const data = await query.limit(page_size).getRawMany();
    const resp = data.map(item => {
      if (item.alerts) item.alerts = JSON.parse(item.alerts);
      return item;
    });
    return resp;
  }

  async syncFileByMember(options: GetFileMemberByMeOptions<any>) {
    const { modified_gte, modified_lt, min_id, page_size, ids }
      = options.filter;
    const { collectionIds, repository } = options;
    const fields = filterGetAllFields(repository, options.filter.fields);
    const aliasFile = 'f';

    let query = repository.createQueryBuilder(aliasFile)
      .select(fields && fields.map(f => `${aliasFile}.${String(f)}`))
      .innerJoin(LinkedCollectionObject, 'lco', `lco.object_uid = ${aliasFile}.object_uid`)
      .where(`lco.collection_id IN (:...collectionIds)`, { collectionIds });

    if (modified_lt || modified_lt === 0) {
      query = query.andWhere(`${aliasFile}.updated_date < :modified_lt`, { modified_lt });
      query = query.addOrderBy(`${aliasFile}.updated_date`, "DESC");
    }
    if (modified_gte || modified_gte === 0) {
      query = query.andWhere(`${aliasFile}.updated_date >= :modified_gte`, { modified_gte });
      query = query.addOrderBy(`${aliasFile}.updated_date`, "ASC");
    }
    if (min_id || min_id === 0) {
      query = query.andWhere(`${aliasFile}.id > :min_id`, { min_id });
      query = query.addOrderBy(`${aliasFile}.id`, "ASC");
    }
    if (ids) {
      query = query.andWhere(`${aliasFile}.id IN (:...ids)`, { ids });
    }
    return query.limit(page_size).getMany();
  }

  async getAllMember(options: GetMemberObjectOptions) {
    const { modified_gte, modified_lt, min_id, page_size,
      ids, collection_id, shared_status }
      = options.filter;
    const { repository, userId } = options;
    const fields = filterGetAllFields(repository, options.filter.fields);
    const aliasName = repository.metadata.name || 'model';
    const allField = `${aliasName}.id
    , ${aliasName}.collection_id
    , ${aliasName}.calendar_uri
    , ${aliasName}.access
    , ${aliasName}.shared_status
    , ${aliasName}.shared_email
    , ${aliasName}.contact_uid
    , ${aliasName}.contact_href
    , ${aliasName}.account_id
    , ${aliasName}.created_date
    , ${aliasName}.updated_date`;

    let query = repository
      .createQueryBuilder(aliasName)
      .select(fields ? fields.map(f => `${aliasName}.${String(f)} as ${String(f)}`) : [allField])
      .innerJoin('collection', 'co', `${aliasName}.collection_id = co.id`)
      .where(`${aliasName}.user_id = :userId`, { userId })
      .andWhere('co.is_trashed <> :isTrashed', { isTrashed: IS_TRASHED.DELETED });
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
    }
    if (shared_status) {
      query = query.andWhere(`${aliasName}.shared_status <> :shared_status`,
        { shared_status: SHARE_STATUS.TEMP_REMOVE });
    }
    return query.limit(page_size).getRawMany();
  }

  async getAllUrlMember(options: GetUrlMemberObjectOptions) {
    const {
      modified_gte,
      modified_lt,
      min_id,
      page_size,
      collection_id,
      ids
    } = options.filter;
    const {
      repository,
      memberId
    } = options;
    const fields = filterGetAllFields(repository, options.filter.fields);

    const aliasName = repository.metadata.name || 'model';

    let ownFields = [
      'id',
      'url',
      'uid',
      'title',
      'order_number',
      'order_update_time',
      'is_trashed',
      'recent_date',
      'created_date',
      'updated_date',
    ];
    if (fields !== undefined && fields.length >= 0) {
      ownFields = fields;
    }

    let query = repository
      .createQueryBuilder(aliasName)
      .select(`user.username`, 'owner')
      .innerJoin(
        'linked_collection_object',
        'linked',
        `linked.object_uid = ${aliasName}.uid AND linked.object_type = :objectType`,
        { objectType: OBJ_TYPE.URL }
      )
      .innerJoin(
        'collection_shared_member',
        'coll_sh_member',
        `coll_sh_member.collection_id = linked.collection_id`
      )
      .innerJoin('user', 'user', `user.id = ${aliasName}.user_id`)
      .distinct(true)
      .where(`coll_sh_member.member_user_id = :memberId`, { memberId })
      .andWhere(`coll_sh_member.shared_status = :shareStatus`, {
        shareStatus: SHARE_STATUS.JOINED
      });

    if (ownFields.length > 0) {
      ownFields.forEach(f => {
        if (f === 'updated_date') {
          query.addSelect(`GREATEST(${aliasName}.updated_date, linked.updated_date)`, f);
        } else {
          query.addSelect(`${aliasName}.${String(f)}`, f);
        }
      });
    }

    if (modified_lt || modified_lt === 0) {
      if (fields && fields.indexOf('updated_date') < 0) {
        query.addSelect(`GREATEST(${aliasName}.updated_date, linked.updated_date) AS updated_date`);
      }
      query = query.andWhere(
        `(${aliasName}.updated_date < :modified_lt AND linked.updated_date < :modified_lt)`,
        { modified_lt }
      );
      query = query.addOrderBy(`updated_date`, "DESC");
    }

    if (modified_gte || modified_gte === 0) {
      if (fields && fields.indexOf('updated_date') < 0) {
        query.addSelect(`GREATEST(${aliasName}.updated_date, linked.updated_date) AS updated_date`);
      }
      query = query.andWhere(
        `(${aliasName}.updated_date >= :modified_gte OR linked.updated_date >= :modified_gte)`,
        { modified_gte }
      );
      query = query.addOrderBy(`updated_date`, "ASC");
    }

    if (min_id || min_id === 0) {
      query = query.andWhere(`${aliasName}.id > :min_id`, { min_id });
      query = query.addOrderBy(`${aliasName}.id`, "ASC");
    }
    if (ids) {
      query = query.andWhere(`${aliasName}.id IN (:...ids)`, { ids });
    }
    if (collection_id) {
      query = query.andWhere(`coll_sh_member.collection_id = :collection_id`, { collection_id });
    }
    const data = await query.limit(page_size).getRawMany();

    return data.map(item => {
      if (item.uid) {
        item.uid = item.uid.toString();
      }
      return item;
    });
  }

  async getUrlsMemberByCollectionIds(
    collectionIds,
    memberId,
    data,
    repository
  ) {
    const aliasName = repository.metadata.name || 'model';

    const ownFields = [
      'id',
      'url',
      'uid',
      'title',
      'order_number',
      'order_update_time',
      'is_trashed',
      'recent_date',
      'created_date',
      'updated_date',
    ];

    const ids = data.map(item => item.id);

    const query = repository
      .createQueryBuilder(aliasName)
      .select(`user.username`, 'owner_email')
      .addSelect(`user.id`, 'user_id')
      .addSelect(`linked.collection_id`, 'collection_id')
      .addSelect(`coll_sh_member.access`, 'access')
      .addSelect(`coll_sh_member.shared_status`, 'shared_status')
      .innerJoin(
        'linked_collection_object',
        'linked',
        `linked.object_uid = ${aliasName}.uid AND linked.object_type = :objectType`,
        { objectType: OBJ_TYPE.URL }
      )
      .innerJoin(
        'collection_shared_member',
        'coll_sh_member',
        `coll_sh_member.collection_id = linked.collection_id`
      )
      .innerJoin('user', 'user', `user.id = ${aliasName}.user_id`)
      .where(`linked.collection_id IN (:...collectionIds)`, { collectionIds })
      .andWhere(`${aliasName}.id IN (:...ids)`, { ids })
      .andWhere(`coll_sh_member.member_user_id = :memberId`, { memberId })
      .distinct(true);

    ownFields.forEach(f => {
      query.addSelect(`${aliasName}.${String(f)}`, f);
    });

    return await query.getRawMany();
  }

  async getAllConferenceMember(options: GetAllAPIOptions<any>) {
    const { modified_gte, modified_lt, min_id, page_size, ids }
      = options.filter;
    const { repository, userId } = options;
    const aliasName = repository.metadata.name || 'model';
    const defaultFields = ['cm.id id', 'cm.channel_id channel_id', 'cm.email email'
      , 'cm.created_date created_date', 'cm.updated_date updated_date', 'cm.join_time join_time'
      , 'cm.view_chat_history view_chat_history', 'cm.is_creator is_creator', 'cm.revoke_time revoke_time'];
    let fields = filterGetAllFields(repository, options.filter.fields);
    if (fields && fields.length > 0) {
      fields = fields.filter(f =>
        (f !== 'title' && f !== 'description' && f !== 'avatar' && f !== 'vip'));
    }

    let query = repository
      .createQueryBuilder(aliasName)
      .select((fields && fields.length > 0) ?
        fields.map(f => `cm.${String(f)} ${String(f)}`)
        : defaultFields)
      .innerJoin(ConferenceChannelEntity, 'c', `${aliasName}.channel_id = c.id`)
      .innerJoin(ConferenceMemberEntity, 'cm', `c.id = cm.channel_id`)
      .where(`${aliasName}.user_id = :userId`, { userId })
      .andWhere(`${aliasName}.revoke_time = 0`);

    if (modified_lt || modified_lt === 0) {
      query = query.andWhere(`cm.updated_date < :modified_lt`, { modified_lt });
      query = query.addOrderBy(`cm.updated_date`, "DESC");
    }
    if (modified_gte || modified_gte === 0) {
      query = query.andWhere(`cm.updated_date >= :modified_gte`, { modified_gte });
      query = query.addOrderBy(`cm.updated_date`, "ASC");
    }
    if (min_id || min_id === 0) {
      query = query.andWhere(`cm.id > :min_id`, { min_id });
      query = query.addOrderBy(`cm.id`, "ASC");
    }
    if (ids) {
      query = query.andWhere(`cm.id IN (:...ids)`, { ids });
    }

    return query.limit(page_size).getRawMany();
  }

  async getAllCalendarObjects(options: GetCalendarObjectOptions<any>) { // NOSONAR
    const { modified_gte, modified_lt, min_id, page_size, ids, remove_deleted }
      = options.filter;
    const { repository, user } = options;
    const fields = filterGetAllFields(repository, options.filter.fields);
    const aliasName = repository.metadata.name || 'model';
    const ownColumns = repository.metadata.ownColumns.map(column => column.propertyName);
    const ownFields = fields && fields.length && fields.filter(f => ownColumns.includes(String(f)));
    const condition = user.email && `AND calendarinstance.principaluri =:principaluri` || "";
    let query = repository.createQueryBuilder(aliasName);
    if (ownFields && ownFields.length > 0) {
      query = query.select(ownFields.map(f => `${aliasName}.${String(f)}`));
    }
    query = query.addSelect('calendarinstance.uri', `calendar_uri`)
      .innerJoin(CalendarInstance,
        'calendarinstance', `calendarinstance.calendarid = ${aliasName}.calendarid ${condition}`,
        { principaluri: `principals/${user.email}` })
      .where(`${aliasName}.user_id = :userId`, { userId: user.userId });

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

    if (remove_deleted &&
      repository.metadata.ownColumns.find(c => c.databaseName === 'is_trashed')) {
      query =
        query.andWhere(
          `${aliasName}.is_trashed != :is_trashed`, { is_trashed: IS_TRASHED.DELETED });
    }
    // map calendar_uri for calendar object
    const { entities, raw } = await query.limit(page_size).getRawAndEntities();
    return entities.map((entity, index) => {
      const calendar_uri = raw[index][`calendar_uri`]
        && raw[index][`calendar_uri`].toString() || "";
      if (fields && fields.length) {
        if (fields.includes('calendar_uri')) {
          if (fields.length === 1) return { calendar_uri };
          else return { ...entity, calendar_uri };
        }
        return { ...entity };
      }
      return { ...entity, calendar_uri };
    });
  }

  async findCalendarObjectByUids(options: FindObjectOptions<any>) {
    const { repository, user } = options;
    const { uids } = options.filter;
    const fields = filterGetAllFields(repository, options.filter.fields);
    const aliasName = repository.metadata.name || 'model';

    let query = repository.createQueryBuilder(aliasName);
    if (fields && fields.length > 0) {
      query = query.select(fields.map(f => `${aliasName}.${String(f)} as ${String(f)}`));
    }
    query = query.addSelect('calendarinstance.uri', `calendar_uri`)
      .innerJoin(CalendarInstance,
        'calendarinstance',
        `calendarinstance.calendarid = ${aliasName}.calendarid AND calendarinstance.principaluri =:principaluri`,
        { principaluri: `principals/${user.email}` })
      .where(`${aliasName}.user_id = :userId`, { userId: user.userId });
    if (uids && uids.length) {
      query = query.andWhere(`${aliasName}.uid IN (:...uids)`, { uids });
    } else {
      return { items: [] };
    }
    const items = await query.getRawMany();
    return { items };
  }

  async countItemByUser(options: FindBaseObjectOptions<any>) {
    const { repository, userId } = options;
    const totalItem = await repository.count({
      where: { user_id: userId }
    });
    return totalItem;
  }

  async findByIds(options: FindObjectOptions<any>) {
    const { repository, user } = options;
    const { ids } = options.filter;
    const fields = filterGetAllFields(repository, options.filter.fields);
    return repository.find({
      select: fields,
      where: {
        id: In(ids),
        user_id: user.userId,
      }
    });
  }

  async findOneByEmail(options: FindObjectOptions<any>) {
    const { repository, filter } = options;
    const { email } = filter;
    const fields = filterGetAllFields(repository, filter.fields);
    return repository.findOne({
      select: fields,
      where: {
        email
      }
    });
  }

  async syncDataByMember(options: GetShareMemberByMeOptions<any>, memberUserId: number) {
    const { repository, filter } = options;
    const { modified_gte, modified_lt, min_id, page_size, ids, collection_id } = filter;
    const aliasName = 'sm';
    const alias = 'csm';
    const aliasUser = 'u';
    const allField = `${alias}.id
    , ${alias}.shared_email
    , ${alias}.collection_id
    , ${alias}.access
    , ${alias}.shared_status
    , ${alias}.created_date
    , ${alias}.updated_date`;

    let query = repository
      .createQueryBuilder(aliasName)
      .select([`${aliasUser}.email AS owner`, allField])
      .innerJoin(Users, aliasUser, `${aliasUser}.id = ${aliasName}.user_id`)
      .innerJoin('collection_shared_member', alias
        , `(${alias}.collection_id = ${aliasName}.collection_id
          and ${aliasName}.shared_status = ${SHARE_STATUS.JOINED})
          OR (${alias}.collection_id = ${aliasName}.collection_id
            and ${alias}.member_user_id = ${aliasName}.member_user_id
            and ${aliasName}.shared_status <> ${SHARE_STATUS.JOINED})`)
      .where(`${aliasName}.member_user_id = ${memberUserId}`)
      .distinct(true);

    if (modified_lt || modified_lt === 0) {
      query = query.andWhere(`${alias}.updated_date < :modified_lt`, { modified_lt });
      query = query.addOrderBy(`${alias}.updated_date`, "DESC");
    }
    if (modified_gte || modified_gte === 0) {
      query = query.andWhere(`${alias}.updated_date >= :modified_gte`, { modified_gte });
      query = query.addOrderBy(`${alias}.updated_date`, "ASC");
    }
    if (min_id || min_id === 0) {
      query = query.andWhere(`${alias}.id > :min_id`, { min_id });
      query = query.addOrderBy(`${alias}.id`, "ASC");
    }
    if (ids) {
      query = query.andWhere(`${alias}.id IN (:...ids)`, { ids });
    }
    if (collection_id) {
      query = query.andWhere(`${alias}.collection_id = :collection_id`, { collection_id });
    }

    return query.limit(page_size).getRawMany();
  }

  async syncFileMemberByObjectUid(options: GetFileShareOptions<any>) {
    const { repository, userId, colId, uid } = options;
    const aliasName = 'f';

    const query = repository
      .createQueryBuilder(aliasName)
      .select(['u.email AS owner', 'ext', 'f.id AS id', 'lco.is_trashed as trashed'])
      .innerJoin('user', 'u', `u.id = ${aliasName}.user_id`)
      .innerJoin(
        'linked_collection_object', 'lco', `lco.object_uid = ${aliasName}.object_uid`
      )
      .where('lco.user_id = :userId', { userId })
      .andWhere('lco.collection_id = :colId', { colId })
      .andWhere('lco.object_type = :objectType', { objectType: OBJ_TYPE.VJOURNAL })
      .andWhere(`${aliasName}.uid = :uid`, { uid });

    return await query.getRawOne();
  }
}
