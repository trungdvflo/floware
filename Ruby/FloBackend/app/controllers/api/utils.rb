require './lib/agcaldav.rb'
require 'ostruct'
class Api::Utils
  require 'digest/md5'
  require 'digest'
  #for RSA
  require 'openssl'
  require 'base64'
  
  ##### RSA ###########
  #encrypt password with RSA
  def self.encrypt_rsa(pass)
    public_key = OpenSSL::PKey::RSA.new(RSA_PUBLIC_KEY.to_s)
    rsa_pass = Base64.encode64(public_key.public_encrypt(pass))
    return rsa_pass
  end

  #decrypt password with RSA
  def self.decrypt_rsa(rsa_pass)
    # private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s, RSA_PASSWORD.to_s)
    private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s) #no need password
    pass = private_key.private_decrypt(Base64.decode64(rsa_pass))
    return pass
  end

  #aes
  # def self.encrypt_aes(str, key, iv)
    # data = AES.encrypt(str.to_s, key, {:iv => iv})
    # return data
  # end
  
  def self.valid_url(url)
    uri = URI.parse(url)
    if uri.class != URI::HTTP
      return true
    end
  rescue URI::InvalidURIError
    return false
  end
  
  ####################
  #For SabreDAV
  #user_name: email of email@gmail.com
  #real_name_dav: this is constant of DAV
  #pass: password of user 
  def self.dav_md5_password(user_name, real_name_dav, pass)
    strFormat = user_name.to_s + ':' + real_name_dav.to_s + ':' + pass.to_s
    p = Digest::MD5.hexdigest(strFormat)
    return p
  end
  
  #generate signature
  def self.generate_signature(_email = '', digesta1_pass = '', appreg = '')
    sig = Digest::MD5.hexdigest(digesta1_pass.to_s + appreg.to_s)
    return sig
  end
  
  #generate keyapi
  def self.generate_keyapi(email = '', appreg = '', token = '')
    keyapi = Digest::MD5.hexdigest( Digest::MD5.hexdigest(email.to_s.strip.downcase + appreg.to_s) + token.to_s )
    return keyapi
  end
  
  #generate token
  def self.generate_token(email = '', sig = '')
    email = email.to_s.strip.downcase
    token = Digest::MD5.hexdigest(email + sig.to_s + Time.now.to_s + Random.rand().to_s)
    return token
  end
  
  #decode base64
  def self.decode_base64(encode_text)
    return Base64.strict_decode64(encode_text)
  rescue
    return encode_text
  end
  
  #encode
  def self.encode_base64(text)
    return Base64.strict_encode64(text)
  rescue
    return text
  end
  
  # Create calendars default
  # def self.create_calendars_default (opts)
    # uuid = opts[:uuid]
    # uuid1 = opts[:uuid1]
    # uuid2 = opts[:uuid2]
    # uuid3 = opts[:uuid3]
    # omni_cal_uri = opts[:omni_cal_uri]
    # email = opts[:email]
    # calendar_tz = opts[:calendar_tz]
    # color = opts[:color]
    
    # principalUri = 'principals/' + email.to_str
    # cal_components = 'VEVENT,VTODO,VJOURNAL,VFREEBUSY,VALARM'
    
    
    # cal_def = Calendar.new({:principaluri => principalUri, :displayname => DEF_CALENDAR_NAME, :uri => uuid, :synctoken => 1,
                            # :description => DEF_CALENDAR_DESCRIPTION.to_s, :calendarorder => 0, :calendarcolor => color, :invisible => 0,
                            # :components => cal_components, :timezone => calendar_tz})
    # cal_def.save
    
    # cal_work = Calendar.new({:principaluri => principalUri, :displayname => DEF_WORK, :uri => uuid1, :synctoken => 1,
                            # :description => DEF_WORK, :calendarorder => 0, :calendarcolor => DEF_WORK_COLOR, :invisible => 0,
                            # :components => cal_components, :timezone => calendar_tz})
    # cal_work.save
    
    # cal_home = Calendar.new({:principaluri => principalUri, :displayname => DEF_HOME, :uri => uuid2, :synctoken => 1,
                            # :description => DEF_HOME, :calendarorder => 0, :calendarcolor => DEF_HOME_COLOR, :invisible => 0,
                            # :components => cal_components, :timezone => calendar_tz})
    # cal_home.save
    
    # cal_play = Calendar.new({:principaluri => principalUri, :displayname => DEF_PLAY, :uri => uuid3, :synctoken => 1,
                            # :description => DEF_PLAY, :calendarorder => 0, :calendarcolor => DEF_PLAY_COLOR, :invisible => 0,
                            # :components => cal_components, :timezone => calendar_tz})
    # cal_play.save
    
    # cal_omni = Calendar.new({:principaluri => principalUri, :displayname => DEF_OMNI_CALENDAR_NAME, :uri => omni_cal_uri, :synctoken => 1,
                            # :description => DEF_OMNI_CALENDAR_NAME, :calendarorder => 0, :calendarcolor => DEF_OMNI_CALENDAR_COLOR, :invisible => 0,
                            # :components => cal_components, :timezone => calendar_tz})
    # cal_omni.save
    
  # end
  
  ##############################################################
  # create event default
  # def self.create_event_default(folder_id = 0, eve = {}, uuid = '')
    # event = {}
    # # uuid = UUID.new.generate
    # event[:uuid] = uuid 
    # event[:start] = eve[:st].to_s
    # event[:end] = eve[:et].to_s
    # event[:title] = (eve[:summary].to_s != '') ? eve[:summary].to_s : "Event default"
    # event[:summary] = event[:title]
    # # event[:duration] = 3600
    # # event[:folderid] = folder_id.to_s
    # # event[:color] = DEF_COLOR.to_s
    # event[:description] = eve[:summary].to_s
    # event[:location] = eve[:location].to_s
    # event[:url] = HTTP_HOST_NAME ? HTTP_HOST_NAME  : "http://flomail.net"
    # return event
  # end
  
  # create task default
  # def self.create_task_default(folder_id = 0, task_title = "", task_location = "", uuid = '')
    # task = {}
    # #uuid = UUID.new.generate
    # task[:uuid] = uuid
    # task[:summary] = (task_title.to_s != '') ? task_title.to_s : "Task default"
    # task[:start] = Time.now.to_datetime.to_s
    # task[:duration] = 30 #default = 30 mins
    # task[:folderid] = folder_id.to_s
    # task[:description] = ""
    # task[:due] = (task_due.to_s != '') ? task_due : ''
    # task[:x_lcl_subtasks] = task_subs ? Base64.encode64(task_subs.to_json.to_s) : ''
    # task[:location] = (task_location.to_s != '') ? task_location.to_s : ""
    # task[:url] = HTTP_HOST_NAME ? HTTP_HOST_NAME  : "http://flomail.net"
    # return task
  # end
  
  # create note default
  # def self.create_note_default(folder_id = 0)
    # note = {}
    # uuid = UUID.new.generate
    # note[:uuid] = uuid
    # note[:summary] = "Note default"
    # note[:dtstart] = Time.now.to_datetime.to_s
    # note[:folderid] = folder_id.to_s
    # note[:description] = "This is Note description"
    # notecnt = "This is note content"
    # note[:notecontent] = Base64.encode64(notecnt)
    # return note
  # end

  # create setting default for user
  # def self.create_setting_default(user_id = 0, calendar_uid = '', folder_id = 0, timezone = '')
   # wkHours = '[
  # {"day":"Mon","iMin":32400, "iMax": 64800}
  # ,{"day":"Tue","iMin":32400, "iMax": 64800}
  # ,{"day":"Wed","iMin":32400, "iMax": 64800}
  # ,{"day":"Thu","iMin":32400, "iMax": 64800}
  # ,{"day":"Fri","iMin":32400, "iMax": 64800}
  # ,{"day":"Sat","iMin":32400, "iMax": 64800}
  # ,{"day":"Sun","iMin":32400, "iMax": 64800}
  # ]'
  
    # setting = {}
    # setting[:user_id] = user_id
    # setting[:default_cal] = calendar_uid
    # setting[:timezone] = (timezone and timezone.to_s.strip.length > 0) ? timezone : 'America/Chicago'
    # setting[:event_duration] = 3600 #default is 1 hour
    # setting[:alert_default] = 1 #pop up alert
    # setting[:alert_before] =  0 #Time of Start # -3600 #60 mins before
    # setting[:default_ade_alert] = 0 #Date of Start
    # setting[:snooze_default] = 900 #15 mins
    # setting[:timezone_support] = 1 #true or false
    # setting[:task_duration] = 1800 #mins = 30 mins = 1800 seconds
    # setting[:deadline] = -1 #None option
    # setting[:due_task] = 0
    # setting[:number_stask] = 5
    # setting[:total_duration] = 21600
    # setting[:buffer_time] = 900
    # setting[:hide_stask] = 0
    # setting[:default_folder] = folder_id
    # setting[:calendar_color] = DEF_COLOR.to_s
    # setting[:folder_color] = DEF_COLOR.to_s
    # setting[:working_time] = wkHours.to_s #json string
    # setting[:m_show] = 63 #month show
    # setting[:dw_show] = 57 #day week show
    # setting[:default_todo_alert] = 0 #none option
    # setting[:mail_moving_check] = 3 #check for bear track
    # setting[:noti_bear_track] = 3 #show notification for bear trackon alert box
    # setting[:filing_email] = false
    # #for contact
    # setting[:contact_display_name] = 1 
    # setting[:contact_display_inlist] = 0
    
    # return setting
  # end
  
  #create random calendar color
  def self.random_calendar_color
     # TODO: need to list calendar color
     color = DEF_COLOR.to_s
     return color
  end

  def self.convert_calendar_obj(records, isHashObj = false, trashed_items = nil, opts = nil)
    arr = []
    total_num_of_items = 0
    num_of_trashed_items = 0
    num_of_errors = 0  
    last_event = {}
    first_event = {}

    if records.present?
      records.each do |rc|
        begin
        if isHashObj
          record =  OpenStruct.new rc
        else
          record = rc
        end
        type = record.componenttype
        data = record.calendardata
        data = data.force_encoding("utf-8")
        calendar = Icalendar::Parser.new(data).parse.first
        
        tzid = ''
        case type
          when API_VEVENT
            calObjs = calendar.events
            if calendar.timezones
              if calendar.timezones.length > 0
                tzid = calendar.timezones[0].tzid
              end
            end
          when API_VTODO
            calObjs = calendar.todos
          when API_VJOURNAL
            calObjs = calendar.journals
        end
        
        
        
        calObjs.each do |o|
          if !opts.nil?
            next if opts[:stodo] && !o.x_lcl_stask
          end

          total_num_of_items += 1
          if trashed_items.present?
            existed = Api::Web::Utils.filter_by_trash(trashed_items, o.uid)
            if existed
              num_of_trashed_items += 1
            end
            next if existed        
          end  
          
          if type == API_VTODO || type == API_VEVENT
            #Custom Alarm object
            alarms = []
            if o.alarms
              o.alarms.each do |al|
                alarm = {
                  'action' => al.action ? al.action : nil,
                  'summary' => al.summary ? al.summary : nil,
                  'description' => al.description ? al.description : nil,
                  'repeat' =>  al.repeat ? al.repeat : nil,
                  'duration' => al.duration ? al.duration : nil,
                  'attach' => al.attach ? al.attach : nil,
                  'attendee' => al.attendee ? al.attendee : nil,
                  'custom_properties' => al.custom_properties ? al.custom_properties : nil # custom properties of alarms object from another app
                }
                begin
                  if al.trigger
                    if al.trigger.is_a?(Icalendar::Values::DateTime)
                      alarm['trigger'] = al.trigger 
                    else
                      alarm['trigger'] = al.trigger.to_h
                    end
                  else
                    alarm['trigger'] = nil 
                  end
                  alarms << alarm
                rescue
                end
              end
            end
          end
          
            customObj = {
               'id' => record.id ? record.id : '',
               'cal_uri' => record.uri ? record.uri : '',
               'uid' => o.uid ? o.uid : '',
               'summary' => o.summary ? o.summary : '',
               'url' => o.url ? o.url : '',
               'location' => o.location ? o.location : '',
               'description' => o.description ? o.description : '',
               'dtstamp' => o.dtstamp ? o.dtstamp : '',
               'last_modified' => o.last_modified ? o.last_modified : '', 
               'dtstart' => o.dtstart ? o.dtstart : '',
               'tzid' => o.dtstart && o.dtstart.ical_params['tzid'] ? o.dtstart.ical_params['tzid'][0] : '',
               'dtend' => o.dtend ? o.dtend : '',
               'status' => o.status ? o.status : '',
               'organizer' => o.organizer ? o.organizer : '',
               'categories' => o.categories ? o.categories[0] : '',
               'sequence' => o.sequence ? o.sequence : 0 ,
               'created' => o.created ? o.created : '',
               'color' => o.x_lcl_color ? o.x_lcl_color[0] : '', #record.calendarcolor ? record.calendarcolor : '', #(o.x_lcl_color ? o.x_lcl_color[0] : '')
               'specified_color' => o.x_lcl_color ? o.x_lcl_color[0] : '',
               'itemType' => type,
               'link_created_date' => record.methods.include?(:created_date) ? record.created_date : nil,
               'star' => o.x_lcl_star ? o.x_lcl_star : nil
            }

            if type == API_VTODO
              if !customObj['tzid'].nil? && !o.due.nil?
                customObj['tzid'] = o.due && o.due.ical_params['tzid'] ? o.due.ical_params['tzid'][0] : ''
              end
              
              if !customObj['tzid'].nil? && o.completed
                customObj['tzid'] = o.completed && o.completed.ical_params['tzid'] ? o.completed.ical_params['tzid'][0] : ''
              end          
            end
  
            if type == API_VEVENT || o.x_lcl_stask

              if type == API_VEVENT
                customObj['transp'] = o.transp ? o.transp : ''
              end
              attendees = o.attendee ? o.attendee : nil
              
              customObj['attendee'] = Array.new
              if !attendees.nil? && !attendees.empty?
                attendees.each do |att|
                  attendee = att.ical_params
                  attendee[:email] = att 
                  customObj['attendee'] << attendee
                end
              end
              
              # city of current timezone
              customObj['tzcity'] = o.x_lcl_tzcity ? o.x_lcl_tzcity[0] : ''
              # stask properties
              customObj['stask'] = o.x_lcl_stask ? o.x_lcl_stask : ''
              if o.x_lcl_stask
                customObj['subtasks'] = o.x_lcl_subtasks ? o.x_lcl_subtasks[0] : ''
                customObj['duration'] = o.duration ? o.duration : ''
                customObj['completed'] = o.completed ? o.completed : ''
                customObj['due'] = o.due ? o.due : ''
              end
  
              # recurring item properties
              # RE: recurring event
              # RADE: recurring all-day event
              # RST: recurring scheduled todo
              customObj['rrule'] = o.rrule ? o.rrule[0] : ''
              customObj['exdate'] = o.exdate ? o.exdate : ''
              customObj['recurid'] = o.recurrence_id ? o.recurrence_id : ''
              
              customObj['alarms'] = alarms
              
            elsif type == API_VTODO
              customObj['subtasks'] = o.x_lcl_subtasks ? o.x_lcl_subtasks[0] : ''
              customObj['duration'] = o.duration ? o.duration : ''
              customObj['completed'] = o.completed ? o.completed : ''
              customObj['due'] = o.due ? o.due : ''
              customObj['alarms'] = alarms
              
            elsif type == API_VJOURNAL
              customObj['notecontent'] = o.x_lcl_notecontent ? o.x_lcl_notecontent[0] : ''
              customObj['inlineattachments'] = o.x_lcl_inlineattachments ? o.x_lcl_inlineattachments[0] : ''
              customObj['floware_only'] = o.floware_only ? o.floware_only[0] : ''
            end    
            

            #3rd Object
            if isHashObj
              if !o.dtstart.nil?
                case o.dtstart.ical_params['tzid']
                when Array then 
                     customObj['tzid'] = o.dtstart.ical_params['tzid'][0]
                when String then 
                     customObj['tzid'] = o.dtstart.ical_params['tzid']
                end
              end
              
              if type != API_VJOURNAL && !customObj['tzid'].nil? && !o.due.nil? && o.due.length > 0
                  case o.due.ical_params['tzid']
                  when Array then 
                       customObj['tzid'] = o.due.ical_params['tzid'][0]
                  when String then 
                       customObj['tzid'] = o.due.ical_params['tzid']
                  end
              end
              
              if type != API_VJOURNAL && !customObj['tzid'].nil?
                if !o.completed.nil? && o.completed.length > 0
                  case o.completed.ical_params['tzid']
                  when Array then 
                       customObj['tzid'] = o.completed.ical_params['tzid'][0]
                  when String then 
                       customObj['tzid'] = o.completed.ical_params['tzid']
                  end
                end
              end
              
              if customObj['tzid'] && customObj['tzid'].eql?('UTC')
                if tzid
                  customObj['tzid'] = tzid
                end
              end
              
              if !o.custom_properties.empty?
                  full_name = ''
                  if !o.custom_properties['x_first_name'].empty?
                      full_name = full_name + o.custom_properties['x_first_name'][0].to_str
                  end
                  if !o.custom_properties['x_last_name'].empty?
                      full_name = full_name + " " + o.custom_properties['x_last_name'][0].to_str
                  end
                  
                  if !full_name.empty?
                    if customObj['summary'].empty?
                      # Requirement:
                      # show suffix "'s Birthday" for birthday event has name.
                      # Otherwise, show "Unknown Person" for empty fullname
                      if full_name.strip.blank?
                        customObj['summary'] = "Unknown Person"
                      else
                        customObj['summary'] = full_name + "'s Birthday"
                      end
                    end
                    
                    customObj['isBirthDay'] = true
                  end
              end

              if type == API_VTODO
                if !o.x_yahoo_duration.empty?
                  customObj['duration'] = o.x_yahoo_duration ? o.x_yahoo_duration : ''
                end
              end
              
              if record.tpObjType.present?
                customObj['tpObjType'] = record.tpObjType
                customObj['tpAccount'] = record.tpAccount
                customObj['isReadOnly'] = record.isReadOnly
              end
              # customObj['color'] = record.calendarcolor
            end
            
            
            
            if type == API_VEVENT || o.x_lcl_stask
              
              if last_event.blank? || (!last_event.blank? && customObj['dtstart'] && last_event['dtstart'] && 
                                        Time.parse(last_event['dtstart'].to_s).utc < Time.parse(customObj['dtstart'].to_s).utc)
                last_event = customObj
              end

              if first_event.blank? || (!first_event.blank? && customObj['dtstart'] && first_event['dtstart'] &&
                  Time.parse(first_event['dtstart'].to_s).utc > Time.parse(customObj['dtstart'].to_s).utc)
                first_event = customObj
              end
              
              if !opts.nil? && !customObj['rrule'] && !is_multi_day_event(customObj)
                 next if Time.parse(customObj['dtstart'].to_s).utc  < opts[:prev] ||
                         Time.parse(customObj['dtstart'].to_s).utc > opts[:next]
              end
            end
          arr << customObj
        end
        rescue Exception
          num_of_errors += 1
        end
      end
    end
    
    rs = {
      data: arr,
      num_of_trashed_items: num_of_trashed_items,
      num_of_errors: num_of_errors,
      total_num_of_items: total_num_of_items
    }
    
    if !last_event.blank?
      rs[:last_event] = last_event
    end

    if !first_event.blank?
      rs[:first_event] = first_event
    end
    
    rs
  end

  def self.is_multi_day_event(event)
    if !event['rrule'].nil? || !event['stask'].empty? || event['itemType'] != API_VEVENT
      return false
    end
    is_ade = event['dtstart'].to_s.split('T').length == 1
    is_multi_day = false
    start_date = Time.parse(event['dtstart'].to_s).utc
    end_date = Time.parse(event['dtend'].to_s).utc
    date_diff = Date.diff(end_date, start_date)
    date_num = (date_diff[:year] * 365) + (date_diff[:month] * 30) + date_diff[:day]
    if is_ade
      is_multi_day = date_num  > 1
    else
      is_multi_day = date_num != 0
    end

    return is_multi_day
  end
  
  def self.filter_by_trash(trash_items, obj_id)
    # existed = false
#     
    # for trash_item in trash_items
      # if trash_item[:obj_id].to_s.eql?(obj_id.to_s)
        # existed = true
        # break
      # end
    # end
#     
    # existed
    return !trash_items[obj_id].nil?
  end
end
