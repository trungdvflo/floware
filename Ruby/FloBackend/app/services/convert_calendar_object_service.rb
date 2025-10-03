class ConvertCalendarObjectService
  def initialize
  end

  def execute(records, isHashObj = false, trashed_items = nil, opts = nil)
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
        if type == API_VEVENT
          tzid = calendar.timezones.first&.tzid || ''
        end
        hash_calendar_objects = { VEVENT: calendar.events,
                                  VTODO: calendar.todos,
                                  VJOURNAL: calendar.journals }
        calendar_objects = hash_calendar_objects[type.to_sym] || []

        calendar_objects.each do |o|
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
                  action: al.action ? al.action : nil,
                  summary: al.summary ? al.summary : nil,
                  description: al.description ? al.description : nil,
                  repeat: al.repeat ? al.repeat : nil,
                  duration: al.duration ? al.duration : nil,
                  attach: al.attach ? al.attach : nil,
                  attendee: al.attendee ? al.attendee : nil,
                  custom_properties: al.custom_properties ? al.custom_properties : nil # custom properties of alarms object from another app
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
              id: record.id ? record.id : '',
              cal_uri: record.uri ? record.uri : '',
              uid: o.uid ? o.uid : '',
              summary: o.summary ? o.summary : '',
              url: o.url ? o.url : '',
              location: o.location ? o.location : '',
              description: o.description ? o.description : '',
              dtstamp: o.dtstamp ? o.dtstamp : '',
              last_modified: o.last_modified ? o.last_modified : '', 
              dtstart: o.dtstart ? o.dtstart : '',
              tzid: o.dtstart && o.dtstart.ical_params[:tzid] ? o.dtstart.ical_params[:tzid][0] : '',
              dtend: o.dtend ? o.dtend : '',
              status: o.status ? o.status : '',
              organizer: o.organizer ? o.organizer : '',
              categories: o.categories ? o.categories[0] : '',
              sequence: o.sequence ? o.sequence : 0 ,
              created: o.created ? o.created : '',
              color: o.x_lcl_color ? o.x_lcl_color[0] : '', #record.calendarcolor ? record.calendarcolor : '', #(o.x_lcl_color ? o.x_lcl_color[0] : '')
              specified_color: o.x_lcl_color ? o.x_lcl_color[0] : '',
              itemType: type,
              link_created_date: record.methods.include?(:created_date) ? record.created_date : nil,
              star: o.x_lcl_star ? o.x_lcl_star : nil
            }

            if type == API_VTODO
              if !customObj[:tzid].nil? && !o.due.nil?
                customObj[:tzid] = o.due && o.due.ical_params['tzid'] ? o.due.ical_params['tzid'][0] : ''
              end

              if !customObj[:tzid].nil? && o.completed
                customObj[:tzid] = o.completed && o.completed.ical_params['tzid'] ? o.completed.ical_params['tzid'][0] : ''
              end
            end

            if type == API_VEVENT || o.x_lcl_stask

              if type == API_VEVENT
                customObj[:transp] = o.transp ? o.transp : ''
              end
              attendees = o.attendee ? o.attendee : nil

              customObj[:attendee] = Array.new
              if !attendees.nil? && !attendees.empty?
                attendees.each do |att|
                  attendee = att.ical_params
                  attendee[:email] = att 
                  customObj[:attendee] << attendee
                end
              end

              # city of current timezone
              customObj[:tzcity] = o.x_lcl_tzcity ? o.x_lcl_tzcity[0] : ''
              # stask properties
              customObj[:stask] = o.x_lcl_stask ? o.x_lcl_stask : ''
              if o.x_lcl_stask
                customObj[:subtasks] = o.x_lcl_subtasks ? o.x_lcl_subtasks[0] : ''
                customObj[:duration] = o.duration ? o.duration : ''
                customObj[:completed] = o.completed ? o.completed : ''
                customObj[:due] = o.due ? o.due : ''
              end
  
              customObj[:rrule] = o.rrule ? o.rrule[0] : ''
              customObj[:exdate] = o.exdate ? o.exdate : ''
              customObj[:recurid] = o.recurrence_id ? o.recurrence_id : ''
              
              customObj[alarms] = alarms
              
            elsif type == API_VTODO
              customObj[:subtasks] = o.x_lcl_subtasks ? o.x_lcl_subtasks[0] : ''
              customObj[:duration] = o.duration ? o.duration : ''
              customObj[:completed] = o.completed ? o.completed : ''
              customObj[:due] = o.due ? o.due : ''
              customObj[:alarms] = alarms
              
            elsif type == API_VJOURNAL
              customObj[:notecontent] = o.x_lcl_notecontent ? o.x_lcl_notecontent[0] : ''
              customObj[:inlineattachments] = o.x_lcl_inlineattachments ? o.x_lcl_inlineattachments[0] : ''
              customObj[:floware_only] = o.floware_only ? o.floware_only[0] : ''
            end

            #3rd Object
            if isHashObj
              if !o.dtstart.nil?
                case o.dtstart.ical_params[:tzid]
                when Array then 
                     customObj[:tzid] = o.dtstart.ical_params[:tzid][0]
                when String then
                     customObj[:tzid] = o.dtstart.ical_params[:tzid]
                end
              end
              
              if type != API_VJOURNAL && !customObj[tzid].nil? && !o.due.nil? && o.due.length > 0
                  case o.due.ical_params['tzid']
                  when Array then 
                       customObj[:tzid] = o.due.ical_params[:tzid][0]
                  when String then 
                       customObj[:tzid] = o.due.ical_params[:tzid]
                  end
              end
              
              if type != API_VJOURNAL && !customObj[:tzid].nil?
                if !o.completed.nil? && o.completed.length > 0
                  case o.completed.ical_params['tzid']
                  when Array then 
                       customObj[:tzid] = o.completed.ical_params[:tzid][0]
                  when String then 
                       customObj[:tzid] = o.completed.ical_params[:tzid]
                  end
                end
              end
              
              if customObj[:tzid] && customObj[:tzid].eql?('UTC')
                if tzid
                  customObj[:tzid] = tzid
                end
              end
              
              if !o.custom_properties.empty?
                  full_name = ''
                  if !o.custom_properties[:x_first_name].empty?
                      full_name = full_name + o.custom_properties[:x_first_name][0].to_str
                  end
                  if !o.custom_properties['x_last_name'].empty?
                      full_name = full_name + " " + o.custom_properties[:x_last_name][0].to_str
                  end
                  
                  if !full_name.empty?
                    # Requirement:
                    # show suffix "'s Birthday" for birthday event has name.
                    # Otherwise, show "Unknown Person" for empty fullname
                    if full_name.strip.blank?
                      customObj[:summary] = "Unknown Person"
                    else
                      customObj[:summary] = full_name + "'s Birthday"
                    end
                    
                    customObj[:isBirthDay] = true
                  end
              end

              if type == API_VTODO
                if !o.x_yahoo_duration.empty?
                  customObj[:duration] = o.x_yahoo_duration ? o.x_yahoo_duration : ''
                end
              end
              
              if record.tpObjType.present?
                customObj[:tpObjType] = record.tpObjType
                customObj[:tpAccount] = record.tpAccount
                customObj[:isReadOnly] = record.isReadOnly
              end
              customObj[:color] = record.calendarcolor
            end

            if type == API_VEVENT || o.x_lcl_stask
              if last_event.blank? || (!last_event.blank? && customObj[:dtstart] && last_event[:dtstart] && 
                                        Time.parse(last_event[:dtstart].to_s).utc < Time.parse(customObj[:dtstart].to_s).utc)
                last_event = customObj
              end

              if first_event.blank? || (!first_event.blank? && customObj[:dtstart] && first_event[:dtstart] &&
                  Time.parse(first_event[:dtstart].to_s).utc > Time.parse(customObj[:dtstart].to_s).utc)
                first_event = customObj
              end
              
              if !opts.empty? && !customObj[:rrule] && !multi_day_event?(customObj)
                 next if Time.parse(customObj[:dtstart].to_s).utc  < opts[:prev] ||
                         Time.parse(customObj[:dtstart].to_s).utc > opts[:next]
              end
            end
          arr << customObj
        end
        rescue
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

  def multi_day_event?(event)
    if !event[:rrule].nil? || !event[:stask].empty? || event[:itemType] != API_VEVENT
      return false
    end
    is_ade = event[:dtstart].to_s.split('T').length == 1
    is_multi_day = false
    start_date = Time.parse(event[:dtstart].to_s).utc
    end_date = Time.parse(event[:dtend].to_s).utc
    date_diff = Date.diff(end_date, start_date)
    date_num = (date_diff[:year] * 365) + (date_diff[:month] * 30) + date_diff[:day]
    if is_ade
      is_multi_day = date_num  > 1
    else
      is_multi_day = date_num != 0
    end

    return is_multi_day
  end
end
