const _ = require('lodash');
const Sequelize = require('sequelize');
const IsJSON = require('is-valid-json');
const Moment = require('moment');
const Code = require('../constants/ResponseCodeConstant');
const App = require('../constants/AppsConstant');
const Utils = require('../utilities/Utils');

const {
  UserModel,
  GroupUserModel,
  GroupsModel,
  ReportCachedUsersModel
} = require('../models');
const { OpsItemRelatedItemAlreadyExistsException } = require('@aws-sdk/client-ssm');

const permissions = [1];
const NewPrivate = {
  GetGroupUsers: async (request, groupId = null) => {
    const { query } = request;
    let groupIds;
    if (groupId && query.group_ids) {
      groupIds = [query.group_ids, groupId].join();
    } else if (groupId) {
      groupIds = groupId;
    } else {
      groupIds = query.group_ids;
    }
    const paging = Utils.HandlePaging(query.page, query.max_rows);
    const data = await NewPrivate.getListUser({
      ...query,
      ...paging,
      group_ids: groupIds?.toString()
    });
    return {
      totalRows: data[0]?.totalRows,
      data
    };
  },

  getListUser: async (query) => {
    return UserModel.sequelize.query(`CALL adm2023_listOfUser(:ids,
        :group_ids, :group_filter_type, :keyword, :account_types, 
        :subscription_types, :last_used_start, :last_used_end, :join_date_start, 
        :join_date_end, :migration_status, :platform_ids, :platform_filter_type, 
        :flo_mac_update, :flo_mac_filter_type, :is_internal,
        :sort, :offset, :limit
    )`, {
      replacements: {
        ids: query.ids ?? null,
        group_ids: query.group_ids ?? null,
        group_filter_type: query.group_filter_type ?? null,
        keyword: query.keyword ?? null,
        account_types: query.account_types ?? null,
        subscription_types: query.subscription_types ?? null,
        last_used_start: query.last_used_start ?? null,
        last_used_end: query.last_used_end ?? null,
        join_date_start: query.join_date_start ?? null,
        join_date_end: query.join_date_end ?? null,
        migration_status: query.migration_status ?? null,
        platform_ids: query.platform_ids ?? null,
        platform_filter_type: query.platform_filter_type ?? null,
        flo_mac_update: query.flo_mac_update ?? null,
        flo_mac_filter_type: query.flo_mac_filter_type ?? null,
        is_internal: query.is_internal ?? null,
        sort: query.sort ?? null,
        offset: query.offset ?? null,
        limit: query.limit ?? null
      }
    });
  },

  FilterHandle: (
    request,
    allowConditionItems = [
      'ids',
      'user_ids',
      'group_ids',
      'group_type',
      'keyword',
      'account_types',
      'subscription_types',
      'last_used_start',
      'last_used_end',
      'join_date_start',
      'join_date_end',
      'is_disabled',
      'is_deleted',
      'migration_status',
      'group_filter_type',
      'migrate_filter_type',
      'platform_ids',
      'platform_filter_type',
      'migrate_filter_type',
      'flo_mac_update',
      'flo_mac_filter_type',
      'is_internal'
    ]
  ) => {
    const { query } = request;
    const conditionItems = _.pick(query, allowConditionItems);

    if (_.isEmpty(conditionItems) === true) {
      return '';
    }
    const where = {};
    where[Sequelize.Op.and] = [];

    // stop allow filter frozen account here
    where.disabled = 0;
    where.deleted = 0;
    where.addition_info = { [Sequelize.Op.notLike]: '%"userDeleted"%' };

    if (_.isEmpty(conditionItems.keyword) === false) {
      where[Sequelize.Op.and].push({
        [Sequelize.Op.or]: [{
          email: {
            [Sequelize.Op.substring]: query.keyword
          }
        }, {
          account_3rd_emails: {
            [Sequelize.Op.substring]: query.keyword
          }
        }]
      });
    }
    if (_.isEmpty(conditionItems.platform_ids) === false) {
      const platformIds = conditionItems.platform_ids
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const platformOp = conditionItems.platform_filter_type === App.FILTER_TYPE.ALL
        ? Sequelize.Op.and : Sequelize.Op.or;

      const conditionPlatform = conditionItems.platform_filter_type === App.FILTER_TYPE.ANY
        ? [{ [Sequelize.Op.regexp]: `"app_reg_id": "${platformIds.join('|')}"` }]
        : _.uniq(platformIds).map(
          (uniqPlatformId) => ({
            [Sequelize.Op.substring]: `"app_reg_id": "${uniqPlatformId}"`
          })
        );
      where[Sequelize.Op.and] = [
        ...where[Sequelize.Op.and],
        Sequelize.where(
          Sequelize.fn("CONCAT",
            Sequelize.fn('IFNULL', Sequelize.col("platform"), ''),
            Sequelize.fn('IFNULL', Sequelize.col("old_platform"), '')),
          {
            [platformOp]: conditionPlatform
          }
        )
      ];
    }
    // 
    if (_.isNumber(conditionItems.is_internal)) {
      where.groups = where.groups || {};
      where.groups[Sequelize.Op.and] = where.groups[Sequelize.Op.and] || [];
      // filter internal user bu group type = 2
      where.groups[Sequelize.Op.and].push(
        +conditionItems.is_internal === 1
          ? { [Sequelize.Op.substring]: `"group_type":"2",` }
          : { [Sequelize.Op.notLike]: `%"group_type":"2",%` }
      );
    }
    //
    if (_.isEmpty(conditionItems.group_ids) === false) {
      where.groups = where.groups || {};
      const groupIds = conditionItems.group_ids.split(',').map((item) => {
        return +item.trim();
      }).filter(Number.isInteger);
      if (_.isEmpty(groupIds) === false) {
        const groupOp = conditionItems.group_filter_type === App.FILTER_TYPE.ALL
          ? Sequelize.Op.and : Sequelize.Op.or;
        where.groups[groupOp] = [];
        const noGroup = (gid) => gid === -1;
        const uniqGroupIds = [...new Set(groupIds)];
        if (conditionItems.group_filter_type === App.FILTER_TYPE.ANY) {
          where.groups[groupOp].push({ [Sequelize.Op.regexp]: `"id":(${uniqGroupIds.join('|')}),` });
          if (uniqGroupIds.find(noGroup) !== undefined) {
            where.groups[Sequelize.Op.or] = where.groups[Sequelize.Op.or] || [];
            where.groups[Sequelize.Op.or].push('[]');
            where.groups[Sequelize.Op.or].push('');
          }
        } else {
          where.groups[groupOp].push(...uniqGroupIds
            .filter((g) => g > 0)
            .map((uniqGroupId) => ({
              [Sequelize.Op.substring]: `"id":${uniqGroupId},`
            })));
        }
      }
    }
    //
    if (_.isNumber(conditionItems.group_type) === true) {
      if (_.isObject(where.groups) === false) {
        where.groups = {};
      }
      if (_.isEmpty(where.groups[Sequelize.Op.and]) === true) {
        where.groups[Sequelize.Op.and] = [];
      }
      where.groups[Sequelize.Op.and].push({
        [Sequelize.Op.substring]: `"group_type":"${conditionItems.group_type}"`
      });
    }
    //
    if (_.isEmpty(conditionItems.account_types) === false) {
      const accountTypes = _.map(conditionItems.account_types.split(','), (item) => {
        const id = item.trim();

        if (_.isNaN(Number(id)) === false) {
          return Number(id);
        }
        return undefined;
      });
      _.remove(accountTypes, _.isUndefined);
      if (_.isEmpty(accountTypes) === false) {
        if (_.isObject(where.account_type) === false) {
          where.account_type = {};
        }
        if (_.isEmpty(where.account_type[Sequelize.Op.or]) === true) {
          where.account_type[Sequelize.Op.or] = [];
        }

        const uniqAccountTypes = _.uniq(accountTypes);
        _.forEach(uniqAccountTypes, (uniqAccountType) => {
          const accountType = App.ACCOUNT_TYPE_MAP[uniqAccountType];
          if (_.isNumber(accountType) === true) {
            where.account_type[Sequelize.Op.or].push({
              [Sequelize.Op.substring]: `${accountType}`
            });
          } else {
            _.forEach(accountType, (item) => {
              where.account_type[Sequelize.Op.or].push({
                [Sequelize.Op.substring]: `${item}`
              });
            });
          }
        });
      }
    }
    //
    if (_.isEmpty(conditionItems.subscription_types) === false) {
      const subscriptionTypes = _.map(conditionItems.subscription_types.split(','), (item) => {
        const id = item.trim();

        if (_.isNaN(Number(id)) === false) {
          return Number(id);
        }
        return undefined;
      });
      _.remove(subscriptionTypes, _.isUndefined);

      if (_.isEmpty(subscriptionTypes) === false) {
        const uniqSubscriptionTypes = _.uniqBy(subscriptionTypes);
        where.subs_type = uniqSubscriptionTypes;
      }
    }
    //
    if (_.isNumber(conditionItems.join_date_start) === true && _.isNumber(conditionItems.join_date_end) === true) {
      if (conditionItems.join_date_start <= conditionItems.join_date_end) {
        where.join_date = {
          [Sequelize.Op.gte]: conditionItems.join_date_start,
          [Sequelize.Op.lte]: conditionItems.join_date_end
        };
      }
    }
    //
    if (_.isNumber(conditionItems.last_used_start) === true && _.isNumber(conditionItems.last_used_end) === true) {
      if (conditionItems.last_used_start <= conditionItems.last_used_end) {
        where.last_used_date = {
          [Sequelize.Op.gte]: conditionItems.last_used_start,
          [Sequelize.Op.lte]: conditionItems.last_used_end
        };
      }
    }
    //
    if (!_.isEmpty(conditionItems.migration_status)) {
      where[Sequelize.Op.and] = [
        ...where[Sequelize.Op.and],
        {
          user_migrate_status: {
            [Sequelize.Op.in]:
              conditionItems.migration_status
                .split(',').map(Number)
          }
        }
      ];
    }
    //
    if (_.isEmpty(conditionItems.flo_mac_update) === false) {
      const upgraded = [{
        user_migrate_status: 2
      }, Sequelize.where(
        Sequelize.fn("INSTR",
          Sequelize.fn('IFNULL', Sequelize.col("platform"), ''),
          `${App.APP_REG_ID.FLO_MAC}`),
        { [Sequelize.Op.gt]: 0 }
      )];

      const notUpgrade = {
        user_migrate_status: 0
      };
      const queryMacUpgrade = conditionItems.flo_mac_update
        .split(',')
        .map((item) => +item.trim())
        .filter(Number.isInteger);

      if (queryMacUpgrade.length === 2) {
        const floMacOp = conditionItems.flo_mac_filter_type === App.FILTER_TYPE.ALL
          ? Sequelize.Op.and : Sequelize.Op.or;
        where[floMacOp] = where[floMacOp] || [];
        where[floMacOp].push(notUpgrade, upgraded);
      } else if (queryMacUpgrade[0] === 0) {
        where[Sequelize.Op.and] = [
          ...where[Sequelize.Op.and],
          notUpgrade
        ];
      } else if (queryMacUpgrade[0] === 1) {
        where[Sequelize.Op.and] = [
          ...where[Sequelize.Op.and],
          ...upgraded
        ];
      }
    }
    return where;
  },

  SortHandle: (
    request,
    validSortField = [
      'id',
      'email',
      'fullname',
      'groups',
      'join_date',
      'next_renewal',
      'last_used_date',
      'storage',
      'account_3rd',
      'subs_type'
    ]
  ) => {
    try {
      const { query } = request;
      const conditionItems = _.pick(query, ['sort']);
      if (_.isEmpty(conditionItems) === true) {
        return '';
      }

      return Utils.HandleSortCustomSequelize(query.sort, validSortField, [
        {
          field: 'storage',
          value:
            'CAST(JSON_UNQUOTE(CASE WHEN JSON_VALID(storage) THEN JSON_EXTRACT(`storage`,\'$."total"\') ELSE "0" END ) AS DECIMAL)'
        },
        {
          field: 'groups',
          value:
            'JSON_UNQUOTE(CASE WHEN JSON_VALID(groups) THEN REPLACE(REPLACE(JSON_EXTRACT(`groups`,\'$[*].name\'),\', \',\'\'),\'""\',\'\') ELSE "" END )'
        },
        {
          field: 'fullname',
          value:
            'JSON_UNQUOTE(CASE WHEN JSON_VALID(addition_info) THEN JSON_EXTRACT(`addition_info`,\'$."fullname"\') ELSE "" END )'
        },
        {
          field: 'subs_type',
          value: 'CASE WHEN subs_type = 1 THEN \'Premium\' WHEN subs_type = 2 THEN \'Pro\' ELSE \'Standard\' END'
        }
      ]);
    } catch (error) {
      return [];
    }
  },

  ValidateUserRequest: (request, allowFields = [], allowSortItems = []) => {
    const { query } = request;
    const {
      fields, sort, ids, group_ids, account_types, subscription_types
    } = query;

    const fieldsArr = fields ? fields.split(',').map((item) => item.trim()) : [];
    if (_.isEmpty(fieldsArr) === false && _.isEmpty(allowFields) === false) {
      const fieldsUnion = _.union(fieldsArr, allowFields);
      if (fieldsUnion.length !== allowFields.length) {
        return {
          code: 0,
          message: 'Invalid field name, please check available field'
        };
      }
    }

    if (_.isEmpty(sort) === false && _.isEmpty(allowSortItems) === false) {
      let error = 0;
      const sortArr = sort.split(',');
      const types = {
        '+': 'ASC',
        '-': 'DESC'
      };
      _.forEach(sortArr, (item) => {
        const type = types[item[0]];
        let field = _.trim(item.slice(1));

        if (_.isUndefined(type) === true) {
          field = _.trim(item);
        }
        if (_.indexOf(allowSortItems, field) < 0) {
          error = 1;
        }
      });

      if (error === 1) {
        return {
          code: 0,
          message: 'Invalid sort field, please check available sort field'
        };
      }
    }

    if (_.isEmpty(ids) === false) {
      let error = 0;
      const message = 'Invalid id number, id must be between 1 and 4294967295';
      const idArr = _.map(ids.split(','), (item) => {
        const id = item.trim();
        if (_.isNaN(Number(id)) === false) {
          return Number(id);
        }
        error = 1;
        return undefined;
      });
      if (error === 1) {
        return {
          code: 0,
          message
        };
      }

      _.forEach(idArr, (id) => {
        if (id <= 0 || id > 4294967295) {
          error = 1;
        }
      });

      if (error === 1) {
        return {
          code: 0,
          message
        };
      }
    }

    if (_.isEmpty(group_ids) === false) {
      let error = 0;
      const message = 'Invalid group_id number, group_id must be between -1 and 2147483647';
      const groupIdsArr = _.map(group_ids.split(','), (item) => {
        const id = item.trim();
        if (_.isNaN(Number(id)) === false) {
          return Number(id);
        }
        error = 1;
        return undefined;
      });

      if (error === 1) {
        return {
          code: 0,
          message
        };
      }

      _.forEach(groupIdsArr, (id) => {
        if (id < -1 || id > 2147483647) {
          error = 1;
        }
      });
      if (error === 1) {
        return {
          code: 0,
          message
        };
      }
    }

    if (_.isEmpty(account_types) === false) {
      const message = 'Invalid account_type value, please check available account types';
      const accountTypeArr = account_types ? account_types.split(',').map((item) => item.trim()) : [];
      const allowAccountTypes = Object.keys(App.ACCOUNT_TYPE_MAP);
      const accountTypeUnion = _.union(accountTypeArr, allowAccountTypes);

      if (accountTypeUnion.length !== allowAccountTypes.length) {
        return { code: 0, message };
      }
    }

    if (_.isEmpty(subscription_types) === false) {
      const subscriptionTypeArr = subscription_types ? subscription_types.split(',').map((item) => item.trim()) : [];
      const allowSubscriptionTypes = Object.keys(App.SUBSCRIPTION_TYPE_MAP);
      const accountTypeUnion = _.union(subscriptionTypeArr, allowSubscriptionTypes);
      if (accountTypeUnion.length !== allowSubscriptionTypes.length) {
        return {
          code: 0,
          message: 'Invalid subscription_type value, please check available subscription types'
        };
      }
    }

    return { code: 1 };
  },
  /**
   * @predicated
   * @param {*} request 
   * @param {*} allowConditionItems 
   * @returns 
   */
  FilterPlatform: (request, allowConditionItems = [
    'platform_ids',
    'platform_filter_type'
  ]) => {
    const { query } = request;
    const conditionItems = _.pick(query, allowConditionItems);
    if (_.isEmpty(conditionItems) || _.isEmpty(conditionItems.platform_ids)) {
      return {};
    }
    const result = {};
    const platformIds = conditionItems.platform_ids
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (_.isEmpty(platformIds)) {
      return result;
    }

    if (_.isObject(result.app_reg_id) === false) {
      result.app_reg_id = {};
    }

    let groupType = Sequelize.Op.or;
    if (conditionItems.platform_filter_type === App.FILTER_TYPE.ALL) {
      groupType = Sequelize.Op.and;
    }
    if (_.isEmpty(result.app_reg_id[groupType]) === true) {
      result.app_reg_id[groupType] = [];
    }
    const uniqPlatformIds = _.uniq(platformIds);
    _.forEach(uniqPlatformIds, (uniqPlatformId) => {
      result.app_reg_id[groupType].push({
        [Sequelize.Op.substring]: `"app_reg_id":"${uniqPlatformId}"`
      });
    });

    return result;
  }
};

