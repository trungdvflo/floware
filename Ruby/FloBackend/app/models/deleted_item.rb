class DeletedItem < ApplicationRecord
  include CommonScopes
  self.table_name = "deleted_items"
  self.primary_key = "id"

  before_create :set_create_time
  before_update :set_update_time

  scope :with_modifiedGTE, lambda { |date|
    where('updated_date >= ?', date) if date.present?
  }

  scope :with_modifiedLT, lambda { |date|
    where('updated_date < ?', date) if date.present?
  }

  scope :with_ids, lambda { |ids|
    where(item_id: ids.split(',')) if ids.present?
  }

  validates :item_type, inclusion: { in: ['VEVENT', 'VTODO',
                                          'VJOURNAL', 'VCALENDAR', 'FOLDER', 'LINK', 'URL',
                                          'TRACK', 'FILE', 'TRASH', 'KANBAN', 'EMAIL', 'CANVAS',
                                          'HISTORY', 'VCARD', 'ORDER_OBJ', 'SET_3RD_ACC',
                                          'SUGGESTED_COLLECTION', 'CSFILE'] }

  validates :is_recovery, numericality: { only_integer: true }, inclusion: { in: [0, 1] }

  def self.find_or_create_by(attributes)
    attributes.each do |attr|
      created_item = where(item_id: attr.item_id, item_type: attr.item_type, user_id: attr.user_id).first || attr

      created_item.is_recovery = attr.is_recovery
      created_item.save
    end
  end

  def self.save_deleted_item(user_id, links)
    #add link to deleted item
    delLnks = []
    if links and links.length > 0
      links.each do |link|
        delLnks.push({
            item_type: API_LINK.to_s,
            user_id: user_id,
            item_id: link.id
          })
      end
    end
    DeletedItem.create(delLnks) if delLnks.present?
  end

  def self.get_items_by_sync_token(user_id, syncToken)
    where('user_id = ? AND sync_token >= ?', user_id, syncToken)
  end

  # rubocop:disable Metrics/ParameterLists
  def self.get_del_items(user_id, i_type, mod_gte, mod_lt, ids, min_del_id, p_item)
    sql = "user_id = :user_id"
    conditions = {:user_id => user_id}
    objs = []
    if i_type
      sql << ' AND item_type = :item_type'
      conditions[:item_type] = i_type
    end
    if mod_gte #get data - greater than or equal
      sql << ' AND updated_date >= :mod_gte'
      conditions[:mod_gte] = mod_gte.to_f
    end
    if mod_lt #get data before - less than
      sql << ' AND updated_date < :mod_lt'
      conditions[:mod_lt] = mod_lt.to_f
    end
    if ids and ids.length > 0
      sql << ' AND item_id IN(:ids)'
      conditions[:ids] = ids.split(',')
    end

    if min_del_id.to_i > 0
      sql << ' AND id > :min_del_id'
      conditions[:min_del_id] = min_del_id.to_i
    end

    if p_item.to_i > 0
      objs = DeletedItem.where([sql, conditions]).limit(p_item.to_i)
    else
      objs = DeletedItem.where([sql, conditions])
    end

    if min_del_id.nil?
      objs = objs.order('updated_date asc')
    else
      objs = objs.order('id asc')
    end
    objs
  end

  def self.del_items(del_params)
    order(:updated_date).where(user_id: del_params[:user_id], item_type: del_params[:item_type])
                        .with_modifiedGTE(del_params[:modifiedGTE])
                        .with_modifiedLT(del_params[:modifiedLT])
  end

  private

  def set_create_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
  end

  def set_update_time
    self.updated_date = Time.now.utc.to_f.round(3)
  end
end
