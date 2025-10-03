class Group < ApplicationRecord
  # default_scope order('name')

  before_create :set_create_time
  before_update :set_update_time

  has_many :groups_users, dependent: :delete_all
  has_many :users, through: :groups_users

  validates :name, presence: true, uniqueness: { case_sensitive: false }

  def self.get_groups(pNumber, pItem)
    # count users belong to "no group"
    sql_no_group = '( SELECT "-1" AS id, 
                      "'+MSG_NO_GROUP_TXT.to_s+'" AS name, 
                      count(*) AS number_users, 
                      "'+MSG_ADMIN_NO_GROUP.to_s+'" AS description 
                    FROM users AS u 
                    WHERE u.id NOT IN (SELECT gu.user_id FROM groups_users AS gu GROUP BY gu.user_id)

                    )'
    # union sql
    sql_union = ' UNION '
    # apply paging
    sql_paging = ''
    if (pItem.to_i != 0) and (pNumber.to_i != 0)
      sql_paging << " LIMIT "
      sql_paging << ((pNumber.to_i * pItem.to_i) - pItem.to_i).to_s
      sql_paging << ","
      sql_paging << pItem.to_i.to_s
    end
    # count users belong to groups 
    sql_group = '(
                SELECT groups.id, name, count(groups_users.user_id) as number_users, description 
                FROM `groups` 
                LEFT JOIN groups_users on groups_users.group_id = groups.id 
                GROUP BY groups.id 
                ORDER BY name' 
    sql_group << sql_paging.to_s
    sql_group << ')'
    # generate sql
    sql = ""
    if pNumber.to_i <= 1 #count users belong to [no group]
      sql << sql_no_group
      sql << sql_union
    end  
    sql << sql_group
    # execute sql 
    groups = Group.find_by_sql(sql)
    return groups
  end

  private

  def set_create_time
    self.created_date = Time.zone.now.to_i
    self.updated_date = Time.zone.now.to_i
  end

  def set_update_time
    self.updated_date = Time.zone.now.to_i
  end
end
