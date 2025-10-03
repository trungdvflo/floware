require "./lib/app_utils.rb"
require 'benchmark'
require './lib/change_calendars'
require 'icalendar/alarm.rb'
require 'json'

class Api::CaldavController < Api::BaseController
  include AppUtils
  
  attr :cal, :url, :user, :password, :authtype
  before_action :authenticate_with_sabre_caldav_server, :except => [:getlist_calendars]
  
  def getlist_calendars
    email = current_user_id.email if current_user_id
    cals = Calendar.where(principaluri: "principals/#{email}")
    @listCals = Array.new
    if cals
      cals.each{ |cal|
        invisible = false
        if !cal.invisible.nil?
          invisible = cal.invisible
        end

        # ################################
        # #convert unicode
        # fallback = {
        #   "\u0081" => "\x81".force_encoding("CP1252"),
        #   "\u008D" => "\x8D".force_encoding("CP1252"),
        #   "\u008F" => "\x8F".force_encoding("CP1252"),
        #   "\u0090" => "\x90".force_encoding("CP1252"),
        #   "\u009D" => "\x9D".force_encoding("CP1252")
        # }
        # #calendar name
        # begin
        #   cal.displayname = cal.displayname.encode('CP1252', fallback: fallback).force_encoding('UTF-8')
        # rescue
        # end
        # #calendar description
        # begin
        #   cal.description = cal.description.encode('CP1252', fallback: fallback).force_encoding('UTF-8')
        # rescue
        # end
        # ################################

        # # puts '================='
        # # puts str.encoding
        # # puts str.encode('CP1252', fallback: fallback).force_encoding('UTF-8')
        # #encode("Windows-1252").force_encoding("UTF-8")
        # # puts str.force_encoding('UTF-8').encode('windows-1252')
        # #.encode('windows-1252')
        # # puts '================='

          item = { 'id'   => cal.id,
                   'name' => cal.displayname,
                   'href' => CALENDAR_PROCESS_URL + email + "/" + cal.uri,
                   'uri' => cal.uri,
                   'color'=> cal.calendarcolor,
                   'des'  => cal.description,
                   'transparent' => cal.transparent,
                   'invisible' => invisible,
                   'components' => cal.components
                 }
          @listCals << item
      }
    end

    respond_to do |format|
      format.json {render :json => @listCals.to_json(:root => "CALENDAR" )}
    end #end respond
  end
  
  def getlist_calendars_via_caldav
    @listCals = @cal.getlistcalendars
    respond_to do |format|
      format.json {render :json => @listCals.to_json(:root => "CALENDAR" )}
    end #end respond
  end
  
  def get_cal_info
    calendar = params[:calendar]
    cal_info = @cal.getacalendar(calendar)
    respond_to do |format|
      format.json {render :json => (cal_info).to_json(:root => "CALENDAR" )}
    end #end respond
  end 
  
  def get_all_events
    #calendarid = params[:calendarid]
    email = current_user_id.email if current_user_id
    events = Array.new
    evs = CalendarObject.get_all_events_with_color_attr(email)
    #evs = CalendarObject.find(:all, :joins => "LEFT JOIN calendars ON calendars.id = calendarid",:conditions =>["principaluri = ? and componenttype = 'VEVENT'","principals/#{email}"])
    #evs = CalendarObject.find(:all, :conditions =>["calendarid = ? and componenttype = 'VEVENT'", calendarid])
    if evs
      evs.each{|event|
        begin
          data = event.calendardata
          # data = data.encode("iso-8859-1").force_encoding("utf-8")
          calendar = Icalendar::Parser.new(data).parse.first
          calendar.events.each do |ev|
            e = {
              'calendar_object' => ev.to_ical(),
              'color' => event.calendarcolor,
              'cal_uri' => event.uri
            }
            events << e
          end
        rescue          
        end
      }
    end

    respond_to do |format|
      format.json {render :json => events.to_json(:root => "CALENDAR_OBJECTS" )}
    end #end respond
  end
  
  def get_all_cos_via_caldav
    cals   = params[:cals]
    obj_type   = params[:obj_type]
    min_range = params[:prev].to_datetime 
    max_range = params[:next].to_datetime
    
    # bom = Date.today.at_beginning_of_month
    # minRange = bom.prev_month
    # eom = Date.today.at_end_of_month
    # maxRange = eom.next_month
    
    cal_objs = Array.new
    if cals
      cals.each do |cal|
        next if cal[1][:uri].nil?
        
        cos = @cal.report(cal[1][:uri], obj_type, min_range..max_range)
        if cos
          cos.each do |obj|
            obj['calendarcolor'] = cal[1][:color]
            obj['componenttype'] = obj_type
          end
        end
        
        objs = Array.new
        if !cos.nil?
          if !cos[0].nil? && !cos[0][:error].nil?
            objs = cos
          else
            objs = Api::Web::Utils.convert_calendar_obj(cos, true)
          end
        end
        if objs.length
          objs.each do |obj|
            cal_objs << obj  
          end
        end
      end
    end
    
   respond_to do |format|
      format.json {render :json => cal_objs.to_json(:root => API_CALENDAR_OBJECTS )}
    end
  end
  
  # get all calendar objects
  # TODO: should change data of varriable calObjs with uri to calendar_uri
  # avoid confuse with uri of table CalendarObject
  def get_calendar_objects
    user_info = {
      :email => current_user_id.email,
      :user_id => current_user_id.user_id
    }
     
    obj_type = params[:obj_type]
    email = current_user_id.email if current_user_id
    
    # Need to query by uid:
    # We will not have to strip '.ics' string to each uid before doing a query,
    # and in somecase, the uri value can different from uid. 
    uids = params[:uris]

    if uids.present? && !uids.kind_of?(Array)
      uids = uids.split(',')
    end

    trashed_items = {}
    if !params[:include_trash] # obj_type doesn't work with stodo
      # Convert active record resuls to hash for checking the existent item in trash
      # {'object-uri-abcd-xyz' => 1} 
      if obj_type.eql?('VJOURNAL') || obj_type.eql?('VTODO')
        trashed_items =  Trash.where(user_id: @user_id, obj_type: obj_type)
        .each_with_object({}) do |el, hash|
          hash[el[:obj_id]] = 1
        end
      else
        trashed_items =  Trash.where("user_id = ? AND (obj_type ='VEVENT' OR obj_type ='VTODO')", @user_id)
        .each_with_object({}) do |el, hash|
          hash[el[:obj_id]] = 1
        end
      end
      
    end

    # calObjs = nil
    # stodo_objs = nil
    # cur_items, next_items = nil, nil
    #
    # Benchmark.bm do |x|
    # x.report("slow #{obj_type}:")   {
    opts = {}

    if params[:col_sort].present? and params[:type_sort].present?
      opts = {
          all_type: obj_type,
          col_sort: params[:col_sort],
          type_sort: params[:type_sort]
      }
    # elsif params[:type_sort].present? and obj_type.eql?('VEVENT')
    #   opts = {
    #       all_type: obj_type,
    #       type_sort: params[:type_sort]
    #   }
    end
    if obj_type.eql?('VJOURNAL') || obj_type.eql?('VTODO')
      cur_items = params[:cur_items]
      next_items = params[:next_items]
      cal_objs = CalendarObject.
          get_calendar_objects(user_info, obj_type, uids, cur_items, next_items, opts)
    else
      if params[:folder_id]
        cal_objs = CalendarObject.get_calendar_objects_by_folder_id(user_info, obj_type, params[:folder_id])
        stodo_objs = CalendarObject.get_calendar_objects_by_folder_id(user_info, 'VTODO', params[:folder_id])
      else
        cal_objs = CalendarObject.get_calendar_objects(user_info, obj_type, uids, nil, nil, opts)
        stodo_objs = CalendarObject.get_calendar_objects(user_info, 'STODO', uids, nil, nil, opts)
      end
    end
    # }
    # end
    
    months = params[:months]
    if months.present?
      if months.length === 1
        month = months[0].to_s
        bom = Time.parse(month).utc.at_beginning_of_month
        eom = Time.parse(month).utc.at_end_of_month
      else
        bom = Time.parse(months[0].to_s).utc
        eom = Time.parse(months[months.length - 1].to_s).utc
      end
      opts[:prev] = bom.utc
      opts[:next] = eom.utc
      # objs = Api::Web::Utils.convert_calendar_obj(cal_objs, false, trashed_items, opts) if cal_objs
    else
      # objs = Api::Web::Utils.convert_calendar_obj(cal_objs, false, trashed_items) if cal_objs
    end
    objs = Api::Web::Utils.convert_calendar_obj(cal_objs, false, trashed_items, opts) if cal_objs

    if stodo_objs
      if opts.nil?
        opts = {}
      end
      opts[:stodo] = 1
      stodos = Api::Web::Utils.convert_calendar_obj(stodo_objs, false, trashed_items, opts)
      if stodos
        objs[:data] += stodos[:data]
        objs[:num_of_trashed_items] = objs[:num_of_trashed_items] + stodos[:num_of_trashed_items]
        objs[:num_of_errors] = objs[:num_of_errors] + stodos[:num_of_errors]
        objs[:total_num_of_items] = objs[:total_num_of_items] + stodos[:total_num_of_items]
      end
    end

    if obj_type.eql?('VTODO')
      data = objs[:data]
      arr_dup = data.map { |d| d['order_number']}.compact
                    .group_by{|e| e}
                    .keep_if{|_, e| e.length > 1}

      max_order = data.map { |d| d['order_number'] }.compact.max
      data.each do |d|
        if d['order_number'].blank?
          min = ObjOrder.get_min_order(@user_id)
          order = min.min_order ? (min.min_order - 1): 0
          __insertToObjOrder(d, true)
          d['order_number'] = order
        elsif arr_dup.include? d['order_number']
          max_order += 1
          d['order_number'] = max_order
          obj_order = ObjOrder.find_by(obj_id: d['uid'].to_s)
          obj_order.order_number = d['order_number']
          obj_order.save
        end
      end

      data.sort_by! do |d|
        d['order_number']
      end
    end

    respond_to do |format|
      format.json {render :json => objs.to_json(:root => API_CALENDAR_OBJECTS )}
    end
  end
  
  def get_calendar_objects_via_caldav
    months = params[:months]
    if months.present?
      # Get data by months
      if months.length === 1
        month = months[0].to_s
        bom = Time.parse(month).utc.at_beginning_of_month
        eom = Time.parse(month).utc.at_end_of_month

        min_range = bom.prev_month
        max_range = eom.next_month
      else
        bom = Time.parse(months[0].to_s).utc
        eom = Time.parse(months[months.length - 1].to_s).utc

        min_range = bom
        max_range = eom
      end

    else
      # Get data in three months (Prev & Current & Next months)
      bom = Date.today.at_beginning_of_month
      eom = Date.today.at_end_of_month

      min_range = bom.prev_month
      max_range = eom.next_month
    end
     
    objType = params[:obj_type]    
    trashed_items = {}
    if !params[:include_trash] # obj_type doesn't work with stodo
      # Convert active record resuls to hash for checking the existent item in trash
      # {'object-uri-abcd-xyz' => 1}
      trashed_items =  Trash.where("user_id = ? AND (obj_type ='VEVENT' OR obj_type ='VTODO')", @user_id)
      .each_with_object({}) do |el, hash|
        hash[el[:obj_id]] = 1
      end
    end
    
    
    cal_objs = Array.new
    res_errors = Array.new
    obj_type   = params[:obj_type]
    cals = params[:cals]
    if cals.present?
      cals.each do |cal|        
        results = @cal.report(cal[:uri], obj_type, min_range..max_range)
        if results
          
          if results.length > 0
            if !results[0].nil? && !results[0][:error].nil? && results[0][:error][:code].to_i == 401
              # Reponse the error immediately if there is an invalid credential 401 request
              res_errors = results
              break
            end
          end
          
          results.each do |obj|
            obj['calendarcolor'] = cal[:color]
            obj['isReadOnly'] = cal[:read_only]
            obj['componenttype'] = obj_type
          end
          
          cal_objs.concat(results)
        end
      end
    end
    
    res_objs = Array.new
    if res_errors.present?
      res_objs = res_errors
    else
      if cal_objs.present?
        res_objs = Api::Web::Utils.convert_calendar_obj(cal_objs, true, trashed_items)
      else
        res_objs = {
          data: [],
          num_of_trashed_items: 0,
          num_of_errors: 0,
          total_num_of_items: 0
        }
      end
    end
    
    respond_to do |format|
      format.json {render :json => res_objs.to_json(:root => API_CALENDAR_OBJECTS )}
    end
  end

  def find_events_by_range
    st = (Time.now.to_date).beginning_of_day.to_i 
    et = (Time.now.to_date).end_of_day.to_i
    st = (Time.parse(params[:starttime]).to_date ).beginning_of_day.to_i if params[:starttime]
    et = (Time.parse(params[:endtime]).to_date).end_of_day.to_i if params[:endtime]
    
    email = ''
    email = current_user_id.email if current_user_id
    principal = 'principaluri = "principals/' + email.to_s + '"'
    range = {}
    # range[:start] = Time.parse(st).to_date.beginning_of_day.to_i
    # range[:end] = Time.parse(et).to_date.end_of_day.to_i
    range[:start] = st
    range[:end] = et
    
    objs = Array.new
    cals = Calendar.where(principal)
    if cals and cals.length > 0
      cals.each do |cal|
        arrEvent = @cal.find_events(cal.uri, range)
        if arrEvent and arrEvent.length > 0
          arrEvent.each do |eve|
            objs << eve if eve            
          end
        end
      end
    end
    
    respond_to do |format|
      format.json {render :json => objs.to_json(:root => API_CALENDAR_OBJECTS )}
    end #end respond
  end

  def get_all_items_by_caluri
    objs = Array.new        
    cal_uri = params[:caluri]
    if cal_uri
      objs = @cal.get_all_items_by_cal(cal_uri)      
    end
    
    respond_to do |format|
      format.json {render :json => objs.to_json(:root => API_CALENDAR_OBJECTS )}
    end
  end
  
  #count count_objs, todo and note by folder, calendar
  def count_objs
    countBy = params[:countby]
    email = ''
    email = current_user_id.email if current_user_id
    res = Array.new()
    if countBy and countBy.to_i != 0
      if countBy.to_i == 1 #count by folder
        
      elsif countBy.to_i == 2 #count by calendar
        
      end
    else #count all
      res = CalendarObject.count_calendar_obj(email)
    end
    
    respond_to do |format|
      format.json {render :json => res.to_json(:root => API_CALENDAR_OBJECTS )}
    end
  end

  # search calendar object
  def search_calendar_objects
    cals = params[:calendars]
    keyword = params[:keyword]
    keyword = '' if !params[:keyword]
    email = current_user_id.email if current_user_id
    objs = Array.new
    if cals and cals.length > 0
      arrCalUri = cals.split(',')
      if arrCalUri and arrCalUri.length > 0
        arrCalUri.each do |caluri|
          calObjs = @cal.find_calendar_objects(caluri, keyword)
          if calObjs and calObjs.length > 0
            calObjs.each do |item|
              objs << item
            end
          end
        end
      end
    end    

    # if calObjs
    #   calObjs.each{|obj|
    #     begin
    #       calendar = Icalendar::Parser.new(obj.calendardata).parse.first
    #       calObjsLst = calendar.events
    #       calObjsLst = calendar.todos if obj_type.to_s == API_VTODO
    #       calObjsLst = calendar.journals if obj_type.to_s == API_VJOURNAL
    #       calObjsLst.each do |ev|
    #         item = {
    #           'calendar_object' => ev.to_ical(),
    #           'color' => obj.calendarcolor,
    #           'cal_uri' => obj.uri
    #         }
    #         objs << item
    #       end
    #     rescue
    #     end
    #   }
    # end
    respond_to do |format|
      format.json {render :json => objs.to_json(:root => "CALENDAR_OBJECTS" )}
    end #end respond
  end

  # get all items by folderid
  def search_calobjs_by_folderid
    # cals = params[:cals_uri]
    folderid = params[:folderid]
    folderid = '' if !params[:folderid]
    email = current_user_id.email if current_user_id    
    cals = Calendar.where(principaluri: 'principals/#{email}')
    objs = Array.new
    if cals and cals.length > 0
      # arrCalUri = cals.split(',')
      # if arrCalUri and arrCalUri.length > 0
        cals.each do |cal|
          calObjs = @cal.get_all_calobjs_by_folderid(cal.uri, folderid)
          # objs << calObjs 
          if calObjs and calObjs.length > 0
            calObjs.each do |item|
              objs << item
            end
          end
        end
      # end
    end    

    respond_to do |format|
      format.json {render :json => objs.to_json(:root => API_CALENDAR_OBJECTS )}
    end
  end  

  def create_calendar
    calendar_tz = @cal.createTimezone.to_ical
    calendar = JSON.parse(params[:calendar])
    uri = calendar['uri']
    calendar_name = calendar['calendar_name']
    calendar_discription = calendar['des']
    color = calendar['color']#Api::Web::Utils.random_calendar_color()
    res = {}
    res[:result] = 0
    # calendar_name = calendar_name.force_encoding("UTF-8")
    # calendar_name = calendar_name.encode("UTF-8")
    result =  @cal.create_calendar(uri, calendar_name.to_s, calendar_discription.to_s, calendar_tz, color)
    if result
        res[:result]  = 1
    end
    render :json => res
  end
  
  def update_calendar
    calendar_url = params[:uri]
    color = params[:color]
    displayname = params[:calname]
    des = params[:description]
    res = {}
    res[:result] = 0
    result = cal.update_calendar(calendar_url, displayname, color, des)
    if result
        res[:result]  = 1
    end
    # auto update  folder color
    begin
      Project.update_folder_color(calendar_url, color) if calendar_url and color
    rescue
    end    

    render :json => res
  end
  
  # def show_hide_calendar
    # calendar_url = params[:uri]
    # invisible = params[:invisible]
    # res = {}
    # res[:result] = 0
    # result = cal.update_calendar(calendar_url, invisible)
    # if result
        # res[:result]  = 1
    # end