const Private = {
  GetGroupUsers: async (request, groupIds = []) => {
    const { query } = request;
    const paging = Utils.HandlePaging(query.page, query.max_rows);

    const selectQuery = `
        SELECT DISTINCT u.email,u.disabled, u.id,
          (u.created_date) as join_date,
          u.fullname, ud.progress as progress,
          count(distinct sa.user_income) account_3rd,
          if(q.username != '',q.bytes+q.cal_bytes+q.card_bytes+q.file_bytes+q.qa_bytes, 0) storage,
          GROUP_CONCAT(DISTINCT g.name ORDER BY g.id ASC SEPARATOR '/') as groups,
          GROUP_CONCAT(DISTINCT sa.user_income ORDER BY sa.id ASC SEPARATOR '\n') as account_3rd_emails,
          CASE
            WHEN sc.subs_type = 1 THEN 'Premium'
            WHEN sc.subs_type = 2 THEN 'Pro'
            ELSE 'Standard'
          END as subs_type,
          if(sp.sub_id != '', sp.sub_id, '') as sub_id,
          CASE
            WHEN sc.order_number = 1 OR sc.order_number = 3 THEN 'Yearly'
            WHEN sc.order_number = 2 OR sc.order_number = 4 THEN 'Monthly'
            ELSE ''
          END as subs_time,
          max(uta.last_used_date) as last_used_date,
          if(sp.created_date != 0,(sp.created_date), 0) as subs_current_date,
          if(sp.created_date != 0, (sp.created_date + (sc.period * 86400) ), 0) as next_renewal
        `;
    const fromQuery = `
        FROM user u
        LEFT JOIN third_party_account sa on sa.user_id = u.id
        LEFT JOIN quota q on q.username = u.username
        LEFT JOIN subscription_purchase sp on sp.user_id = u.id and sp.is_current = 1
        LEFT JOIN subscription sc on sc.id = sp.sub_id
        LEFT JOIN user_tracking_app uta on uta.user_id = u.id
        LEFT JOIN tracking_app ta on ta.id = uta.user_id
        LEFT JOIN user_deleted ud on ud.user_id = u.id
        `;

    let data = [];
    const condition = Private.FilterHandle(request);
    const conditionNoGroup = Private.FilterHandle(request, true);
    const sort = Private.SortHandle(request, true);
    let countRow = 0;

    if (groupIds.length === 0) {
      countRow = await Private.CountAllUsers(condition, conditionNoGroup, request);
    } else if (groupIds.length === 1 && groupIds.indexOf(-1) >= 0) {
      countRow = await Private.CountUsersOfNoGroups(conditionNoGroup, request);
    } else if (groupIds.length >= 1 && groupIds.indexOf(-1) >= 0) {
      countRow = await Private.CountUsersWithNoGroups(groupIds, condition, conditionNoGroup, request);
    } else {
      countRow = await Private.CountUsersWithoutNoGroups(groupIds, condition, request);
    }

    if (countRow.total <= 0) {
      return { totalRows: 0, data };
    }

    if (groupIds.length === 0) {
      data = await Private.GetAllUsers(selectQuery, fromQuery, condition, conditionNoGroup, sort, paging);
    } else if (groupIds.length === 1 && groupIds.indexOf(-1) >= 0) {
      data = await Private.GetUsersOfNoGroups(selectQuery, fromQuery, conditionNoGroup, sort, paging);
    } else if (groupIds.length >= 1 && groupIds.indexOf(-1) >= 0) {
      data = await Private.GetUsersWithNoGroups(
        selectQuery,
        fromQuery,
        groupIds,
        condition,
        conditionNoGroup,
        sort,
        paging
      );
    } else {
      data = await Private.GetUsersWithoutNoGroups(selectQuery, fromQuery, groupIds, condition, sort, paging);
    }
    return { totalRows: countRow.total, data };
  },

  GetAllUsers: async (selectQuery, fromQuery, condition, conditionNoGroup, sort, paging) => {
    const queryString = `
                ${selectQuery}
                ${fromQuery}
                INNER JOIN group_user gu on gu.user_id = u.id or gu.username = u.username  
                INNER JOIN \`group\` g on g.id = gu.group_id  WHERE
                ${condition ? `${condition}` : '1'}
                GROUP BY u.email
                UNION
                ${selectQuery}
                ${fromQuery}
                LEFT JOIN group_user gu on gu.user_id = u.id or gu.username = u.username
                LEFT JOIN \`group\` g on g.id = gu.group_id
                WHERE u.id NOT IN (SELECT user_id FROM group_user GROUP BY group_user.user_id)
                ${conditionNoGroup ? `AND ${conditionNoGroup}` : ''}
                GROUP BY u.email
                ORDER BY ${sort || 'id DESC'}
                LIMIT ${paging.limit} 
                OFFSET ${paging.offset}
                `;
    return UserModel.sequelize
      .query(queryString, { type: UserModel.sequelize.QueryTypes.SELECT })
      .then((result) => result || []);
  },

  GetUsersOfNoGroups: async (selectQuery, fromQuery, conditionNoGroup, sort, paging) => {
    const queryString = `
                ${selectQuery}
                ${fromQuery}
                LEFT JOIN group_user gu on gu.user_id = u.id or gu.username = u.username
                LEFT JOIN \`group\` g on g.id = gu.group_id
                WHERE u.id NOT IN (SELECT user_id FROM group_user GROUP BY group_user.user_id)
                ${conditionNoGroup ? `AND ${conditionNoGroup}` : ''}
                GROUP BY u.email
                ORDER BY ${sort || 'id DESC'}
                LIMIT ${paging.limit} 
                OFFSET ${paging.offset}
                `;
    return UserModel.sequelize
      .query(queryString, { type: UserModel.sequelize.QueryTypes.SELECT })
      .then((result) => result || []);
  },

  GetUsersWithNoGroups: async (selectQuery, fromQuery, groupIds = [], condition, conditionNoGroup, sort, paging) => {
    const queryString = `
                ${selectQuery}
                ${fromQuery}
                INNER JOIN group_user gu on gu.user_id = u.id or gu.username = u.username
                INNER JOIN \`group\` g on g.id = gu.group_id
                WHERE g.id IN (${groupIds.join(',')})
                ${condition ? `AND ${condition}` : ''}
                GROUP BY u.email
                UNION
                ${selectQuery}
                ${fromQuery}
                LEFT JOIN group_user gu on gu.user_id = u.id or gu.username = u.username
                LEFT JOIN \`group\` g on g.id = gu.group_id
                WHERE u.id NOT IN (SELECT user_id FROM group_user GROUP BY group_user.user_id)
                ${conditionNoGroup ? `AND ${conditionNoGroup}` : ''}
                GROUP BY u.email
                ORDER BY ${sort || 'id DESC'}
                LIMIT ${paging.limit} 
                OFFSET ${paging.offset}
                `;

    return UserModel.sequelize
      .query(queryString, { type: UserModel.sequelize.QueryTypes.SELECT })
      .then((result) => result || []);
  },

  GetUsersWithoutNoGroups: async (selectQuery, fromQuery, groupIds, condition, sort, paging) => {
    const queryString = `
                ${selectQuery}
                ${fromQuery}
                INNER JOIN group_user gu ON gu.user_id = u.id or gu.username = u.username
                INNER JOIN \`group\` g ON g.id = gu.group_id
                WHERE 
                g.id IN (${groupIds.join(',')})
                ${condition ? `AND ${condition}` : ''}
                GROUP BY u.email
                ORDER BY ${sort || 'id DESC'}
                LIMIT ${paging.limit} 
                OFFSET ${paging.offset}
                `;
    return UserModel.sequelize
      .query(queryString, { type: UserModel.sequelize.QueryTypes.SELECT })
      .then((result) => result || []);
  },

  CountUsersOfNoGroups: async (conditionNoGroup, request) => {
    const { query } = request;
    const conditionItems = _.pick(query, ['subscription_types', 'last_used_start', 'last_used_end']);
    let innerJoin = '';
    if (_.isEmpty(conditionItems) === false) {
      innerJoin = `
                    INNER JOIN subscription_purchase sp on sp.user_id = u.id and sp.is_current = 1
                    INNER JOIN user_tracking_app uta on uta.user_id = u.id`;
    }

    const queryString = `
                SELECT COUNT(*) as total
                FROM (
                        SELECT DISTINCT u.id
                        FROM user u
                        LEFT JOIN third_party_account sa on sa.user_id = u.id
                        LEFT JOIN group_user gu on gu.user_id = u.id or gu.username = u.username
                        LEFT JOIN \`group\` g on g.id = gu.group_id
                        ${innerJoin}
                        WHERE 
                            u.id NOT IN (SELECT user_id FROM group_user GROUP BY group_user.user_id)
                            ${conditionNoGroup ? `AND ${conditionNoGroup}` : ''}
                ) as count_users_no_group
                `;
    return UserModel.sequelize
      .query(queryString, { type: UserModel.sequelize.QueryTypes.SELECT })
      .then((result) => (result ? result[0] : 0));
  },

  CountAllUsers: async (condition, conditionNoGroup, request) => {
    const { query } = request;
    const conditionItems = _.pick(query, ['subscription_types', 'last_used_start', 'last_used_end']);
    let innerJoin = '';
    let innerNoGroupJoin = '';
    if (_.isEmpty(conditionItems) === false) {
      innerJoin = `
                    INNER JOIN user_tracking_app uta on uta.user_id = u.id`;

      innerNoGroupJoin = `
                    INNER JOIN subscription_purchase sp on sp.user_id = u.id and sp.is_current = 1
                    INNER JOIN user_tracking_app uta on uta.user_id = u.id`;
    }

    const queryString = `
                    SELECT COUNT(*) as total
                    FROM (
                    SELECT DISTINCT u.id
                    from users u
                    LEFT JOIN third_party_account sa on sa.user_id = u.id
                    LEFT JOIN subscription_purchase sp on sp.user_id = u.id and sp.is_current = 1
                    INNER JOIN group_user gu on gu.user_id = u.id or gu.username = u.username
                    INNER JOIN \`group\` g on g.id = gu.group_id
                    ${innerJoin}
                    INNER JOIN subscription sc on sc.id = sp.sub_id
                    WHERE 
                        ${condition ? `${condition}` : '1'}
                    UNION
                    SELECT DISTINCT u.id
                    FROM user u
                    LEFT JOIN third_party_account sa on sa.user_id = u.id
                    LEFT JOIN group_user gu on gu.user_id = u.id or gu.username = u.username
                    LEFT JOIN \`group\` g on g.id = gu.group_id
                    ${innerNoGroupJoin}
                    WHERE 
                        u.id NOT IN (SELECT user_id FROM group_user GROUP BY group_user.user_id)
                        ${conditionNoGroup ? `AND ${conditionNoGroup}` : ''}
                    ) AS count_users_with_no_groups
                `;
    return UserModel.sequelize
      .query(queryString, { type: UserModel.sequelize.QueryTypes.SELECT })
      .then((result) => (result ? result[0] : 0));
  },

  CountUsersWithNoGroups: async (groupIds, condition, conditionNoGroup, request) => {
    const { query } = request;
    const conditionItems = _.pick(query, ['subscription_types', 'last_used_start', 'last_used_end']);
    let innerJoin = '';
    let innerNoGroupJoin = '';
    if (_.isEmpty(conditionItems) === false) {
      innerJoin = `
                    INNER JOIN user_tracking_app uta on uta.user_id = u.id`;

      innerNoGroupJoin = `
                    INNER JOIN subscription_purchase sp on sp.user_id = u.id and sp.is_current = 1
                    INNER JOIN user_tracking_app uta on uta.user_id = u.id`;
    }

    const queryString = `
                    SELECT COUNT(*) as total
                    FROM (
                    SELECT DISTINCT u.id
                    from users u
                    LEFT JOIN third_party_account sa on sa.user_id = u.id
                    LEFT JOIN subscription_purchase sp on sp.user_id = u.id and sp.is_current = 1
                    INNER JOIN group_user gu on gu.user_id = u.id or gu.username = u.username
                    INNER JOIN \`group\` g on g.id = gu.group_id
                    ${innerJoin}
                    INNER JOIN subscription sc on sc.id = sp.sub_id
                    WHERE 
                        g.id IN (${groupIds.join(',')})
                        ${condition ? `AND ${condition}` : ''}
                    UNION
                    SELECT DISTINCT u.id
                    FROM users u
                    LEFT JOIN third_party_account sa on sa.user_id = u.id
                    LEFT JOIN group_user gu on gu.user_id = u.id or gu.username = u.username 
                    LEFT JOIN \`group\` g on g.id = gu.group_id 
                    ${innerNoGroupJoin}
                    WHERE 
                        u.id NOT IN (SELECT user_id FROM group_user GROUP BY group_user.user_id)
                        ${conditionNoGroup ? `AND ${conditionNoGroup}` : ''}
                    ) AS count_users_with_no_groups
                `;
    return UserModel.sequelize
      .query(queryString, { type: UserModel.sequelize.QueryTypes.SELECT })
      .then((result) => (result ? result[0] : 0));
  },

  CountUsersWithoutNoGroups: async (groupIds, condition, request) => {
    const { query } = request;
    const conditionItems = _.pick(query, ['subscription_types', 'last_used_start', 'last_used_end']);
    let innerJoin = '';
    if (_.isEmpty(conditionItems) === false) {
      innerJoin = `
                    INNER JOIN subscription_purchase sp on sp.user_id = u.id and sp.is_current = 1
                    INNER JOIN user_tracking_app uta on uta.user_id = u.id`;
    }

    const queryString = `
                SELECT COUNT(*) as total
                FROM (
                SELECT DISTINCT u.id
                FROM user u
                LEFT JOIN third_party_account sa ON sa.user_id = u.id
                INNER JOIN group_user gu ON gu.user_id = u.id  or gu.username = u.username 
                INNER JOIN \`group\` g ON g.id = gu.group_id
                ${innerJoin}
                WHERE
                    g.id IN (${groupIds.join(',')})
                    ${condition ? `AND ${condition}` : ''}
                ) AS count_users_without_group
                `;
    return UserModel.sequelize
      .query(queryString, { type: UserModel.sequelize.QueryTypes.SELECT })
      .then((result) => (result ? result[0] : 0));
  },

  FilterHandle: (request, isNoGroup = false) => {
    const { query } = request;
    try {
      const conditionItems = _.pick(query, [
        'group_type',
        'keyword',
        'account_types',
        'subscription_types',
        'last_used_start',
        'last_used_end',
        'join_date_start',
        'join_date_end'
      ]);
      if (_.isEmpty(conditionItems) === true) {
        return '';
      }
      const result = [];

      if (_.isNumber(conditionItems.group_type) === true && isNoGroup === false) {
        result.push(`g.group_type = "${conditionItems.group_type}"`);
      }
      if (_.isEmpty(conditionItems.keyword) === false) {
        result.push(`((u.email LIKE '%${query.keyword}%' ) OR (sa.user_income LIKE '%${query.keyword}%' ))`);
      }
      if (_.isEmpty(conditionItems.account_types) === false) {
        const accountTypes = [];

        _.forEach(conditionItems.account_types.split(','), (item) => {
          const accountType = App.ACCOUNT_TYPE_MAP[item];
          if (_.isNumber(accountType) === true) {
            accountTypes.push(Number(item));
          }
          if (_.isArray(accountType) === true) {
            _.forEach(accountType, (accountTypeItem) => {
              accountTypes.push(Number(accountTypeItem));
            });
          }
        });

        if (_.isEmpty(accountTypes) === false) {
          result.push(`sa.account_type IN (${_.uniqBy(accountTypes).join(',')})`);
        }
      }
      if (_.isEmpty(conditionItems.subscription_types) === false) {
        const subscriptionTypes = [];
        _.forEach(conditionItems.subscription_types.split(','), (item) => {
          const subscriptionType = App.SUBSCRIPTION_TYPE_MAP[item];
          if (_.isNumber(subscriptionType) === true) {
            subscriptionTypes.push(subscriptionType.join('","'));
          }
          if (_.isArray(subscriptionType) === true) {
            _.forEach(subscriptionType, (subscriptionTypeItem) => {
              subscriptionTypes.push(subscriptionTypeItem);
            });
          }
        });

        if (_.isEmpty(subscriptionTypes) === false) {
          result.push(`sp.sub_id IN ("${_.uniqBy(subscriptionTypes).join('","')}")`);
        }
      }

      if (_.isNumber(conditionItems.join_date_start) === true && _.isNumber(conditionItems.join_date_end) === true) {
        if (conditionItems.join_date_start <= conditionItems.join_date_end) {
          result.push(`u.created_date BETWEEN ${conditionItems.join_date_start} AND ${conditionItems.join_date_end}`);
        }
      }

      if (_.isNumber(conditionItems.last_used_start) === true && _.isNumber(conditionItems.last_used_end) === true) {
        if (conditionItems.last_used_start <= conditionItems.last_used_end) {
          result.push(
            `uta.last_used_date BETWEEN ${conditionItems.last_used_start} AND ${conditionItems.last_used_end}`
          );
        }
      }

      return result.join(' AND ');
    } catch (error) {
      return [];
    }
  },

  SortHandle: (request) => {
    try {
      const { query } = request;
      const conditionItems = _.pick(query, ['sort']);

      if (_.isEmpty(conditionItems) === true) {
        return '';
      }
      const validSortField = [
        'id',
        'email',
        'groups',
        'join_date',
        'next_renewal',
        'last_used_date',
        'storage',
        'account_3rd',
        'subs_type'
      ];
      const order = Utils.HandlePureSort(query.sort, validSortField);
      return order.join(' , ');
    } catch (error) {
      return [];
    }
  },

  FilterGroupUsers: async (request) => {
    try {
      const condition = Private.FilterReleaseUsers(request);
      const conditionNoGroup = Private.FilterReleaseUsers(request, true);
      const data = await Private.FilterUsersWithNoGroups(condition, conditionNoGroup);
      return data;
    } catch (error) {
      return [];
    }
  },

  FilterUsersWithNoGroups: async (condition, conditionNoGroup) => {
    const selectQuery = `
                    SELECT DISTINCT u.email, u.id,
                    DATE(FROM_UNIXTIME(u.created_date)) as join_date,
                    u.fullname,
                    count(distinct sa.user_income) account_3rd,
                    if(q.username != '',q.bytes+q.cal_bytes+q.card_bytes+q.file_bytes+q.qa_bytes, 0) storage,
                    GROUP_CONCAT(DISTINCT g.name ORDER BY g.id ASC SEPARATOR '/') as groups,
                    GROUP_CONCAT(DISTINCT sa.user_income ORDER BY sa.id ASC SEPARATOR '\n') as account_3rd_emails,
                    CASE
                        WHEN sc.subs_type = 1 THEN 'Premium'
                        WHEN sc.subs_type = 2 THEN 'Pro'
                        ELSE 'Standard'
                    END as subs_type,
                    if(sp.sub_id != '', sp.sub_id, '') as sub_id,
                    CASE
                        WHEN sc.order_number = 1 OR sc.order_number = 3 THEN 'Yearly'
                        WHEN sc.order_number = 2 OR sc.order_number = 4 THEN 'Monthly'
                        ELSE ''
                    END as subs_time,
                    max(uta.last_used_date) as last_used_date,
                    if(sp.created_date != 0, DATE(FROM_UNIXTIME(sp.created_date)), 0) as subs_current_date,
                    if(sp.created_date != 0, DATE_ADD(DATE(FROM_UNIXTIME(sp.created_date)), INTERVAL sc.period DAY), 0) as next_renewal
                    `;
    const fromQuery = `
                    FROM user u
                    LEFT JOIN third_party_account sa on sa.user_id = u.id
                    LEFT JOIN quota q on q.username = u.username
                    LEFT JOIN subscription_purchase sp on sp.user_id = u.id and sp.is_current = 1
                    LEFT JOIN subscription sc on sc.id = sp.sub_id
                    LEFT JOIN user_tracking_app uta on uta.user_id = u.id
                    LEFT JOIN tracking_app ta on ta.id = uta.user_id
                    `;

    const queryString = `
                ${selectQuery}
                ${fromQuery}
                INNER JOIN group_user gu on gu.user_id = u.id or gu.username = u.username
                INNER JOIN \`group\` g on g.id = gu.group_id 
                WHERE ${condition ? `${condition}` : '1'}
                GROUP BY u.email
                UNION
                ${selectQuery}
                ${fromQuery}
                LEFT JOIN group_user gu on gu.user_id = u.id or gu.username = u.username
                LEFT JOIN \`group\` g on g.id = gu.group_id
                WHERE u.id NOT IN (SELECT user_id FROM group_user GROUP BY group_user.user_id)
                ${conditionNoGroup ? `AND ${conditionNoGroup}` : ''}
                GROUP BY u.email
                `;
    return UserModel.sequelize
      .query(queryString, { type: UserModel.sequelize.QueryTypes.SELECT })
      .then((result) => result || []);
  },

  FilterReleaseUsers: (request, isNoGroup = false) => {
    try {
      const { payload } = request;
      const conditionItems = _.pick(payload.filters, [
        'group_ids',
        'group_type',
        'keyword',
        'account_type',
        'subscription_type',
        'last_used_start',
        'last_used_end'
      ]);

      if (_.isEmpty(conditionItems) === true) {
        return '';
      }
      const result = [];
      if (_.isEmpty(conditionItems.group_ids) === false && isNoGroup === false) {
        const groupIds = _.map(conditionItems.group_ids.split(','), (item) => {
          return Number(item);
        });
        result.push(`g.id IN (${groupIds.join(',')})`);
      }

      if (_.isNumber(conditionItems.group_type) === true && isNoGroup === false) {
        result.push(`g.group_type = "${conditionItems.group_type}"`);
      }

      if (_.isEmpty(conditionItems.keyword) === false) {
        result.push(
          `((u.email LIKE '%${conditionItems.keyword}%' ) OR (sa.user_income LIKE '%${conditionItems.keyword}%' ))`
        );
      }

      if (_.isNumber(conditionItems.account_type) === true) {
        //
        const accountType = App.ACCOUNT_TYPE_MAP[conditionItems.account_type];
        if (_.isNumber(accountType) === true) {
          result.push(`sa.account_type  = ${accountType}`);
        } else if (_.isEmpty(accountType) === false) {
          result.push(`sa.account_type IN (${accountType.join(',')})`);
        }
      }
      if (_.isNumber(conditionItems.subscription_type) === true) {
        //
        const subscription = App.SUBSCRIPTION_TYPE_MAP[conditionItems.subscription_type];
        if (_.isEmpty(subscription) === false) {
          result.push(`sp.sub_id IN ("${subscription.join('","')}")`);
        }
      }

      if (_.isNumber(conditionItems.last_used_start) === true && _.isNumber(conditionItems.last_used_end) === true) {
        if (conditionItems.last_used_start <= conditionItems.last_used_end) {
          result.push(
            `uta.last_used_date BETWEEN ${conditionItems.last_used_start} AND ${conditionItems.last_used_end}`
          );
        }
      }
      return result.join(' AND ');
    } catch (error) {
      return [];
    }
  }
};

