class Admin < ApplicationRecord
  self.table_name = "admin"
  self.primary_key = "id"

  class << self
    #string count 3rd account
    def count_3rd_str
      sql = "
        (
          select
            count(if(sa.account_type=5,sa.account_type, null)) as icloud,
            count(if(sa.account_type=1,sa.account_type, null)) as google,
            count(if(sa.account_type=2,sa.account_type, null)) as yahoo,
            count(if(sa.account_type=3,sa.account_type, null)) as other_3rd
          from set_accounts sa
        ) as sa
      "
      return sql
    end

    #string count subscription
    def count_subs_str
      sql = "
        (
          select
            (select count(*) as pro from (
                select u.email, sp.subID
                from users u
                left join subscription_purchase sp on sp.user_id = u.id
                left join subscriptions sc on sc.id = sp.subID
                where sc.subs_type = 2 and sp.is_current=1
                group by u.id
                ) as s) as pro,
            (select count(*) as pre from (
                select u.email, sp.subID
                from users u
                left join subscription_purchase sp on sp.user_id = u.id
                left join subscriptions sc on sc.id = sp.subID
                where sc.subs_type = 1 and sp.is_current=1
                group by u.id
                ) as s) as pre
        ) as su
      "
      return sql
    end

    #string count total users
    def count_users
      sql = "
        (
          select count(*) as users from users where 1
        ) as u
      "
      return sql
    end

    #string query dashboard
    def dashboard
      sql = " select u.*, sa.*, su.*, (u.users - su.pro - su.pre) as standard FROM "
      sql << Admin.count_users()
      sql << ","
      sql << Admin.count_3rd_str()
      sql << ","
      sql << Admin.count_subs_str()

      # puts sql

      find_by_sql(sql)
    end

    # rubocop:disable Metrics/ParameterLists
    def get_users(group_ids, pItem = 50, pNumber = 1,  search_keyword = '', criteria = '', asc = 'true')
      sql = query_get_users(search_keyword, group_ids)

      order_str = 'order by '
      if criteria.present?
        order_str += criteria

        if !asc.eql?('true')
          order_str += ' DESC'
        end
      else
        order_str += 'u.created_date DESC'
      end

      sql += order_str + ", id DESC"

      #add paging
      pNumber = 1 if pNumber.to_i == 0
      sql << " LIMIT "
      sql << ((pNumber.to_i * pItem.to_i) - pItem.to_i).to_s
      sql << ","
      sql << (pItem.to_i).to_s

      find_by_sql(sql)
    end
    # rubocop:enable Metrics/ParameterLists

    def users_without_paging(group_ids, search_keyword)
      sql = query_get_users(search_keyword, group_ids)
      find_by_sql(sql)
    end

    def count_total_users(group_ids, search_keyword = '')
      condition = ' '
      sql = ''

      unless search_keyword.strip.empty?
        condition = " AND ((u.email LIKE '%" + search_keyword.to_s + "%' ) OR (sa.user_income LIKE '%" + search_keyword.to_s + "%' )) "
      end

      if group_ids.size == 1 and group_ids.include? "-1"
        sql = count_users_of_no_group(condition)
      elsif group_ids.size > 1 and group_ids.include? "-1" # show all users not in any groups and users of groups selected
        sql = count_users_with_no_groups(group_ids, condition)
      else
        sql = count_users_without_no_groups(group_ids, condition)
      end

      find_by_sql sql
    end

    def count_users_with_no_groups(group_ids, condition)
      "
        SELECT COUNT(*) as total
        FROM (
          SELECT DISTINCT u.id
          from users u
          left join set_accounts sa on sa.user_id = u.id
          INNER JOIN groups_users gu on gu.user_id = u.id
          INNER JOIN groups g on g.id = gu.group_id
          WHERE g.id IN ( " + group_ids * "," + " )
          " + condition + "

          UNION

          SELECT DISTINCT u.id
          FROM users u
          LEFT JOIN set_accounts sa on sa.user_id = u.id
          LEFT JOIN groups_users gu on gu.user_id = u.id
          LEFT JOIN groups g on g.id = gu.group_id
          WHERE u.id NOT IN (SELECT user_id FROM groups_users GROUP BY groups_users.user_id)
          " + condition + "
        ) AS count_users_with_no_groups
      "
    end

    def count_users_without_no_groups(group_ids, condition)
      "
        SELECT COUNT(*) as total
        FROM (
          SELECT DISTINCT u.id
          from users u
          left join set_accounts sa on sa.user_id = u.id
          INNER JOIN groups_users gu on gu.user_id = u.id
          INNER JOIN groups g on g.id = gu.group_id
          WHERE g.id IN ( " + group_ids * "," + " )
          " + condition + "
        ) AS count_users_without_group
      "
    end

    def count_users_of_no_group(condition)
      "
          SELECT COUNT(*) as total
          FROM (
                  SELECT DISTINCT u.id
                  FROM users u
                  LEFT JOIN set_accounts sa on sa.user_id = u.id
                  WHERE u.id NOT IN (SELECT user_id FROM groups_users GROUP BY groups_users.user_id)
                  " + condition + "
          ) as count_users_no_group
      "
    end

  #get users by paging
    def get_ordered_users(pItem = 50, pNumber = 1,  criteria = '', asc = 'true')
      condition = "1"
      #add condition for search feature
      sql = "
        select u.email, u.id,
          DATE(FROM_UNIXTIME(u.created_date)) as join_date,
          u.fullname,
          count(if(sa.user_id=u.id,sa.user_id, null)) account_3rd,
          if(q.username != '',q.bytes+q.cal_bytes+q.card_bytes+q.file_bytes, 0) storage,
          CASE
            WHEN sc.subs_type = 1 THEN 'Premium'
            WHEN sc.subs_type = 2 THEN 'Pro'
            ELSE 'Standard'
          END as subs_type,
          if(sp.subID != '', sp.subID, '') as subID,
          CASE
            WHEN sc.order_number = 1 OR sc.order_number = 3 THEN 'Yearly'
            WHEN sc.order_number = 2 OR sc.order_number = 4 THEN 'Monthly'
            ELSE ''
          END as subs_time,
          if(sp.created_date != 0, DATE(FROM_UNIXTIME(sp.created_date)), 0) as subs_current_date,
          if(sp.created_date != 0, DATE_ADD(DATE(FROM_UNIXTIME(sp.created_date)), INTERVAL sc.period DAY), 0) as next_renewal

        from users u

        left join set_accounts sa on sa.user_id = u.id
        left join quota q on q.username = u.email
        left join subscription_purchase sp on sp.user_id = u.id and sp.is_current = 1
        left join subscriptions sc on sc.id = sp.subID

        where " + condition.to_s + "
        group by u.id
      "

      order_str = 'order by '
      if criteria && criteria.eql?('email')
        order_str += 'u.email'
      else
        order_str += criteria
      end

      if !asc.eql?('true')
        order_str += ' DESC'
      end

      sql += order_str

      #add paging
      pNumber = 1 if pNumber.to_i == 0
      sql << " LIMIT "
      sql << ((pNumber.to_i * pItem.to_i) - pItem.to_i).to_s
      sql << ","
      sql << (pItem.to_i).to_s

      find_by_sql(sql)
    end

    #get user to reset subscription
    def get_users_for_subs
      sql = "
        select u.email,
          u.id,
          DATE(FROM_UNIXTIME(u.created_date)) as join_date,
          u.fullname,
          count(if(sa.user_id=u.id,sa.user_id, null)) account_3rd,
          if(q.username != '',q.bytes+q.cal_bytes+q.card_bytes+q.file_bytes, 0) storage,
          if(sp.is_current = 1, sc.name, 'Standard') as subs_type,
          if(sp.is_current = 1, sp.subID, '') as subID,
          if(ui.email !='', 1, 0) as is_user_internal

        from users u

        left join set_accounts sa on sa.user_id = u.id
        left join quota q on q.username = u.email
        left join subscription_purchase sp on sp.user_id = u.id
        left join subscriptions sc on sc.id = sp.subID
        left join users_internal ui on ui.email = u.email

        where ISNULL(sp.is_current)
        group by u.id
        order by u.created_date DESC
      "

      find_by_sql(sql)
    end

    #insert pre and pro for user
    def auto_upgrade_account(obj)
      sp = SubPurchase.new()
      sp.user_id = obj.id
      sp.subID = obj.subID
      sp.created_date = Time.now.to_i
      sp.is_current = 1
      sp.purchase_status = 1
      sp.save
    end

    private

    def query_get_users(search_keyword, group_ids)
      sql = " "
      condition = " "

      #add condition for search feature
      if (search_keyword.to_s.strip.length > 0)
        condition = " AND ((u.email LIKE '%" + search_keyword.to_s + "%' ) OR (sa.user_income LIKE '%"+ search_keyword.to_s + "%' )) "
      end

      # if nil return empty
      # if == -1 return NO_GROUPS
      # else return IN groups_ids + UNION NO_GROUPS
      if group_ids.size == 1 and group_ids.include? "-1"
        sql = get_users_of_no_groups(condition)
      elsif group_ids.size > 1 and group_ids.include? "-1"
        sql = get_users_with_no_groups(group_ids, condition)
      else
        sql = get_users_without_no_groups(group_ids, condition)
      end

      sql
    end

    def get_users_of_no_groups(condition)
      query = select_clause_get_users
      query << from_clause_get_users
      query <<
        "
          LEFT JOIN groups_users gu on gu.user_id = u.id
          LEFT JOIN groups g on g.id = gu.group_id

          WHERE u.id NOT IN (SELECT user_id FROM groups_users GROUP BY groups_users.user_id)
          " + condition + "
          GROUP BY u.email
        "
    end

    def get_users_with_no_groups(group_ids, condition)
      # select all users of any groups
      query = select_clause_get_users
      query << from_clause_get_users
      query <<
        "
          INNER JOIN groups_users gu on gu.user_id = u.id
          INNER JOIN groups g on g.id = gu.group_id
          WHERE g.id IN ( " + group_ids * "," + " )
          " + condition + "
          GROUP BY u.email
        "

      # union with all users of no groups
      query << " UNION "
      query << select_clause_get_users
      query << from_clause_get_users
      query <<
        "
          LEFT JOIN groups_users gu on gu.user_id = u.id
          LEFT JOIN groups g on g.id = gu.group_id
          WHERE u.id NOT IN (SELECT user_id FROM groups_users GROUP BY groups_users.user_id)
          " + condition + "
          GROUP BY u.email

        "
    end

    def get_users_without_no_groups(group_ids, condition)
      query = select_clause_get_users
      query << from_clause_get_users
      query <<
        "
          INNER JOIN groups_users gu on gu.user_id = u.id
          INNER JOIN groups g on g.id = gu.group_id

          WHERE g.id IN ( " + group_ids * "," + " )
          " + condition + "
          GROUP BY u.email
        "
    end

    def select_clause_get_users
      "
        select DISTINCT u.email, u.id,
          DATE(FROM_UNIXTIME(u.created_date)) as join_date,
          u.fullname,
          count(distinct sa.user_income) account_3rd,
          if(q.username != '',q.bytes+q.cal_bytes+q.card_bytes+q.file_bytes, 0) storage,

          GROUP_CONCAT(DISTINCT g.name ORDER BY g.id ASC SEPARATOR '/') as groups,
          GROUP_CONCAT(DISTINCT sa.user_income ORDER BY sa.id ASC SEPARATOR '\n') as account_3rd_emails,

          CASE
            WHEN sc.subs_type = 1 THEN 'Premium'
            WHEN sc.subs_type = 2 THEN 'Pro'
            ELSE 'Standard'
          END as subs_type,
          if(sp.subID != '', sp.subID, '') as subID,
          CASE
            WHEN sc.order_number = 1 OR sc.order_number = 3 THEN 'Yearly'
            WHEN sc.order_number = 2 OR sc.order_number = 4 THEN 'Monthly'
            ELSE ''
          END as subs_time,
          max(uta.last_used_date) as last_used_date,

          if(sp.created_date != 0, DATE(FROM_UNIXTIME(sp.created_date)), 0) as subs_current_date,
          if(sp.created_date != 0, DATE_ADD(DATE(FROM_UNIXTIME(sp.created_date)), INTERVAL sc.period DAY), 0) as next_renewal
      "
    end

    def from_clause_get_users
      "
        FROM users u

        LEFT JOIN set_accounts sa on sa.user_id = u.id
        LEFT JOIN quota q on q.username = u.email
        LEFT JOIN subscription_purchase sp on sp.user_id = u.id and sp.is_current = 1
        LEFT JOIN subscriptions sc on sc.id = sp.subID

        LEFT JOIN users_tracking_apps uta on uta.user_id = u.id
        LEFT JOIN tracking_apps ta on ta.id = uta.user_id
      "
    end
  end
end
