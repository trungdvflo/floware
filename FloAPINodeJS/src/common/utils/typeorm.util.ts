import { FindOperator, In, LessThan, MoreThan, MoreThanOrEqual, Raw, Repository } from 'typeorm';

export const CANVAS_TABLE_NAME = 'kanban_card';
export const KANBAN_TABLE_NAME = 'kanban';
export const URL_TABLE_NAME = 'url';
export const CLOUD_TABLE_NAME = 'cloud';
export const COLLECTION_ICON_TABLE_NAME = 'collection_icon';
export const MEMBER_TABLE_NAME = 'collection_shared_member';
export const QUOTA_TABLE_NAME = 'quota';
export const SYSTEM_COLLECTION_TABLE_NAME = 'collection_system';
export const SUBSCRIPTION_TABLE_NAME = 'subscription';
export const SUBSCRIPTION_COMPONENT_TABLE_NAME = 'subscription_component';
export const SUBSCRIPTION_DETAIL_TABLE_NAME = 'subscription_detail';
export const SUBSCRIPTION_FEATURE_TABLE_NAME = 'subscription_feature';
export const SUBSCRIPTION_PURCHASE_TABLE_NAME = 'subscription_purchase';
export const RULE_TABLE_NAME = 'rule';
export const COLLECTION_INSTANCE_MEMBER = 'collection_instance_member';
export const SUGGESTED_COLLECTION = 'suggested_collection';
export const IDENTICAL_SENDER = 'identical_sender';
export const VIEW_USER_SUBCRIPTION = 'user_subcriptions';
export const COLLECTION_ACTIVITY_TABLE_NAME = 'collection_activity';
export const COLLECTION_HISTORY_TABLE_NAME = 'collection_history';
export const QUOTA_COMMON_BYTES = 'file_common_bytes';
export const CONFERENCE_NON_USER_TABLE_NAME = 'conference_non_user';
export const buildUpdatedDateQuery = (modifiedGTE: any, modifiedLT: any) => {
  try {
    if (!modifiedGTE && !modifiedLT) {
      return undefined;
    }

    if (!modifiedGTE) {
      return LessThan(parseFloat(modifiedLT));
    }

    if (!modifiedLT) {
      return MoreThanOrEqual(parseFloat(modifiedGTE));
    }

    return Raw(alias => `${alias} >= :modifiedGTE AND ${alias} < :modifiedLT`, {
      modifiedGTE: parseFloat(modifiedGTE),
      modifiedLT: parseFloat(modifiedLT)
    });
  } catch (err) {
    throw err;
  }
};

export const buildIdsQuery = (ids, minId): FindOperator<number> => {
  try {
    if (!ids && !minId) {
      return undefined;
    }

    if (!ids) {
      return MoreThan(+minId);
    }

    if (typeof ids === 'string') {
      ids = ids.split(',');
    }

    ids = ids.map(id => +id);
    if (!minId) {
      return In(ids);
    }

    return Raw(alias => `${alias} > ':minId' AND ${alias} IN(:ids)`, { minId: +minId, ids });
  } catch (err) {
    throw err;
  }
};

export const buildWhereConditions = ({ userId, modified_gte, modified_lt, ids, min_id }) => {
  try {
    let whereConditions: any = {
      user_id: userId
    };
    const updatedDateConditions = buildUpdatedDateQuery(modified_gte, modified_lt);
    if (updatedDateConditions) {
      whereConditions = {
        ...whereConditions,
        updated_date: updatedDateConditions
      };
    }

    const idConditions = buildIdsQuery(ids, min_id);
    if (idConditions) {
      whereConditions = {
        ...whereConditions,
        id: idConditions,
      };
    }
    return whereConditions;
  } catch (err) {
    throw err;
  }
};

export const buildSelectFields = <T>(repository: Repository<T>, fields: any): (keyof T)[] => {
  try {
    let columnMetadatas = repository.metadata.ownColumns;
    columnMetadatas = columnMetadatas.filter(column => column.databaseName !== 'user_id');
    const columns =
      columnMetadatas.map(column => column.databaseName) as (keyof T)[];
    if (fields) {
      const selectFields = [];
      fields.forEach((field) => {
        if (columns.find(col => col === field)) {
          selectFields.push(field);
        }
      });
      return selectFields;
    }

    return columns;
  } catch (err) {
    throw err;
  }
};

export const filterGetAllFields = <T>(repository: Repository<T>
  , fields: any, allowCustomFields?: any): (keyof T)[] => {
  try {
    if (!fields) return fields;
    let columnMetadatas = repository.metadata.ownColumns;
    columnMetadatas = columnMetadatas.filter(column => column.databaseName !== 'user_id');
    const columns = columnMetadatas.map(column => column.databaseName);
    const columnFields = columnMetadatas.map(column => column.propertyName);
    let obj_fields = [];
    if (Array.isArray(fields)) {
      obj_fields = fields.map(f => {
        if (allowCustomFields &&
          allowCustomFields.length &&
          allowCustomFields.includes(f)) return f;
        const idx = columns.findIndex(c => c === f);
        if (idx === -1) return;
        return columnFields[idx];
      }).filter(Boolean);
    }
    return obj_fields;
  } catch (err) {
    throw err;
  }
};

type SortType = "ASC" | "DESC";
export class ISortFilter {
  sortField: string;
  sortOrder: SortType;
}

export const sortFiledFilter = (sortParam: string) =>{
  let sortOrder: SortType = "ASC";
  let sortField = "";
  if (sortParam[0] === '+') {
    sortField = sortParam.substring(1);
  } else if (sortParam[0] === '-') {
    sortOrder = "DESC";
    sortField = sortParam.substring(1);
  } else {
    sortField = sortParam;
  }
  const res: ISortFilter = { sortField, sortOrder};
  return res;
};