const GetGroupUsers = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissions) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }
  const allowSortItems = [
    'email',
    'fullname',
    'groups',
    'join_date',
    'next_renewal',
    'last_used_date',
    'storage',
    'account_3rd',
    'subs_type'
  ];

  const validateFields = NewPrivate.ValidateUserRequest(request, [], allowSortItems);
  if (validateFields.code === 0) {
    return h
      .response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: { message: [validateFields.message] }
      })
      .code(Code.INVALID_PAYLOAD_PARAMS);
  }

  const { totalRows, data } = await NewPrivate.GetGroupUsers(request);
  if (_.isEmpty(data) === true || data === false) {
    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: []
      })
      .code(Code.REQUEST_SUCCESS)
      .header('X-Total-Count', totalRows || 0);
  }

  const result = [];

  _.forEach(data, (item) => {
    const { subTime, subType } = detachSubscriptionInfo(item);
    let account3rdEmails = [];
    if (_.isEmpty(item.account_3rd_emails) === false) {
      if (IsJSON(item.account_3rd_emails) === true) {
        account3rdEmails = JSON.parse(item.account_3rd_emails);
      } else {
        account3rdEmails.push(item.account_3rd_emails);
      }
    }

    let additionInfo = '';
    let isDeleted = 0;
    if (_.isEmpty(item.addition_info) === false) {
      if (IsJSON(item.addition_info) === true) {
        additionInfo = JSON.parse(item.addition_info);
        isDeleted = _.get(additionInfo, 'userDeleted.progress', false) === 0 ? 1 : 0;
      }
    }

    const groupInfos = [];
    if (_.isEmpty(item.groups) === false) {
      if (IsJSON(item.groups) === true) {
        const groups = JSON.parse(item.groups);
        _.forEach(groups, (group) => {
          groupInfos.push(group.name);
        });
      } else {
        groupInfos.push(item.groups);
      }
    }

    let storages = 0;
    if (IsJSON(item.storage) === true) {
      const storageObj = JSON.parse(item.storage);
      storages = Number(_.get(storageObj, 'total', 0));
    }

    function mergePlatform(oldPlatform, platform) {
      if (_.isEmpty(oldPlatform)) {
        return platform;
      }
      if (_.isEmpty(platform)) {
        return oldPlatform;
      }
      const allPlatformId = [...new Set([
        ...oldPlatform, ...platform
      ].map((p) => p.app_reg_id))];
      return allPlatformId.map((id) => {
        const platformItem = platform.find((p) => p.app_reg_id === id);
        if (!_.isEmpty(platformItem)) {
          return platformItem;
        }
        return oldPlatform.find((p) => p.app_reg_id === id);
      });
    }

    const groups = !item.groups ? [] : item.groups.split(',˝');
    const mergedPlatform = mergePlatform(item.old_platform, item.platform);
    const groupNames = new Set(groups);
    const jsonGroups = [item.user_migrate_status === App.USER_MIGRATE_STATUS.IS_V32
      ? 'Not migrate' : 'Migrated', ...groupNames];
    if (item.flo_mac_update) {
      jsonGroups.unshift('FLM Updated');
    }
    result.push({
      id: item.id,
      email: item.email,
      role_id: item.role_id,
      role_name: item.role_name,
      role_value: item.role_value,
      fullname: _.get(additionInfo, 'fullname', ''),
      groups: jsonGroups.join(','),
      account_3rd: item.account_3rd,
      account_3rd_emails: _.isEmpty(account3rdEmails) === false ? account3rdEmails.join('\n') : '',
      join_date: item.join_date,
      last_used_date: item.last_used_date,
      next_renewal: item.next_renewal,
      storage: storages,
      sub_id: item.sub_id,
      disabled: item.disabled,
      deleted: isDeleted,
      subs_current_date: item.subs_current_date,
      subs_time: subTime,
      subs_type: subType,
      user_migrate_status: item.user_migrate_status ?? App.USER_MIGRATE_STATUS.IS_V4,
      platform: mergedPlatform,
      flo_mac_update: item.flo_mac_update || 0
    });
  });

  return h
    .response({
      code: Code.REQUEST_SUCCESS,
      data: result
    })
    .code(Code.REQUEST_SUCCESS)
    .header('X-Total-Count', totalRows);
};

