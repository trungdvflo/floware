/* eslint-disable no-useless-catch */
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const Code = require('../constants/ResponseCodeConstant');
const UsersModel = require('../models/UserModel');

const Count3rdStr = `(
select
    count(if(sa.account_type=5,sa.account_type, null)) as icloud,
    count(if(sa.account_type=1,sa.account_type, null)) as google,
    count(if(sa.account_type=2,sa.account_type, null)) as yahoo,
    count(if(sa.account_type=3,sa.account_type, null)) as other_3rd
    from third_party_account sa
) as sa`;

const CountSubsStr = `(
select
    (select count(*) as pro from (
        select u.email, sp.sub_id
        from report_cached_user u
        left join subscription_purchase sp on sp.user_id = u.user_id
        left join subscription sc on sc.id = sp.sub_id
        where sc.subs_type = 2 and sp.is_current=1
        and u.disabled = 0
        and u.deleted = 0 
        and u.addition_info NOT LIKE '%"userDeleted"%'
        group by u.user_id
        ) as s) as pro,
    (select count(*) as pre from (
        select u.email, sp.sub_id
        from report_cached_user u
        left join subscription_purchase sp on sp.user_id = u.user_id
        left join subscription sc on sc.id = sp.sub_id
        where sc.subs_type = 1 and sp.is_current=1
        and u.disabled = 0
        and u.deleted = 0 
        and u.addition_info NOT LIKE '%"userDeleted"%'
        group by u.user_id
        ) as s) as pre
) as su`;
// user `report cached user` instead of `user` to cover db 3.2 & 4.0
const CountUsers = `(select count(*) as users 
                       from report_cached_user 
                      where disabled = 0 
                        and deleted = 0
                        and addition_info NOT LIKE '%"userDeleted"%'
                      ) as u`;

module.exports.Dashboard = async (request, h) => {
  try {
    const query = `select u.*, sa.*, su.*, (u.users - su.pro - su.pre) as standard FROM ${CountUsers},${Count3rdStr},${CountSubsStr}`;
    const dashboard = await UsersModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
      raw: true
    });

    const data = {
      google: _.get(dashboard, '[0].google', 0),
      yahoo: _.get(dashboard, '[0].yahoo', 0),
      icloud: _.get(dashboard, '[0].icloud', 0),
      other_3rd: _.get(dashboard, '[0].other_3rd', 0),
      pre: _.get(dashboard, '[0].pre', 0),
      pro: _.get(dashboard, '[0].pro', 0),
      standard: _.get(dashboard, '[0].standard', 0),
      users: _.get(dashboard, '[0].users', 0)
    };

    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data
      })
      .code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};