# 
    # render :json => res
  # end
  #update application
  def show_hide_calendar
    #parameters
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    email = ''
    email = current_user_id.email if current_user_id 
    #respond
    respond_list = Array.new()
    calendar_uri = params[:uri]
    invisible = params[:invisible]
    calendar = Calendar.find_by(principaluri: "principals/#{email}", uri: calendar_uri)
    if calendar
      calendar.invisible = invisible.to_i
      calendar.save
      respond_list = calendar
    else
      respond_list = {:error => 1, :description => "Calendar not found"}
    end
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_VCALENDAR)}
    end
  end

  #delete calendar
  def delete_calendar
    uri = params[:uri]
    res = {}
    user_id = current_user_id.user_id if current_user_id
    res[:result] = 0
    if uri and uri.length > 0
      result = cal.delete_calendar(uri)
      # if delete calendar successful, it will auto map folder to default calendar
      if result
        # defCalUri = params[:def_cal_uri]
        defCalUri = Setting.find_by_user_id(user_id)
        proj = Project.update_default_calendar(uri, defCalUri.default_cal) if defCalUri
      end
      res[:result] = result
    end
    render :json => res
  end
  
  # def get_event     
      # cal_uid = params[:cal]
      # e_uid = params[:uid]
      # ev = cal.find_event(cal_uid, e_uid)
      # e = {'event' => ev.to_ical()}
      # respond_to do |format|
        # format.xml {render :xml => e.to_xml(:root => "EVENT" )}
        # format.json {render :json => e.to_json(:root => "EVENT" )}
      # end #end respond
  # end
  def get_calendar_object     
    cal_uri = params[:cal_uri]
    uid = params[:uid]
    obj_type= params[:obj_type]
    account_id = params[:account_id]
    if account_id.to_i == 0
      cal_obj = cal.find_event(cal_uri, uid, obj_type)
    else
      cal_obj = get_calendar_objects_3rd(cal_uri, uid, obj_type, account_id)
    end
    respond_to do |format|
      format.json {render :json => cal_obj.to_json(:root => API_CALENDAR_OBJECTS )}
    end
  end

  # Method này thực hiện gọi worker và trả ra Job ID để chúng ta track status
  def check_change_job
    obj_type= params[:obj_type]
    account_id = params[:account_id]
    months = params[:months]

    email = current_user_id.email if current_user_id
    type_req = params[:type]

    respond_to do |format|
      format.json do
        job_id = ExportUserWorker.perform_async(@user_id, email, type_req, account_id, months, obj_type)

        render json: {
            job_id: job_id
        }
      end
    end
  end

  # Method này sẽ track job status theo Job ID
  def check_change_job_status
    respond_to do |format|
      format.json do
        job_id = params[:job_id]
        # Method get_all này trả ra cho chúng ta khá nhiều dữ liệu
        # các bạn có thể xem thêm tại Github của gem
        job_status = Sidekiq::Status.get_all(job_id).symbolize_keys

        render json: {
            # Status hiện tại của job
            status: job_status[:status],
            # % hoàn thành của job
            percentage: job_status[:pct_complete]
        }
      end
    end
  end

  # Method này sẽ trả lại file đã được export cho người dùng
  def check_change_download
    job_id = params[:job_id]
    data = ChangeCalendars.get(job_id)
    if data.present?
      respond_to do |format|
        format.json do
          render json: data
        end
      end
    else
      render json: {}, status: :not_found
    end
    # exported_file_name = "users_export_#{job_id}.json"
    # filename = "UserData_#{DateTime.now.strftime("%Y%m%d_%H%M%S")}"
    #
    # respond_to do |format|
    #   format.json do
    #     send_file Rails.root.join("tmp", exported_file_name), type: :json, filename: filename
    #   end
    # end
  end

  def get_calendar_objects_3rd(cal_uri, uid, obj_type, account_id)
    links = []
    tp_links = []
    tp_data = []

    if uid.present?
      links = [{
                   :id =>         uid,
                   :type =>       obj_type,
                   :account_id => account_id,
                   :root_id =>    cal_uri
               }]

      # separate link from 3rd party account
      links_partition = links.partition do |x|
        x[:type] != 'FOLDER' && x[:type] != 'EMAIL'
      end

      # case: partition return true array
      tp_links = links_partition[0]

      # case: partition return false array
      links = links_partition[1]
      links = links.group_by {|x| x[:type]}.except('FOLDER')

      # get 3rd party object
      if tp_links.any?
        # get data for 3rd object
        # TODO: get data of 3rd object by UID
        tp_data = __get_tp_link_data(tp_links)
        if tp_data.any?
          tp_data.map {|x| x['type'] = x['itemType'] || x[:type]}
        end
      end

      # get links data by its types & ids
      ids = []
      data = []
      links.each do |key, value|
        case key
        when 'VTODO', 'VJOURNAL', 'VEVENT', 'STODO'
          data.concat(__get_co_data(value))
        when 'VCARD'
          data.concat(__get_contact_data(value))
        when 'EMAIL'
          data.concat(__get_email_data(value))
        when 'URL'
          data.concat(__get_url_data(value))
        end
      end
      data.map! do |d|
        if d[:itemType].blank?
          d.merge({ :is_invalid => true})
        else
          d
        end
      end

      #include tp data
      data.concat(tp_data) if tp_data.any?

      # only get id in trash to check case (trashed)
      trash_ids = __get_trash_id
      data.push(trash_ids) if trash_ids

      # group link data by type
      data = data.group_by {|x| x['type']}
    end
    data
  end
  
  def create_a_event
      calendar = params[:calendar]
      icalEvent = params[:event]
      uuid = UUID.new.generate
      raise DuplicateError if entry_with_uuid_exists?(uuid)
      e= Icalendar::Event.new(event)
      e.uid           = uuid 
      e.dtstart       = DateTime.parse(event[:dtstart])
      e.dtend         = DateTime.parse(event[:dtend])
      # .categories    = event[:categories]# Array
      #e.contact       = event[:contact] # Array
      #e.attendee      = event[:attendee]# Array
      e.duration      = event[:duration]
      e.summary       = event[:summary]
      e.description   = event[:description]
      #e.ip_class      = event[:accessibility] #PUBLIC, PRIVATE, CONFIDENTIAL
      e.location      = event[:location]
      #e.geo           = event[:geo]
      #e.status        = event[:status]
      e.url           = event[:url]
      # e.subtasks   = "[{'id':'01','title':'subtask01','checked':true},{'id':'02','title':'subtask02','checked':true},{'id':'03','title':'subtask03','checked':true}]"
      
      # event[:start] = event
      # event[:end] = "2014-05-14 14:00"
      # event[:title] = "JO 04"
      # event[:duration] = 3600
      # event[:description] = "Cộng hòa xã hội chủ nghĩa việt nam"
      # event[:location] = "LCL's Office, Hồ Văn Huê, Phú Nhuận, Hồ Chí Minh"
      # event[:url] = "http://www.flow-mail.com"
      result = @cal.create_event(e, calendar)
      return result
    end
    
    def create_a_event_by_string
      calendar = params[:calendar]
      icalEvent = params[:icalEvent]
      uuid = params[:uuid]
      result = @cal.create_calobj_by_ical(uuid, icalEvent, calendar)
      res = {}
      res[:result] = 0
      if result
        res[:result]  = 1
      end
      render :json => res
    end

    # create/update calendar object by string format from client
    def create_calobj_by_string 
      result = __create_calobj(params[:uuid],  params[:calobj], params[:caluri])
      res = {}
      res[:result] = 0
      if result
        # get ID of Calendar Object have just created.
        type = CalendarObject.find_by_uid(params[:uuid]).componenttype
        if type == "VTODO"
          newTodo = {
            'uid' => params[:uuid],
            'itemType' => type
          }

          new_order = __insertToObjOrder(newTodo, true)
          if new_order.eql?'true'
            # response order number to client
            res[:order_number] = ObjOrder.last().order_number
          else
            res[:order_number] = new_order  
          end
          
        end

        res[:result]  = 1
      end      
      render :json => res
    end

    def create_calobjs
      respond_list = []
      
      cos = params[:cos]
      if cos.present?
        ActiveRecord::Base.transaction do
          cos.each do |co|
            result = __create_calobj(co[:uuid],  co[:calobj], co[:caluri])
            res = {}
            res[:result] = 0
            if result
              res[:result]  = 1
              res[:uid] = co[:uuid]
              res[:item_type] = co[:item_type]

              if res[:item_type] == "VTODO"
                newTodo = {
                  'uid' => co[:uuid],
                  'itemType' => res[:item_type]
                }
                
                new_order = __insertToObjOrder(newTodo, true)
                if new_order.eql?'true'
                  # response order number to client
                  res[:order_number] = ObjOrder.last().order_number
                else
                  res[:order_number] = new_order  
                end
              end
            end
            respond_list << res
          end
        end
      end
      
      respond_to do |format|
        format.json {render :json => respond_list.to_json(:root => "CALENDAR" )}
      end
    end

    # delete calendar object
    def delete_calendar_obj
      result = __delete_calendar_obj(params[:uid], params[:cal_uri], params[:itemType])
      res = {}
      res[:result] = 0
      if result
        res[:result] = 1
      end
      render :json => res
    end
    
    def update_event_by_strIcalEvent
      calendar = params[:calendar]
      icalEvent = params[:icalEvent]
      uuid = params[:uuid]
      result = @cal.update_event_by_strIcalEvent(uuid, icalEvent, calendar)
      res = {}
      res[:result] = 0
      if result
        res[:result]  = 1
      end
      render :json => res
    end
    
    def delete_cos
      respond_list = []
      
      cos = params[:cos]
      if cos.present?
        ids_del = []
        ActiveRecord::Base.transaction do
          cos.each do |co|
            result = __delete_calendar_obj(co[:uid], co[:cal_uri], co[:itemType])
            res = {}
            res[:result] = 0
            if result
              res[:result]  = 1
              res[:uid] = co[:uid]
              res[:itemType] = co[:itemType]
              ids_del << co[:uid]
            end
            respond_list << res
          end
          # cos_deleted = respond_list.map {|r| r[:uid] if r[:result] == 1}
          # user_id = current_user_id.user_id if current_user_id
          # Link.del_by_uids user_id, cos_deleted
          d_items = Trash.where(user_id: @user_id, obj_id: ids_del).destroy_all
          d_items.each { |x| save_delete_item(API_TRASH, x.id, 0) }

          cos_deleted = respond_list.map {|r| { obj_id: r[:uid], obj_type: r[:itemType] } if r[:result] == 1}
          d_items_del = d_items.map {|r| { obj_id: r[:obj_id], obj_type: r[:obj_type] } }
          user_id = current_user_id.user_id if current_user_id

          # d_canvas_detail = Canvas.find_by_item_ids(user_id, ids_del)
          # d_canvas_detail.each { |x| save_delete_item(API_CANVAS_TYPE, x.id, 0) }
          # d_canvas_detail.destroy_all
          # d_canvas_detail = Canvas.destroy_all(user_id: @user_id, item_id: ids_del)
          # d_canvas_detail.each { |x| save_delete_item(API_CANVAS_TYPE, x.id, 0) }
          deleted_item_srv = CanvasService.new(d_items: d_items_del, user_id: @user_id)
          deleted_item_srv.execute_it

          deleted_item_srv = LinkService.new(d_items: d_items_del, user_id: @user_id)
          deleted_item_srv.execute_it
        end
      end
      
      respond_to do |format|
        format.json {render :json => respond_list.to_json(:root => "CALENDAR" )}
      end
  end
    
    #send mail to invitee
    def send_meeting_invite
      invitees = params[:attendees]
      status = params[:sendWithICS]
      fromEmail = params[:owner]
      subject = params[:title]
      body = params[:emailTemplate]
      uri = params[:uuid]
      icsFile = ""
      obj = CalendarObject.where(uri: uri.to_s + ".ics").first
      icsFile = obj.calendardata.to_s if obj
      
      if invitees and invitees.length > 0
        arrInvitees = invitees.split(',')
        if arrInvitees and arrInvitees.length > 0
          arrInvitees.each do |invitee|
            if invitee.length > 0
              #send mail
              Thread.new do
                UserMailer.send_mi(fromEmail, invitee, subject, body, status, icsFile).deliver_now
              end
            end
          end
        end
      end
      if (status == true || status == "true" || status == 1)
        res = [{:sent => 0, ics: icsFile}]
      else 
        res = [{:sent => 0}]
      end
      render :json => res
    end

    def __insertToObjOrder(todo, newItem)
      # insert to objOrder (sync order TODO table)
      item = {
        'obj_id' => todo["uid"].to_s,
        'obj_type' => todo["itemType"]
      }
      
      existed = false
      if !item["obj_id"].eql?''
        existed_obj = ObjOrder.find_by(obj_id: item["obj_id"])
        if !existed_obj.nil?
          existed = true
        end  
      end
      
      if !existed
        max = ObjOrder.get_max_order(@user_id)
        min = ObjOrder.get_min_order(@user_id)
        
        # new item from TODO is add to Top list, so I have to use MIN order
        if newItem.present?
          order = order = min.min_order ? (min.min_order - 1): 0
        else
          order = max.max_order ? (max.max_order + 1): 0
        end
        
        ObjOrder.create({:user_id => @user_id, :obj_id => item["obj_id"], :obj_type => item["obj_type"], :order_number => order})
        
        return 'true'
      else
        return existed_obj.order_number
      end
      
      # # insert to objOrder (sync order TODO table)
      # item = {
        # 'obj_id' => todo["id"] ? todo["id"] : '',
        # 'obj_type' => todo["itemType"]
      # }