const GetGroupUser = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissions) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }

  const { params } = request;
  const groupUsers = await NewPrivate.GetGroupUsers(request, [params.group_id]);
  const { totalRows, data } = groupUsers;
  if (_.isEmpty(groupUsers) === true || groupUsers === false) {
    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: []
      })
      .code(Code.REQUEST_SUCCESS)
      .header('X-Total-Count', totalRows || 0);
  }
  const result = [];
  _.forEach(data, (item) => {
    let storage = 0;

    if (IsJSON(item.storage) === true) {
      const storageObj = JSON.parse(item.storage);
      storage = Number(_.get(storageObj, 'total', 0));
    }

    const { subTime, subType } = detachSubscriptionInfo(item);
    result.push({
      id: item.id,
      fullname: item.fullname,
      email: item.email,
      groups: item.groups,
      account_3rd: item.account_3rd,
      account_3rd_emails: _.isEmpty(item.account_3rd_emails) === true ? "" : item.account_3rd_emails,
      join_date: item.join_date,
      last_used_date: item.last_used_date,
      next_renewal: item.next_renewal,
      storage,
      sub_id: item.sub_id,
      subs_current_date: item.subs_current_date,
      disabled: item.disabled,
      deleted: item.progress === 0 ? 1 : 0,
      subs_time: subTime,
      subs_type: subType
    });
  });
  return h
    .response({
      code: Code.REQUEST_SUCCESS,
      data: result
    })
    .code(Code.REQUEST_SUCCESS)
    .header('X-Total-Count', totalRows);
};

