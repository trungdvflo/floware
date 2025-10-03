class User < ApplicationRecord
  self.table_name = "users"
  self.primary_key = "id"

  require 'digest/md5'
  require 'digest'
  #for RSA
  require 'openssl'
  require 'base64'
  require 'nokogiri'

  has_many :cloud_storages
  has_many :groups_users, dependent: :delete_all
  has_many :groups, through: :groups_users

  has_many :projects
  has_many :projects_users
  has_many :shared_collections, source: :project, through: :projects_users

  has_many :users_tracking_apps
  has_many :tracking_apps, through: :users_tracking_apps

  has_many :suggested_collections, -> { order(updated_date: :desc) }
  has_many :frequency_used_suggested_collections, -> { order(frequency_used: :desc, updated_date: :desc) }, class_name: "SuggestedCollection"

  has_many :subscription_purchases, class_name: 'SubPurchase'
  has_many :subscriptions, through: :subscription_purchases
  has_many :set_accounts
  has_one :app_token, dependent: :destroy

  before_create :set_create_time
  before_update :set_update_time

  validates :email, :presence => true, :uniqueness => { :scope => [:username], :case_sensitive => false, :message => " is already exists."}
  validates :gender, numericality: { only_integer: true }, inclusion: { in: [0, 1, 2] }
  validates :disabled, numericality: { only_integer: true }, inclusion: { in: [0, 1] }

  def current_subscription
    subscriptions.where('subscription_purchase.is_current = 1').first
  end

  def last_loggedin
    users_tracking_apps.order(last_used_date: :desc).first.last_used_date
  end

  # include projects and shared_collections
  def all_projects
    projects + shared_collections
  end

  # rubocop:disable  Metrics/ParameterLists
  def self.create_account(email = '', digesta1 = '', password = '', domain_id = 0, appreg_id = '', fullname = '', rsa = '', secondary_email = '')
    # digesta1 = Utils.dav_md5_password(email,REAL_NAME_DAV.to_s,password)
    token = Api::Web::Utils.generate_token(email, password)

    time = Time.now.to_i
    sql = "INSERT INTO users(username, digesta1, domain_id, email, password, created_date, updated_date, appreg_id, fullname, rsa, token, token_expire, birthday, secondary_email, description) "
    sql << " VALUES('"
    sql <<  email.to_s
    sql << "','" + digesta1.to_s
    sql << "'," + domain_id.to_s
    sql << ",'" + email.to_s
    sql << "', ENCRYPT('"+password+"', CONCAT('$6$', SUBSTRING(SHA(RAND()), -16)))"
    sql << "," + time.to_s #created date
    sql << "," + time.to_s #updated date
    sql << ",'" + appreg_id.to_s + "'"
    sql << ",'" + fullname.to_s + "'"
    sql << ",'" + rsa.to_s + "'"
    sql << ",'" + token.to_s + "'"
    sql << ",'" + time.to_s + "'"
    #sql << ",'" + time.to_s + "'"
    sql << ",0" # birthday
    sql << ",'" + secondary_email.to_s + "'"
    sql << ",'Flo'" #set default Flo mail account
    sql << " )"
    connection.execute(sql)
  end

  #update user email account password
  def self.change_password(email = '', digesta1 = '', password = '', rsa_pass = '')
    time = Time.now.to_i
    sql = "UPDATE users SET "
    sql << " digesta1 = '" + digesta1.to_s + "'"
    sql << ", password = ENCRYPT('"+password+"', CONCAT('$6$', SUBSTRING(SHA(RAND()), -16)))"
    sql << ", rsa = '" + rsa_pass.to_s + "'"
    sql << ", token = ''" #reset token when user change password
    sql << ", updated_date = " + time.to_s #updated date
    sql << " WHERE email = '" + email.to_s + "'"
    connection.execute(sql)
  end

  #get used by user
  def self.update_used(userID, email)
    user_id = userID
    options = {}
    #get all caldav size
    caldav = CalendarObject.get_total_size_caldav(email)
    options[:cal_bytes] = caldav[0][:total]
    #get all carddav size
    carddav = Cards.get_total_size_carddav(email)
    options[:card_bytes]  = carddav[0][:total]
    # total file size
    fileSize = Files.get_total_size_file(userID)
    options[:file_bytes]  = fileSize[0][:total]
    #save to DB
    Quota.update_quota(email, options)
  end

  #get all users have expired date after 90 days
  def self.get_users_disabled(opt = {})
    monthly = opt[:monthly] ? opt[:monthly] : 120
    yearly = opt[:yearly] ? opt[:yearly] : 455
    sql = "
        SELECT    res.*
                , sc.subs_type
                , DATE_ADD( DATE(FROM_UNIXTIME(res.created_date)), INTERVAL sc.period DAY ) as expired
        FROM (
              SELECT  pc.user_id, pc.subID
                    , pc.purchase_status, u.email, pc.created_date
                    , FROM_UNIXTIME(pc.created_date) as created

              FROM subscription_purchase pc
              LEFT JOIN users u ON u.id = pc.user_id
              WHERE pc.purchase_status > 0
              ORDER BY pc.created_date DESC
             ) AS res
        LEFT JOIN subscriptions sc ON sc.id = res.subID
        WHERE (
                (
                    ( DATEDIFF(DATE(CURDATE()), DATE(FROM_UNIXTIME(res.created_date)) ) >= "+monthly.to_s+"
                        AND sc.period = 30
                    )
                    OR
                    ( DATEDIFF(DATE(CURDATE()), DATE(FROM_UNIXTIME(res.created_date)) ) >= "+yearly.to_s+"
                        AND sc.period = 365
                    )
                )
              )
              AND res.purchase_status > 0
        GROUP BY res.user_id
    "
    connection.execute(sql)
  end

  # rubocop:disable Metrics/MethodLength
  def self.create_default_data(user, opts)
    cals = ARR_CALS_DEFAULT
    principal = 'principals/' + user.email.to_s
    components = 'VEVENT,VTODO,VJOURNAL,VFREEBUSY,VALARM'
    current_time = Time.now.utc.to_f.round(3)
    omni_cal_uri = ''

    #generate calendars data
    sqlCals = " INSERT INTO calendars(principaluri, displayname, uri, synctoken , description, calendarorder, calendarcolor, timezone, components) VALUES "
    cals.each do |cal|
      #string query calendars
      uri = UUID.new.generate
      sqlCals << "("
      sqlCals << "'"+principal.to_s+"',"
      sqlCals << "'"+cal[:displayname].to_s+"',"
      sqlCals << "'"+uri.to_s+"',"
      sqlCals << "1,"
      sqlCals << "'"+cal[:description].to_s+"',"
      sqlCals << "0,"
      sqlCals << "'"+cal[:calendarcolor].to_s+"',"
      sqlCals << "'"+opts[:calendar_tz].to_s+"',"
      sqlCals << "'"+components.to_s+"'"
      sqlCals << "),"

      #string query collections
      if cal[:displayname].to_s != DEF_OMNI_CALENDAR_NAME.to_s
        Project.create(user_id: user.id,
                       proj_name: cal[:displayname],
                       proj_color: cal[:calendarcolor],
                       calendar_id: uri,
                       proj_type: cal[:proj_type])
      end

      #store omni uri for setting
      omni_cal_uri = uri if cal[:displayname].to_s == DEF_OMNI_CALENDAR_NAME.to_s
    end
    sqlCals = sqlCals.chop
    connection.execute(sqlCals)

    #generate collections data

    #get collections to generate data
    cols = Project.where(user_id: user.id)
    if cols and cols.length > 0
      cols.each do |col|
        #get id number of calendar
        cal = Calendar.where(uri: col.calendar_id).first
        opts[:cal_id] = cal ? cal.id : 0

        #base on this ticket: https://www.pivotaltracker.com/story/show/145797975
        #generate event data
        # events = ARR_EVENT_DEFAULT_iOS
        # User.generate_event_data(user, events, col, opts) if col.proj_name == DEF_SAMPLE.to_s

        #generate todo data
        # todos = (col.proj_name == DEF_SAMPLE.to_s) ? ARR_TODO_DEFAULT_iOS : ARR_TODO_SAMPLE_DEFAULT_iOS
        # User.generate_todo_data(user, todos, col, opts)

        #generate note data
        # notes = ARR_NOTE_DEFAULT_iOS
        # User.generate_note_data(user, notes, col, opts)

        #generate setting, todo, note data
        if col.proj_name == DEF_CALENDAR_NAME.to_s
          #setting
          opts[:omni_cal_uri] = omni_cal_uri.to_s
          User.generate_setting_default(user, col, opts)

          opts[:cols] = cols #add collections to generate data
          #generate todo data
          todos = ARR_TODO_DEFAULT_iOS
          todos.each do |todo|
            if todo[:sdue].eql? 'Today'
              todo[:due] = Time.now
            elsif todo[:sdue].eql? 'Tomorrow'
              todo[:due] = Time.now + 1.day
            end
          end
          User.generate_todo_data(user, todos, col, opts)
        end

        if col.proj_name == DEF_SAMPLE
          notes = ARR_NOTE_DEFAULT_iOS
          User.generate_note_data(user, notes, col, opts)
        end
      end
    end
    #generate url bookmark data
    User.generate_url_bookmark_data(user)

    #generate address book
    User.generate_addressbook_data(user)

    #generate virtual alias
    User.generte_virtual_alias(user, opts)

    #auto upgrade account for beta user
    SubPurchase.auto_upgrade_pre_yearly(user.id)
  end
  # rubocop:enable Metrics/MethodLength

  #create setting default
  def self.generate_setting_default(user, col, opts)
    set = Setting.create_setting_default(user.id, col.calendar_id, col.id, opts[:timezone])
    setting = Setting.new(set)
    setting.omni_cal_id = opts[:omni_cal_uri] #set omni calendar default
    setting.save
  end

  #create virtual alias
  def self.generte_virtual_alias(user, opts)
    virAlias = VirtualAlias.new()
    virAlias.domain_id = opts[:domain_id]
    virAlias.source = user.email.to_s
    virAlias.destination = user.email.to_s + "," + VMAIL_PUSH_NOTI.to_s
    virAlias.save()
  end

  #create address book default
  def self.generate_addressbook_data(user)
    addbook = Addressbook.new()
    addbook.principaluri = API_PRINCIPAL.to_s + user.email.to_s
    addbook.displayname = DEF_CALENDAR_NAME.to_s
    addbook.uri = user.email.to_s
    addbook.description = DEF_CALENDAR_NAME.to_s
    addbook.save
  end

  # rubocop:disable Metrics/BlockLength
  def self.generate_note_data(user, notes, col, opts)
    if notes and notes.length > 0
      tz = opts[:timezone] ? opts[:timezone] : ''
      agCaldav = opts[:agCaldav]
      cal_id = opts[:cal_id]

      notes.each do |note|
        note_id = UUID.new.generate
        noteTT = note[:summary]
        noteTT = noteTT.gsub("@colnm@", col.proj_name)
        noteBody = note[:description]
        noteObj = User.create_note_default(col.id, noteTT, note_id, noteBody)
        note_cstring = agCaldav.new_note_string(noteObj)
        etag = (0...32).map { ('a'..'z').to_a[rand(32)] }.join
        new_note = CalendarObject.new({
          :calendardata => note_cstring,
          :uri => noteObj[:uuid] + '.ics',
          :calendarid => cal_id,
          :etag => etag,
          :componenttype => 'VJOURNAL',
          :size => note_cstring.bytesize(),
          :uid =>  noteObj[:uuid]
        })
        if new_note.save
          new_co_changes = Calendarchange.new({
            :uri => new_note.uri,
            :synctoken => 1,
            :calendarid => cal_id,
            :operation => 1
          })
          new_co_changes.save
        end
        #create link event and folder
        if note_id != ''
          cols = opts[:cols] #get collections from DB
          # noteBelongCols = note[:collections] #collections name of note will belong to
          # noteBelongCols.each do |noteCol|
            # noteColName = noteCol[:name]
            cols.each do |colObj|
              if colObj.proj_name == DEF_SAMPLE

                lnkTdFld = Link.new()
                lnkTdFld.source_type = API_VJOURNAL.to_s
                lnkTdFld.destination_type = API_FOLDER.to_s
                lnkTdFld.user_id = user.id
                lnkTdFld.source_id = note_id
                lnkTdFld.destination_id = colObj.id
                lnkTdFld.source_root_uid = '/calendarserver.php/calendars/' + user.email + '/' + '/' +col['calendar_id'] + '/'
                lnkTdFld.save()

              end #end check collection to link
            end #end collections
          # end #end note belong collection

        end #end if noteID
      end #end notes item from constant
    end
  end
  # rubocop:enable Metrics/BlockLength

  # rubocop:disable Metrics/BlockLength
  def self.generate_todo_data(user, todos, col, opts)
    if todos and todos.length > 0
      tz = opts[:timezone] ? opts[:timezone] : 'America/Chicago'
      agCaldav = opts[:agCaldav]
      cal_id = opts[:cal_id]

      todos.each do |todo|
        todo_id = UUID.new.generate
        todoTT = todo[:summary]
        todoTT = todoTT.gsub("@colnm@", col.proj_name)
        todoDes = todo[:description]

        offset =  Time.now.in_time_zone(tz).utc_offset
        todoDue = (todo[:due] + offset.second).utc#todo[:due]
        todoSubs = todo[:x_lcl_subtasks] #base64 sub todo format
        todo = User.create_task_default(col.id, todoTT, todo[:location], todo_id, todoDes, todoDue, todoSubs)
        todo[:timezone] = tz
        todo_cstring = agCaldav.new_todo_string(todo)
        etag = (0...32).map { ('a'..'z').to_a[rand(32)] }.join
        new_todo = CalendarObject.new({
          :calendardata => todo_cstring,
          :uri => todo[:uuid] + '.ics',
          :calendarid => cal_id,
          :etag => etag,
          :componenttype => 'VTODO',
          :size => todo_cstring.bytesize(),
          :uid =>  todo[:uuid]
        })
        if new_todo.save
          new_co_changes = Calendarchange.new({
            :uri => new_todo.uri,
            :synctoken => 1,
            :calendarid => cal_id,
            :operation => 1
          })
          new_co_changes.save
          min_order = ObjOrder.where(user_id: user.id).minimum(:order_number) || 0
          min = min_order - 1
          ObjOrder.create(user_id: user.id, obj_type: API_VTODO.to_s, order_number: min, obj_id: todo_id)
        end
        #create link event and folder
        if todo_id != ''
          lnkTdFld = Link.new()
          lnkTdFld.source_type = API_VTODO.to_s
          lnkTdFld.destination_type = API_FOLDER.to_s
          lnkTdFld.user_id = user.id
          lnkTdFld.source_id = todo_id
          lnkTdFld.destination_id = col.id
          lnkTdFld.save()
        end
      end
    end
  end
  # rubocop:enable Metrics/BlockLength

  # rubocop:disable Metrics/BlockLength
  def self.generate_event_data(user, events, col, opts)
    if events and events.length > 0
      tz = opts[:timezone] ? opts[:timezone] : ''
      agCaldav = opts[:agCaldav]
      cal_id = opts[:cal_id]

      events.each do |eve|
        event_id = UUID.new.generate
        event = User.create_event_default(col.id, eve, event_id)
        event[:timezone] = tz
        event_cstring = agCaldav.new_event_string(event)
        etag = (0...32).map { ('a'..'z').to_a[rand(32)] }.join
        new_event = CalendarObject.new({
          :calendardata => event_cstring,
          :uri => event[:uuid] + '.ics',
          :calendarid => cal_id,
          :etag => etag,
          :componenttype => 'VEVENT',
          :size => event_cstring.bytesize(),
          :uid =>  event[:uuid]
        })

        if new_event.save
          new_co_changes = Calendarchange.new({
            :uri => new_event.uri,
            :synctoken => 1,
            :calendarid => cal_id,
            :operation => 1
          })
          new_co_changes.save
        end

        # #create link event and folder
        if event_id != ''
          lnkEveFld = Link.new()
          lnkEveFld.source_type = API_VEVENT.to_s
          lnkEveFld.destination_type = API_FOLDER.to_s
          lnkEveFld.user_id = user.id
          lnkEveFld.source_id = event_id
          lnkEveFld.destination_id = col.id
          lnkEveFld.save()
        end
      end
    end
  end
  # rubocop:enable Metrics/BlockLength

  #create url bookmark default
  def self.generate_url_bookmark_data(user)
    sql = " INSERT INTO urls(user_id, url, title, created_date, updated_date) VALUES "
    urls = ARR_BOOKMARKS_URL
    urls.each do |url|
      current_time = Time.now.utc.to_f.round(3)
      sql << "("
      sql << user.id.to_s + ","
      sql << "'"+url[:url].to_s+"',"
      sql << "'"+url[:title].to_s+"',"
      sql << current_time.to_s+","
      sql << current_time.to_s
      sql << "),"
    end
    sql = sql.chop
    connection.execute(sql)
  end

  # create task default
  def self.create_task_default(folder_id = 0, task_title = "", task_location = "", uuid = '', task_des = '', task_due = '', task_subs = nil)
    task = {}
    #uuid = UUID.new.generate
    task[:uuid] = uuid
    task[:summary] = task_title.present? ? task_title.to_s : "Task default"
    task[:start] = Time.now.to_datetime.to_s
    task[:duration] = 30 #default = 30 mins
    task[:folderid] = folder_id.to_s
    task[:description] = task_des.to_s
    task[:due] = task_due.to_s
    task[:x_lcl_subtasks] = task_subs ? Base64.strict_encode64(task_subs.to_json.to_s) : ''
    task[:location] = task_location.to_s
    task[:url] = HTTP_HOST_NAME ? HTTP_HOST_NAME  : "https://flo.floware.com"

    return task
  end

  # create note default
  def self.create_note_default(folder_id = 0, note_title = "", uuid = '', description = '')
    note = {}
    # uuid = UUID.new.generate
    note[:uuid] = uuid
    note[:summary] = note_title.present? ? note_title.to_s : "Note default"
    note[:dtstart] = Time.now.to_datetime.to_s
    note[:folderid] = folder_id.to_s
    note[:description] = description.present? ? Nokogiri::HTML(description).text : "This is Note description"
    notecnt = description.present? ? description.to_s : "This is note content"
    note[:x_lcl_notecontent] = Base64.strict_encode64(notecnt)
    note[:floware_only] = '1' # ios
    return note
  end

  # create event default
  def self.create_event_default(_folder_id = 0, eve = {}, uuid = '')
    event = {}
    # uuid = UUID.new.generate
    event[:uuid] = uuid
    event[:start] = eve[:st].to_s
    event[:end] = eve[:et].to_s
    event[:title] = eve[:summary].present? ? eve[:summary].to_s : "Event default"
    event[:summary] = event[:title]
    # event[:duration] = 3600
    # event[:folderid] = folder_id.to_s
    # event[:color] = DEF_COLOR.to_s
    event[:description] = eve[:summary].to_s
    # event[:location] = eve[:location].to_s
    event[:url] = HTTP_HOST_NAME ? HTTP_HOST_NAME  : "https://flo.floware.com"
    return event
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
