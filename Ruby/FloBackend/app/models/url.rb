class Url < ApplicationRecord
  self.table_name = "urls"
  self.primary_key = "id"

  # validates :url, :presence => true, :uniqueness => { :scope => :user_id, :case_sensitive => false}

  attr_accessor :ref, :uid # support for web

  before_create :set_create_time
  before_update :set_update_time
  validates :url, :presence => true

  scope :find_by_ids, ->(user_id, ids) { where('user_id = ? AND id IN (?)', user_id, ids) }

  #get order URL bookmark
  def self.get_order_urls(userId, options)
    sql = "user_id = :user_id"
    conditions = {:user_id => userId}
    if options[:modifiedGTE] #get data - greater than or equal
      sql << ' AND updated_date >= :updated_date'
      conditions[:updated_date] = options[:modifiedGTE]
    end
    if options[:modifiedLT] #get data before - less than
      sql << ' AND updated_date < :updated_date'
      conditions[:updated_date] = options[:modifiedLT]
    end

    objs = Url.where([sql, conditions])
    #get fields
    field = options[:fields]
    if field and field.length > 0
      arr = field.split(',')
      f = Array.new
      arr.each do |a|
        f << a if Url.fields.include?(a.to_s)
      end
      objs = objs.select(f)
    end
    objs = objs.order('order_number DESC')

    return objs
  end

  #auto update order for new items
  def self.update_order_for_newItems(userId, ids, options = nil)
    sql = "user_id = :user_id"
    conditions = {:user_id => userId}
    sql << ' AND order_number = 0 AND id IN(:ids)'
    conditions[:ids] = ids.split(',')
    #get list obj by order field ID
    order = " FIELD (id,"
    order << ids
    order << ")"

    #just update order for ids params
    objs = Url.where([sql, conditions])
    f = "id,order_number"
    objs = objs.select(f.split(','))

    #auto generate order for item
    if objs and objs.length > 0
      #get MAX order by user id
      max = 0
      min = 0
      if options and options[:top].to_i == 1
        # min_order = Url.select("MIN(order_number) AS min").where(user_id: userId)
        # min = min_order[0].min
        min = Url.where(user_id: userId).minimum(:order_number) || 0
      else
        # max_order = Url.select("MAX(order_number) AS max").where(user_id: userId)
        # max = max_order[0].max
        max = Url.where(user_id: userId).maximum(:order_number) || 0
      end
      #TODO: need to optimize this with one time update into DB
      objs.each do |obj|
        obj.order_number = max.to_i  + 1
        obj.save

        if options and options[:top].to_i == 1
          min = min - 1
        else
          max = max + 1
        end
      end
    end
  end


  def self.delete_all_urls(user_id, ids)
    where(user_id: user_id, id: ids.split(',')).delete_all
  end

  def self.fields
    return ['id','url','order_number', 'title','created_date', 'updated_date', 'order_update_time']
  end

  private

  def set_create_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
    self.order_update_time = 0
  end

  def set_update_time
    self.updated_date = Time.now.utc.to_f.round(3)
  end

  #get all import bookmark url
  def self.get_import_urls(user_id)
    sql = "SELECT u.*
           FROM urls  AS u
           WHERE u.user_id = " + user_id.to_s + " AND id IN
           (SELECT l.destination_id
            FROM projects p, links l
            WHERE p.user_id = ?
            AND p.id = l.source_id
            AND p.proj_type > 0
            GROUP BY p.id
            )"
    find_by_sql([sql, user_id])
  end
end