const removeExternalOnAddAndVersa = async (groupUsers) => {
  try {
    if (!groupUsers?.length) { return 0; }
    groupUsers.forEach(async (gg) => {
      const thisGroup = await GroupsModel.findOne({
        attributes: ['group_type'],
        where: {
          id: gg.group_id
        },
        raw: true
      });
      const isInternal = thisGroup.group_type === '2';
      const groupTypesToExclude = isInternal ? ['1', '0'] : ['2'];
      const allGroupUser = await GroupsModel.findAll({
        attributes: ['id', 'group_type'],
        include: [
          {
            model: GroupUserModel,
            as: "GroupUser",
            attributes: ['id', 'user_id'],
            where: {
              user_id: gg.user_id
            }
          }
        ],
        where: {
          group_type: {
            [Sequelize.Op.in]: groupTypesToExclude
          }
        },
        raw: true
      });
      if (!allGroupUser?.length) { return 0; }
      allGroupUser.forEach(async (gu) => {
        await GroupUserModel.destroy({
          where: {
            id: gu['GroupUser.id']
          }
        });
      });
    });
  } catch (error) {
    return -1;
  }
};

const CreateGroupUser = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissions) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }

  const { payload } = request;
  /**
   * Check valid param
   * */

  let users = [];
  users = await ReportCachedUsersModel.findAll({
    where: {
      email: payload.emails
    },
    raw: true
  });

  if (_.isEmpty(users) === true) {
    return h
      .response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Invalid emails']
        }
      })
      .code(Code.INVALID_PAYLOAD_PARAMS);
  }

  const groups = await GroupsModel.findAll({
    attributes: ['id', 'name', 'description', 'group_type', 'created_date', 'updated_date'],
    where: {
      id: payload.group_ids
    },
    raw: true
  });

  if (_.isEmpty(groups) === true) {
    if (payload.group_ids.indexOf(-1) >= 0) {
      return h.response({ code: Code.CREATE_SUCCESS }).code(Code.CREATE_SUCCESS);
    }
    return h
      .response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: { message: ['Invalid groups'] }
      })
      .code(Code.INVALID_PAYLOAD_PARAMS);
  }

  const targetGroupUsers = [];
  _.forEach(groups, (group) => {
    _.forEach(users, (user) => {
      targetGroupUsers.push({
        user_id: user.user_id,
        username: user.email,
        group_id: group.id,
        group_name: group.name
      });
    });
  });

  /**
   * Check exist group-user
   * Add new group-user only
   * */
  const groupUsers = await GroupUserModel.findAll({
    where: { [Sequelize.Op.or]: targetGroupUsers },
    raw: true
  });
  const insertArgs = [];
  _.forEach(targetGroupUsers, (item) => {
    const groupUser = _.find(groupUsers, {
      user_id: item.user_id,
      group_id: item.group_id
    });
    if (_.isEmpty(groupUser) === true) {
      const currentTimestamp = Utils.Timestamp();
      insertArgs.push({
        user_id: item.user_id,
        group_id: item.group_id,
        username: item.username,
        group_name: item.group_name,
        created_date: currentTimestamp,
        updated_date: currentTimestamp
      });
    }
  });
  // insert group user
  if (_.isEmpty(insertArgs) === false) {
    const res = await GroupUserModel.bulkCreate(insertArgs);
    if (res) {
      await removeExternalOnAddAndVersa(insertArgs);
    }
  }
  // get all report_cached_user
  const reports = await ReportCachedUsersModel.findAll({
    attributes: ['id', 'groups'],
    where: {
      email: targetGroupUsers.map((item) => item.username)
    }
  });

  // re init report_cached_user.groups
  await Promise.all(reports.map((rcu) => {
    let oldGroups;
    try {
      oldGroups = !rcu.groups ? [] : JSON.parse(rcu.groups);
    } catch (e) {
      oldGroups = [];
    }
    const oldGroupId = oldGroups.map((g) => g.id);
    const newGroups = groups.filter((gr) => !oldGroupId.includes(gr.id));
    const reportGroups = [...oldGroups, ...newGroups];
    return ReportCachedUsersModel.update({
      groups: JSON.stringify(reportGroups)
    }, {
      where: { id: rcu.id }
    });
  }));
  return h.response({ code: Code.CREATE_SUCCESS }).code(Code.CREATE_SUCCESS);
};

