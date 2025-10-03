require('./lib/app_utils.rb')
class CalendarObject < ApplicationRecord
  self.table_name = "calendarobjects"
  self.primary_key = "id"

  extend AppUtils
  include CommonScopes

  belongs_to :calendar, class_name: 'Calendar', foreign_key: 'calendarid'
  before_create :defaults, :update_time
  before_update :update_time
  validates :uid, uniqueness: true

  scope :with_modifiedGTE, lambda { |date|
    where('lastmodified >= ?', date) if date.present?
  }

  scope :with_modifiedLT, lambda { |date|
    where('lastmodified < ?', date) if date.present?
  }

  scope :with_ids, lambda { |ids|
    where(id: ids.split(',')) if ids.present?
  }

  scope :with_min_id, lambda { |min_id|
    where('id > ?', min_id.to_i) if min_id.present?
  }

  scope :with_p_item, lambda { |p_item|
    order(:id).limit(p_item.to_i) if p_item.to_i > 0
  }

  def defaults
    self.invisible = 0
    self.uri = uid + ".ics" if uid
    self.size = calendardata.bytesize
    self.etag = Digest::MD5.hexdigest(calendardata)
  end
  
  def self.fields
    return ['id','calendardata', 'uri', 'calendarid', 'etag', 'componenttype', 'firstoccurence', 'lastoccurence']
  end  
  
  #subscription: get total size of calDAV
  def self.get_total_size_caldav(email, type = false)
    sql = " SELECT SUM(co.size) AS total FROM calendarobjects co "
    sql << " LEFT JOIN calendars c ON c.id = co.calendarid "
    sql << " WHERE principaluri = :email"
    sql << " AND componenttype= :type" if type
    find_by_sql([sql, { email: API_PRINCIPAL + email, type: type }])
  end
  
  def self.get_all_events_with_color_attr(email)
    sql = "SELECT co.id, co.calendarid, co.calendardata, c.calendarcolor, c.uri FROM calendarobjects co"
    sql << " LEFT JOIN calendars c ON co.calendarid = c.id WHERE principaluri = ? and componenttype = 'VEVENT'"
    find_by_sql([sql,'principals/'+email])
  end

  # get calendar objects
  # component_type: default = get all calendar objects
  # remove params component_type = API_VEVENT because when args is 5 params
  # is component_type = API_VEVENT, and uids = API_VEVENT
  # ex: CalendarObject.get_calendar_objects(user_info, obj_type, uids, nil, nil)
  # @raise exception
  def self.get_calendar_objects(user_info, component_type, uids, cur_items, next_items, opts = {})
    # sql = " SELECT co.id, co.calendarid, co.calendardata, c.calendarcolor, c.uri,
    # c.uri as uri_calendar, substr(co.uri, 1, 36) as uri_co, co.componenttype"
    sql = " SELECT co.id, co.calendarid, co.calendardata, c.calendarcolor, c.uri, co.componenttype"
    if component_type.eql?('VTODO')
      sql <<  " , oo.order_number"
    end
    sql << " FROM calendarobjects co "
    sql << " LEFT JOIN calendars c ON co.calendarid = c.id "
    if component_type.eql?('VTODO')
      sql << " LEFT JOIN obj_order as oo on oo.obj_id = CONVERT(substr(co.uri, 1, 36) USING utf8) "
    end
    sql << " WHERE c.principaluri = ? "

    if component_type.eql?('STODO')
      sql << " AND co.componenttype = 'VTODO'"
      sql << " AND co.calendardata LIKE '%X-LCL-STASK\\:\\TRUE%'"
    else
      sql << " AND co.componenttype = '"
      sql << component_type
      sql << "'"
    end
    
    principals = 'principals/' 
    principals << user_info[:email].to_s

    if uids
      sql << " AND co.uid in (?)"

      if !cur_items.nil?
        sql <<  " ORDER BY co.lastmodified"
        sql << " LIMIT ?,?"
        find_by_sql([sql, principals, uids, cur_items, next_items])
      else
        if %w[desc asc].include? opts[:type_sort]
          sql << sql_sort_calendar_object_by_column("SUMMARY", opts)
        else # default
          sql << sql_sort_calendar_object_by_column("SUMMARY")
        end
        find_by_sql([sql, principals, uids])
      end
    else
      if !cur_items.nil?
        if component_type.eql?(API_VTODO)
          sql <<  " ORDER BY oo.order_number ASC"
        elsif component_type.eql?(API_VJOURNAL)
          if %w[summary dtstamp].include? opts[:col_sort] and %w[desc asc].include? opts[:type_sort]
            if opts[:col_sort] == 'summary'
              sql << sql_sort_calendar_object_by_column("SUMMARY", opts)
            elsif opts[:col_sort] == 'dtstamp'
              sql << sql_sort_calendar_object_by_column("DTSTAMP", opts)
            end
          else # default
            sql << sql_sort_calendar_object_by_column("DTSTAMP", opts)
          end
        else # type another
          sql <<  " ORDER BY co.lastmodified DESC"
        end
        sql << " LIMIT #{cur_items.to_i},#{next_items.to_i}"
      end
      find_by_sql([sql, principals])
    end
  end

  def self.get_calendar_objects_by_folder_id(user_info, component_type = API_VEVENT, folder_id)
    sql = "SELECT co.id, co.calendarid, co.calendardata, c.calendarcolor, c.uri, co.componenttype
            FROM calendarobjects co
            LEFT JOIN calendars c ON co.calendarid = c.id
            LEFT JOIN links l ON l.source_id = co.uid
            WHERE c.principaluri = :principaluri
            AND co.componenttype = :component_type
            AND l.destination_type = 'FOLDER' AND l.destination_id = :folder_id "

    if component_type.eql?('VTODO')
      sql << "AND co.calendardata LIKE '%X-LCL-STASK\\:\\TRUE%' "
    end

    sql << "UNION
            SELECT co.id, co.calendarid, co.calendardata, c.calendarcolor, c.uri, co.componenttype
            FROM calendarobjects co
            LEFT JOIN calendars c ON co.calendarid = c.id
            LEFT JOIN links l ON l.destination_id = co.uid
            WHERE c.principaluri = :principaluri
            AND co.componenttype = :component_type
            AND l.source_type = 'FOLDER' AND l.source_id = :folder_id "

    if component_type.eql?('VTODO')
      sql << "AND co.calendardata LIKE '%X-LCL-STASK\\:\\TRUE%'"
    end

    find_by_sql([sql, {principaluri: 'principals/' + user_info[:email].to_s, component_type: component_type, folder_id: folder_id}])
  end

  

  def self.shared_calendar_objects(email, component_type, uris, paginator = {})
    principals = API_PRINCIPAL + email

    sql = ' SELECT co.id, co.calendarid, co.calendardata, c.calendarcolor, c.uri, co.componenttype'
    sql << ' FROM calendarobjects co '
    sql << ' LEFT JOIN calendars c ON co.calendarid = c.id '
    sql << ' WHERE c.principaluri = :principaluri '
    sql << ' AND co.componenttype = :component_type '
    sql << ' AND co.uri in (:uris) ' if uris.present?

    if paginator[:cur_items].present?
      sql <<  ' ORDER BY co.lastmodified'
      sql << ' LIMIT :cur_items, :next_items'
    end
    find_by_sql [sql, principaluri: principals,
                      component_type: component_type,
                      uris: uris,
                      cur_items: paginator[:cur_items].to_i,
                      next_items: paginator[:next_items].to_i]
  end

  #count todo and note
  def self.count_calendar_obj(email)
    sql = "SELECT "
    sql << "(SELECT COUNT(*) AS todo FROM calendarobjects co WHERE componenttype = 'VTODO' AND calendarid"
    sql << " IN (SELECT id FROM calendars WHERE principaluri = ?)) AS todo, "
    sql << "(SELECT COUNT(*) AS note FROM calendarobjects co WHERE componenttype = 'VJOURNAL' AND calendarid"
    sql << " IN (SELECT id FROM calendars WHERE principaluri = ?)) AS note"
    principals = 'principals/' 
    principals << email
    find_by_sql([sql, principals, principals])
  end
  
  # get CO data for link
  def self.get_co_data(ids, except_color = nil) 
    
    sql = ""
    if except_color.nil?
      sql = %| SELECT co.uid, c.id, co.calendardata, co.componenttype, c.calendarcolor color, c.uri
          FROM calendarobjects co 
          LEFT JOIN calendars c ON co.calendarid = c.id 
          WHERE co.uid in (:ids)|  
    else
      sql = %| SELECT co.uid, c.id, co.calendardata, co.componenttype, c.uri
          FROM calendarobjects co 
          LEFT JOIN calendars c ON co.calendarid = c.id 
          WHERE co.uid in (:ids)|
    end   
         
    res = find_by_sql([sql, {ids: ids}])
    res = res.map(&:serializable_hash).each do |x| 
      x["type"] = x["componenttype"]

      if x["calendardata"]
        x["summary"] = x["calendardata"].scan(/(SUMMARY:)(.*)/).first ? x["calendardata"].scan(/(SUMMARY:)(.*)/).first.second : x["calendardata"].scan(/(SUMMARY:)(.*)/).first
      else 
        x["summary"] = 'Not found'
      end

    end
  end
  
  def self.get_co_data_without_cal_color(ids) 
    sql = %| SELECT co.uid, c.id, co.calendardata, co.componenttype, c.uri
          FROM calendarobjects co 
          LEFT JOIN calendars c ON co.calendarid = c.id 
          WHERE co.uid in (:ids)|     
    res = find_by_sql([sql, {ids: ids}])
    res = res.map(&:serializable_hash).each do |x| 
      x["type"] = x["componenttype"]

      if x["calendardata"]
        x["summary"] = x["calendardata"].scan(/(SUMMARY:)(.*)/).first.second
      else 
        x["summary"] = 'Not found'
      end
    end
  end

  # get CO data by search link
  def self.search_co_by_qs(qs, email, item_type = '', user_id)
    sql = "SELECT "
    sql << "co.uid, c.id, co.calendardata, co.componenttype, c.calendarcolor color, c.uri "
    sql << "FROM calendarobjects co "
    sql << "LEFT JOIN calendars c ON co.calendarid = c.id "
    sql << "WHERE "
    sql << "co.uid NOT IN (
                            SELECT obj_id
                            FROM trash
                            WHERE user_id = ? AND
                            obj_type IN ('#{[API_VEVENT, API_VTODO, API_VJOURNAL].join('\',\'')}')
                          ) AND "
    sql << "c.principaluri = ? "
    sql << "AND (LOWER(CONVERT(co.calendardata USING utf8)) LIKE ? OR "
    sql << "     LOWER(CONVERT(co.calendardata USING utf8)) LIKE ?)"

    conditions = []
    if !item_type.empty?
      sql << " AND co.componenttype=?"
      conditions = [sql, user_id, "principals/" + email, '%summary:' + qs + '%', '%summary:% ' + qs + '%', item_type]
    else 
      conditions = [sql, user_id, "principals/" + email, '%summary:' + qs + '%', '%summary:% ' + qs + '%']
    end

    res = find_by_sql(conditions)
    res = res.map(&:serializable_hash).each_with_index do |x, index| 
      # puts index
      x["type"] = x["componenttype"]
      x["summary"] = x["calendardata"].scan(/SUMMARY:(.*)\n/).first.first
    end
  end

  private

  def update_time
    self.lastmodified = Time.zone.now.to_i
  end

  def self.sql_sort_calendar_object_by_column(column, opts = {})
    sort_type = opts[:type_sort] || 'DESC'

    sql = " ORDER BY case
                  when INSTR(calendardata, '\n#{column}:')
                  then substring(calendardata, INSTR(calendardata, '\n#{column}:')+9,
                          INSTR(substring(calendardata, INSTR(calendardata, '\n#{column}:')+9), '\n'))
                  end #{sort_type}"
    sql
  end
end