# 
      # max = ObjOrder.get_max_order(@user_id)
      # min = ObjOrder.get_min_order(@user_id)
#       
      # # new item from TODO is add to Top list, so I have to use MIN order
      # if newItem.present?
        # order = order = min.min_order ? (min.min_order - 1): 0
      # else
        # order = max.max_order ? (max.max_order + 1): 0
      # end
#       
      # ObjOrder.create({:user_id => @user_id, :obj_id => item["obj_id"], :obj_type => item["obj_type"], :order_number => order}) 

    end

    def search_calobj
      query = params[:qs]
      item_type = params[:item_type]
      data = []
      if query.present? && item_type.present?
        # get calendar object    
        data.concat(__search_calobjs(query, item_type))
      end

      data = {"items" => data, "search_term" => query}
      respond_to do |format|
        format.json {render :json => data.to_json()}
      end
    end  

    def __search_calobjs(qs, item_type)
      data = []
      email = current_user_id.email if current_user_id
      cal_objs = CalendarObject.search_co_by_qs(qs, email, item_type)
      # get data of each calObj
      if cal_objs
        cal_objs.each do |x|
          cal_obj_data = __do_get_calobj_data(x)
          # if (cal_obj_data["itemType"] == "VJOURNAL" && cal_obj_data["notecontent"].present?)
          #   # only decode for note content
          #   cal_obj_data["notecontent"] = Base64.decode64(cal_obj_data["notecontent"])
          # end
    
          # have to merge to get color, icon, summary of calendar object
          if !cal_obj_data.nil?
            data.push(cal_obj_data.merge(x))
          end
        end
      end
      data
    end

    def __do_get_calobj_data(item)
      email = current_user_id.email if current_user_id
      user_id = current_user_id.user_id if current_user_id

      user_info = {
        :email => email,
        :user_id => user_id
      }
      objType = item['componenttype']
      uid = item['uid']
  
      if uid.present?
        uid = uid.split(',')
      end      
  
      cal_objs = CalendarObject.get_calendar_objects(user_info, objType, uid, nil, nil)
      objs = Api::Web::Utils.convert_calendar_obj(cal_objs, false) if cal_objs 
      # objs = {:data => [{}]}
      obj = objs[:data].first
    end

    def __get_tp_link_data(tp_links)
      data = []
      tp_links.each do |x|
        # get authen token, account type, password for 3rd account
        acc = SetAccount.where(id: x[:account_id]).first
        
        next if acc.nil?

        x[:auth_token] = acc[:auth_token]
        x[:account_type] = acc[:account_type]
        x[:user_income] = acc[:user_income]
        x[:pass_income] = acc[:pass_income]

        x[:account_sync] = JSON.parse(acc[:account_sync]) if acc[:account_sync].present?

        case x[:account_type]
        when 1
          # google link return {event}
          if x[:auth_token].empty?
            # thirdparty account is inactive in other platform
            x[:inactive] = true
            data.push(x)
          elsif x[:account_sync]['Calendar'] == 0 && x[:type] == 'VEVENT'
            # turn off sync calendar option
            x[:inactive] = true
            data.push(x)
          else
            # compact to delete nil object in array
            data.push(get_google_object(x)).compact
          end
        when 2
          # yahoo link return [event, todo]
          if x[:pass_income].empty?
            # thirdparty account is inactive in other platform
            x[:inactive] = true
            data.push(x)
          elsif x[:account_sync]['Calendar'] == 0 && (x[:type] == 'VEVENT' || x[:type] == 'VTODO')
            # turn off sync calendar option
            x[:inactive] = true
            data.push(x)
          else
            yahoo_objs = get_yahoo_object(x)
            if !yahoo_objs.nil?
              data.concat(yahoo_objs)
            end
          end
        when 5
          
          # icloud link return [event, todo, contact]
          if x[:pass_income].empty?
            # thirdparty account is inactive in other platform
            x[:inactive] = true
            data.push(x)
          elsif x[:account_sync]['Calendar'] == 0 && (x[:type] == 'VEVENT' || x[:type] == 'VTODO')
            # turn off sync calendar option
            x[:inactive] = true
            data.push(x)
          elsif x[:account_sync]['Contact'] == 0 && x[:type] == 'VCARD'
            # turn off sync contact option
            x[:inactive] = true
            data.push(x)
          else
            
            icloud_objs = get_icloud_object(x)
            if !icloud_objs.nil?
              data.concat(icloud_objs)
            end
          end
        end
      end

      data
    end

  def __get_trash_id
    trash_ids = Trash.select(:obj_id).where(user_id: @user_id).map(&:obj_id)
    if trash_ids.any?
      items = {}
      # add type to separate trash with another object
      items['type'] = 'trash'
      items['ids'] = trash_ids
      items
    end
  end
end