async function clearReportCachedUser(groupId, userIds) {
  // all cached
  const reports = await ReportCachedUsersModel.findAll({
    attributes: ['id', 'groups'],
    where: { user_id: userIds },
    raw: true
  });
  // loop to remove target group from report
  reports.forEach(async (report) => {
    let groupsCached = [];
    try {
      groupsCached = !report.groups ? [] : JSON.parse(report.groups);
    } catch (error) {
      groupsCached = [];
    }
    // skip empty cached groups
    if (groupsCached.length === 0) {
      return;
    }
    const reportGroups = groupsCached.filter((gr) => gr.id !== groupId);
    await ReportCachedUsersModel.update({ groups: JSON.stringify(reportGroups) }, { where: { id: report.id } });
  });
}

const DeleteGroupUser = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissions) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }

  const { payload, params } = request;

  /**
   * Check valid param
   * */
  if (params.group_id === -1) {
    return h.response({ code: Code.REQUEST_SUCCESS }).code(Code.REQUEST_SUCCESS);
  }

  const group = await GroupsModel.findOne({
    attributes: ['id', 'name', 'description', 'group_type', 'created_date', 'updated_date'],
    where: {
      id: params.group_id
    },
    raw: true
  });

  if (_.isEmpty(group) === true) {
    return h
      .response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: { message: ['Invalid groups'] }
      })
      .code(Code.INVALID_PAYLOAD_PARAMS);
  }

  const users = await UserModel.findAll({
    where: { email: payload.emails },
    raw: true
  });
  if (_.isEmpty(users) === true) {
    return h
      .response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: { message: ['Invalid emails'] }
      })
      .code(Code.INVALID_PAYLOAD_PARAMS);
  }

  const userIds = [];
  const targetGroupUsers = [];
  _.forEach(users, (user) => {
    const item = {
      user_id: user.id,
      group_id: group.id
    };
    targetGroupUsers.push(item);
    userIds.push(user.id);
  });

  /**
   * Check exist group-user
   * Add new group-user only
   * */

  const groupUsers = await GroupUserModel.findAll({
    where: {
      group_id: group.id,
      user_id: { [Sequelize.Op.in]: userIds }
    },
    raw: true
  });

  const deleteArgs = [];
  _.forEach(targetGroupUsers, (item) => {
    const groupUser = _.find(groupUsers, {
      user_id: item.user_id,
      group_id: item.group_id
    });
    if (_.isEmpty(groupUser) === false) {
      deleteArgs.push(groupUser.id);
    }
  });

  if (_.isEmpty(deleteArgs) === false) {
    await GroupUserModel.destroy({
      where: {
        id: { [Sequelize.Op.in]: deleteArgs }
      }
    });
  }

  await clearReportCachedUser(params.group_id, userIds);

  return h.response({}).code(Code.NO_CONTENT);
};

