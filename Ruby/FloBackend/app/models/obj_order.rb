class ObjOrder < ApplicationRecord
  self.table_name = "obj_order"
  self.primary_key = "id"

  #validate with 2 fields as key
  validates :obj_id, :presence => true, :uniqueness => { :scope => [:user_id, :obj_type, :source_account], :case_sensitive => true, :message => " is already exists."}
  # validates :obj_id, :presence => true, :uniqueness => { :scope => [:user_id, :obj_type, :source_id], :case_sensitive => true, :message => " is already exists."}
  # validates :obj_id, :presence => true, :uniqueness => { :scope => [:user_id, :obj_type], :case_sensitive => true, :message => " is already exists."}

  attr_accessor :ref

  before_create :set_create_time
  before_update :set_update_time

  scope :find_by_ids, ->(user_id, ids) { where('user_id = ? AND id IN (?)', user_id, ids) }
  validates :obj_type, inclusion: { in: ['VTODO'] }

  validate :third_party_account_exist?

  def third_party_account_exist?
    return true if source_account.to_i == 0
    third_party_account = SetAccount.find_by(id: source_account, user_id: user_id)
    if third_party_account.blank?
      errors.add(:source_account, 'should be exist')
      return false
    end
  end

  #################################################

  #get update order objects
  def self.get_update_order_objs(userId, ids, objEntity, fields, options = nil)
    sql = "user_id = :user_id"
    conditions = {:user_id => userId}
    order = ""
    objs = []

    if ids and ids.to_s.length > 0
      #update order for new items
      ObjOrder.update_order_for_newItems(userId, ids, objEntity, fields, options)
      #get items by order id from client
      #check caldav object
      if options[:obj_type] and options[:obj_type].to_i == 2 #VTODO
        sql << ' AND obj_id IN(:ids)' #caldav object
      else
        sql << ' AND id IN(:ids)'
      end
      ids = ids.to_s
      conditions[:ids] = ids.split(',')
      #get list obj by order field ID
      if options[:obj_type] and options[:obj_type].to_i == 2 #VTODO
        #caldav object:
        # 1 - get obj not exist, 2 - auto insert to DB, 3 - get ID to sort
        order = " FIELD (obj_id,"
        order << ids
        order << ")"
      else
        order = " FIELD (id,"
        order << ids
        order << ")"
      end

      #just update order for ids params
      objs = objEntity.where([sql, conditions])

      objs = objs.select(fields.split(','))
      objs_db = objs.clone
      #get objs keep by order from client
      objs = objs.order(order) if order and order.length > 0
      #auto generate order for item
      if objs and objs.length > 0
        #check case move to top or bottom
        hasUpdate = ObjOrder.update_obj_top_bottom(userId, objs, objEntity, options)

        if hasUpdate.to_i == 0
          #objs order by order in DB
          objs_db = objs_db.order('order_number desc')
          # set order update time for object: URL, kanban, canvas
          has_order_update_time = 0
          if options[:obj_type] and (options[:obj_type].to_i == 1 or options[:obj_type].to_i == 3 or options[:obj_type].to_i == 4 or options[:obj_type].to_i == 5)
            has_order_update_time = 1
          end

          ind = 0
          objs.each do |obj|
            obj.order_number = objs_db[ind].order_number
            # set order update time for object: URL, kanban, canvas
            obj.order_update_time = Time.now.utc.to_f.round(3) if has_order_update_time == 1

            # obj.update_attributes(obj)
            obj.save
            ind = ind + 1
          end
        end

      end
    end
    return objs
  end

  #update item at top + bottom of the list
  def self.update_obj_top_bottom(userId, objs, objEntity, options = nil)
    res = 0
    if objs and objs.length == 1
      # set order update time for object: URL, kanban, canvas
      has_order_update_time = 0
      if options[:obj_type] and (options[:obj_type].to_i == 1 or options[:obj_type].to_i == 3 or options[:obj_type].to_i == 4 or options[:obj_type].to_i == 5)
        has_order_update_time = 1
      end
      obj = objs[0]
      if options and options[:top].to_i == 1
        min = objEntity.where(user_id: userId).minimum(:order_number) || 0
        obj.order_number = min.to_i  - 1
        # set order update time for object: URL, kanban, canvas
        obj.order_update_time = Time.now.utc.to_f.round(3) if has_order_update_time == 1

        obj.save
        res = 1
      end
      if options and options[:bottom].to_i == 1
        max = objEntity.where(user_id: userId).maximum(:order_number) || 0
        obj.order_number = max.to_i  + 1
        # set order update time for object: URL, kanban, canvas
        obj.order_update_time = Time.now.utc.to_f.round(3) if has_order_update_time == 1

        obj.save
        res = 1
      end
    end
    return res
  end

  #auto update order for new items
  def self.update_order_for_newItems(userId, ids, objEntity, fields, options = nil)
    sql = "user_id = :user_id"
    conditions = {:user_id => userId}

    #Vtodo object
    if options[:obj_type] and options[:obj_type].to_i == 2
      #check exist and auto create new order

    else
      sql << ' AND order_number = 0 AND id IN(:ids)'
      ids = ids.to_s
      conditions[:ids] = ids.split(',')
      #get list obj by order field ID
      order = " FIELD (id,"
      order << ids
      order << ")"
    end

    #just update order for ids params
    objs = objEntity.where([sql, conditions])
    objs = objs.select(fields.split(','))
    #auto generate order for item
    if objs and objs.length > 0
      #get MAX order by user id
      max = 0
      min = 0
      if options and options[:top].to_i == 1
        min = objEntity.where(user_id: userId).minimum(:order_number) || 0
      else
        max = objEntity.where(user_id: userId).maximum(:order_number) || 0
      end
      #TODO: need to optimize this with one time update into DB
      # set order update time for object: URL, kanban, canvas
      has_order_update_time = 0
      if options[:obj_type] and (options[:obj_type].to_i == 1 or options[:obj_type].to_i == 3 or options[:obj_type].to_i == 4 or options[:obj_type].to_i == 5)
        has_order_update_time = 1
      end
      objs.each do |obj|

        if options and options[:top].to_i == 1
          obj.order_number = min.to_i - 1
          min = min - 1
        else
          obj.order_number = max.to_i + 1
          max = max + 1
        end

        # set order update time for object: URL, kanban, canvas
        obj.order_update_time = Time.now.utc.to_f.round(3) if has_order_update_time == 1

        # obj.update_attributes(obj)
        obj.save
      end
    end
  end

  #################################################

  def self.delete_all_objOrder(user_id, ids)
    where(user_id: user_id, id: ids.split(',')).delete_all
  end


  ########################################
  def self.update_sort_order_objs(user_id, items, objEntity, fields, options)
    res = []
    #steps:
    # 1 - check exist, if NOT --> auto create new order on the top
    # 2 - sort by order from client add to server
    #
    #object: vtodo
    if options[:obj_type] and options[:obj_type].to_i == 2
      ObjOrder.check_exist_and_auto_create_objOrder(user_id, items, fields, options)
    end

    #swap tp sort order
    objs = ObjOrder.swap_sort_ObjOrder(user_id, items, objEntity, fields, options)

    res = objs
    return res
  rescue
    []
  end

  #auto insert to obj order table, just for VTODO
  def self.check_exist_and_auto_create_objOrder(user_id, items, fields, options)
    objsUID = []
    objsID = []
    res = {}
    return res if items.empty?

    max = 0
    min = 0
    if options and options[:bottom].to_i == 1
      max  = get_max_order(user_id).max_order || 0
    else #default is top
      min = get_min_order(user_id).min_order || 0
    end

    objsDB = ObjOrder.get_objs_from_DB(user_id, items, ObjOrder, fields, options)

    items.each do |item| #array objs from DB
      hasExist = 0 #flag check item existed
      objsDB.each do |ob| #array from client
        if ob[:obj_id] == item[:obj_id]
          hasExist = 1 #it existed
          break
        end
      end
      #if it does not exist, will insert to DB
      next if hasExist == 1
      if options and options[:bottom].to_i == 1
        max = max + 1
        create_obj_order(item[:obj_id], user_id, item[:source_account], max)
      else
        min = min - 1
        create_obj_order(item[:obj_id], user_id, item[:source_account], min)
      end
      objsUID << item[:obj_id]
    end

    res[:data_uids] = objsUID
    return res
  end

  #get ID obj to sort swap
  def self.swap_sort_ObjOrder(user_id, items, objEntity, fields, options)
    begin
      #get objects by order from client request
      objsClient = ObjOrder.get_objs_from_DB(user_id, items, objEntity, fields, options)

      #sort objects by order number from DB
      objsDB = objsClient.clone
      objsDBx = objsDB.sort_by {|obj| obj[:order_number]}

      #swap sort order
      has_order_update_time = 0
      if options[:obj_type] and options[:obj_type].to_i != 2
        has_order_update_time = 1
      end

      time_update = Time.now.utc.to_f.round(3)
      # objs_save = []
      ActiveRecord::Base.transaction do
        objsClient.each_with_index do |obj, ind|
          obj.order_number = objsDBx[ind].order_number
          # set order update time for object: URL, kanban, canvas
          obj.order_update_time = time_update if has_order_update_time == 1

          #update object order number
          # obj.update_attributes(obj)
          obj.save
          # objs_save << obj
        end
      end
    rescue
      []
    end
  end

  #get list objects from DB
  def self.get_objs_from_DB(user_id, items, objEntity, fields, options)
    ids = ""
    uids = ""
    if items and items.length > 0
      items.each do |item|
        uids = uids.to_s + "'" + item[:obj_id].to_s + "'," if item[:obj_id] and options[:obj_type].to_i == 2 #vtodo
        ids = ids.to_s + item[:id].to_s + "," if item[:id] #kanban, canvas, url
      end
    end
    sql = "user_id = :user_id"
    conditions = {:user_id => user_id}

    order = ""
    if options[:obj_type] and options[:obj_type].to_i == 2 #VTODO
      sql << ' AND obj_id IN('+uids.chop+')' #caldav object
      # conditions[:uids] = uids.to_s.chop

      order = " FIELD (obj_id,"
      order << uids.to_s.chop
      order << ")"
    else
      sql << ' AND id IN('+ids.to_s.chop+')'
      # conditions[:ids] = ids.to_s.chop

      order = " FIELD (id,"
      order << ids.to_s.chop
      order << ")"
    end

    #just update order for ids params
    objs = objEntity.where([sql, conditions])
    #get objs keep by order from client
    objs = objs.order(order) if order and order.length > 0
    objs
  end


  def self.fields
    #define: obj_type = VTODO, VJOURNAL, VEVENT, CALENDAR, FOLDER, URL, FILE
    return ['id','obj_id', 'obj_type', 'order_number','created_date', 'updated_date']
  end

  #get max order number by user id
  def self.get_max_order(user_id)
    # ObjOrder.where(user_id: user_id).maximum(:order_number) || 0
    sql = "SELECT MAX(oo.order_number) AS max_order FROM obj_order AS oo WHERE oo.user_id = ?"
    find_by_sql([sql, user_id]).first
  end

  #get min order number by user id
  def self.get_min_order(user_id)
    # ObjOrder.where(user_id: user_id).minimum(:order_number) || 0
    sql = "SELECT MIN(oo.order_number) AS min_order FROM obj_order AS oo WHERE oo.user_id = ?"
    find_by_sql([sql, user_id]).first
  end

  private

  def self.create_obj_order(obj_id, user_id, source_account, order_number)
    ObjOrder.create(obj_id: obj_id,
                    user_id: user_id,
                    obj_type: API_VTODO.to_s,
                    source_account: source_account || 0,
                    order_number: order_number.to_s)
  end
  
  def set_create_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
  end

  def set_update_time
    self.updated_date = Time.now.utc.to_f.round(3)
  end
end