const ExportGroupUsers = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissions) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }
  const { query } = request;
  const { fields } = query;

  const allowFields = [
    'fullname',
    'email',
    'account_3rd',
    'account_3rd_emails',
    'storage',
    'groups',
    'sub_id',
    'subs_type',
    'subs_time',
    'last_used_date',
    'subs_current_date',
    'user_migrate_status',
    'join_date',
    'next_renewal',
    'disabled',
    'deleted'
  ];

  const defaultFields = ['fullname', 'email', 'account_3rd_emails'];

  const allowSortItems = [
    'email',
    'fullname',
    'groups',
    'join_date',
    'next_renewal',
    'last_used_date',
    'storage',
    'account_3rd',
    'subs_type'
  ];

  const validateFields = NewPrivate.ValidateUserRequest(request, allowFields, allowSortItems);
  if (validateFields.code === 0) {
    return h
      .response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: { message: [validateFields.message] }
      })
      .code(Code.INVALID_PAYLOAD_PARAMS);
  }

  const fieldsArr = fields ? fields.split(',').map((item) => item.trim()) : [];
  const selectedFields = _.isEmpty(fieldsArr) === false ? _.intersection(fieldsArr, allowFields) : defaultFields;
  const { totalRows, data } = await NewPrivate.GetGroupUsers(request);

  if (_.isEmpty(data) === true || data === false) {
    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: []
      })
      .code(Code.REQUEST_SUCCESS)
      .header('X-Total-Count', totalRows || 0);
  }

  const result = [];
  _.forEach(data, (item) => {
    const { subTime, subType } = detachSubscriptionInfo(item);

    let account3rdEmails = [];
    if (_.isEmpty(item.account_3rd_emails) === false) {
      if (IsJSON(item.account_3rd_emails) === true) {
        account3rdEmails = JSON.parse(item.account_3rd_emails);
      } else {
        account3rdEmails.push(item.account_3rd_emails);
      }
    }

    let additionInfo = '';
    let isDeleted = 0;
    if (_.isEmpty(item.addition_info) === false) {
      if (IsJSON(item.addition_info) === true) {
        additionInfo = JSON.parse(item.addition_info);
        isDeleted = _.get(additionInfo, 'userDeleted.progress', false) === 0 ? 1 : 0;
      }
    }

    const groupInfos = [];
    if (_.isEmpty(item.groups) === false) {
      if (IsJSON(item.groups) === true) {
        const groups = JSON.parse(item.groups);
        _.forEach(groups, (group) => {
          groupInfos.push(group.name);
        });
      } else {
        groupInfos.push(item.groups);
      }
    }

    let storages = 0;
    if (IsJSON(item.storage) === true) {
      const storageObj = JSON.parse(item.storage);
      storages = Number(_.get(storageObj, 'total', 0));
    }

    let nextRenewal = 0;
    const subscriptions = _.get(item, 'subscriptionPurchase', false);
    if (_.isEmpty(subscriptions) === false) {
      _.forEach(subscriptions, (subscription) => {
        if (subscription.is_current === 1) {
          const subscriptionCreatedDate = _.get(subscription, 'created_date', 0);
          if (subscription.sub_id.indexOf('yearly') !== -1 && subscriptionCreatedDate > 0) {
            const dateString = Moment.unix(subscriptionCreatedDate);
            const newDate = Moment(dateString, 'DD-MM-YYYY hh:mm:ss.SSS').add(365, 'days');
            nextRenewal = Moment(newDate).unix().valueOf();
          }
          if (subscription.sub_id.indexOf('monthly') !== -1 && subscriptionCreatedDate > 0) {
            const dateString = Moment.unix(subscriptionCreatedDate);
            const newDate = Moment(dateString, 'DD-MM-YYYY hh:mm:ss.SSS').add(30, 'days');
            nextRenewal = Moment(newDate).unix().valueOf();
          }
        }
      });
    }

    const groupsUsers = _.get(item, 'groupsUsers', false);
    const groupNames = [];
    if (_.isEmpty(groupsUsers) === false) {
      _.forEach(groupsUsers, (groupsUser) => {
        _.forEach(groupsUser, (group) => {
          const groupName = _.get(group, 'name', false);
          if (_.isEmpty(groupName) === false && _.isString(groupName) === true) {
            groupNames.push(groupName);
          }
        });
      });
    }

    result.push(
      _.pick(
        {
          id: item.id,
          email: item.email,
          fullname: _.get(additionInfo, 'fullname', ''),
          groups: groupNames.length === 0 ? '' : groupNames.join(','),
          account_3rd: item.account_3rd,
          account_3rd_emails: _.isEmpty(account3rdEmails) === false ? account3rdEmails.join(' ; ') : '',
          join_date: _.isNumber(item.join_date) === true ? Moment(item.join_date * 1000).format('YYYY-MM-DD') : null,
          last_used_date:
            _.isNumber(item.last_used_date) === true ? Moment(item.last_used_date * 1000).format('YYYY-MM-DD') : null,
          next_renewal: nextRenewal > 0 ? Moment(nextRenewal * 1000).format('YYYY-MM-DD') : null,
          storage: storages,
          sub_id: item.sub_id,
          disabled: item.disabled,
          deleted: isDeleted,
          subs_current_date: item.subs_current_date,
          subs_time: subTime,
          user_migrate_status: item.user_migrate_status ?? App.USER_MIGRATE_STATUS.IS_V4,
          subs_type: subType
        },
        selectedFields
      )
    );
  });

  const filename = `flo_user_${Moment().format('DDMMYY_HHMM')}`;
  const file = Utils.JSONToCSVStream(result, true);

  return h
    .response(file)
    .header('Cache-Control', 'no-cache')
    .header('Content-Type', 'text/csv')
    .header('Content-Disposition', `attachment; filename=${filename}.csv`);
};

const detachSubscriptionInfo = (item) => {
  let subType = 'Standard';
  switch (item.subs_type) {
    case 1:
      subType = 'Premium';
      break;
    case 2:
      subType = 'Pro';
      break;
    default:
      break;
  }

  let subTime = '';
  switch (item.order_number) {
    case 1:
      subTime = 'Yearly';
      break;
    case 3:
      subTime = 'Yearly';
      break;
    case 2:
      subTime = 'Monthly';
      break;
    case 4:
      subTime = 'Monthly';
      break;
    default:
      break;
  }
  return { subTime, subType };
}
module.exports = {
  GetGroupUser,
  GetGroupUsers,
  CreateGroupUser,
  DeleteGroupUser,
  ExportGroupUsers
};
