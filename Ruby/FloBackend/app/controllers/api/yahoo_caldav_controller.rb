require "./lib/agcaldav.rb"
require 'ostruct'

class Api::YahooCaldavController < Api::BaseController
  attr :ycal, :url, :ypw, :user, :authtype
  before_action :authenticate_with_yahoo_caldav_server, except: :yahoo_login

  def check_auth
    if @ycal.present?
      result = @ycal.get_user_principal
      respond_to do |format|
        format.json {render :json => result.to_json(:root => 'YAHOO_ACCOUNT' )}
      end
    else
      render :json => [{:error => API_USER_INVALID, :description => MSG_USER_INVALID}]
    end
  end
  
  def getlist_calendars
    @listCals = Array.new 
    cals = @ycal.getlistcalendars if @ycal.present?
    
    if cals
      if !cals[0].nil? && !cals[0][:error].nil?
        @listCals = cals
      else
        cals.each{ |cal|
          invisible = 0
          if !cal['invisible'].nil?
            invisible = cal['invisible']
          end
          item = { 'id'   => -1,
                   'name' => cal['displayname'],
                   'href' => cal['uri'],
                   'uri' => cal['uri'],
                   'color'=> cal['calendarcolor'],
                   'des'  => cal['description'],
                   'transparent' => false,#cal.transparent,
                   'invisible' => invisible,
                   'type' => YAHOO_ACC_TYPE,
                   'account' => params[:username],
                   'supportedCalCom' => cal['supportedCalComSet'],
                   'is_read_only' => cal['is_read_only']
                 }
          @listCals << item
        }
      end
    end

    respond_to do |format|
      format.json {render :json => @listCals.to_json(:root => "CALENDAR" )}
    end #end respond
  end

  def get_calendar_objects_by_calendar_uri
    cal_uri   = params[:cal_uri]
    cal_color = params[:cal_color]
    objType   = params[:obj_type]

    # bom = Date.today.at_beginning_of_month
    # minRange = bom.prev_month
    # eom = Date.today.at_end_of_month
    # maxRange = eom.next_month

    months = params[:months]
    if months.present?
      # Get data by months
      if months.length === 1
        month = months[0].to_s
        bom = Time.parse(month).utc.at_beginning_of_month
        eom = Time.parse(month).utc.at_end_of_month

        # min_range = bom.prev_month
        # max_range = eom.next_month

        min_range = bom
        max_range = eom
      else
        bom = Time.parse(months[0].to_s).utc
        eom = Time.parse(months[months.length - 1].to_s).utc

        minRange = bom
        maxRange = eom
      end

    else
      # Get data in three months (Prev & Current & Next months)
      bom = Date.today.at_beginning_of_month
      eom = Date.today.at_end_of_month

      minRange = bom.prev_month
      maxRange = eom.next_month
    end
    
    calObjs= @ycal.report(cal_uri, objType, minRange..maxRange)
    if calObjs
      calObjs.each do |obj|
        obj['calendarcolor'] = cal_color
        obj['componenttype'] = objType
        obj['tpObjType'] = YAHOO_ACC_TYPE 
        obj['tpAccount'] = params[:username]
        obj['isReadOnly'] = params[:is_read_only_cal]
      end
    end
    
    objs = Array.new
    if !calObjs.nil?
      if !calObjs[0].nil? && !calObjs[0][:error].nil?
        objs = calObjs
      else
        objs = Api::Web::Utils.convert_calendar_obj(calObjs, true)[:data]
      end
    end
    respond_to do |format|
      format.json {render :json => objs.to_json(:root => API_CALENDAR_OBJECTS )}
    end
  end
  
  def get_calendar_objects_by_calendars
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
    
    cal_objs = Array.new
    res_errors = Array.new
    obj_type   = params[:obj_type]
    cals = params[:cals]
    if cals.present?
      cals.each do |cal|
    
        results = @ycal.report(cal[:uri], obj_type, min_range..max_range)
        if results
          
          if results.length
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
            obj['tpObjType'] = YAHOO_ACC_TYPE 
            obj['tpAccount'] = params[:username]
          end
          
          cal_objs.concat(results)
        end
      end
    end
    
    res_objs = Array.new
    if res_errors.present?
      res_objs = res_errors
    elsif cal_objs.present?
      res_objs = Api::Web::Utils.convert_calendar_obj(cal_objs, true)[:data]
    end
    
    respond_to do |format|
      format.json {render :json => res_objs.to_json(:root => API_CALENDAR_OBJECTS )}
    end
  end
  

  # def create_calendar
    # calendar_tz = @cal.createTimezone.to_ical
    # calendar = JSON.parse(params[:calendar])
    # uri = calendar['uri']
    # calendar_name = calendar['calendar_name']
    # calendar_discription = calendar['des']
    # color = calendar['color']#Api::Web::Utils.random_calendar_color()
    # res = {}
    # res[:result] = 0
    # result =  @cal.create_calendar(uri, calendar_name.to_s, calendar_discription.to_s, calendar_tz, color)
    # if result
        # res[:result]  = 1
    # end
    # render :json => res
  # end
#   
  def update_calendar
    cal_uri = params[:cal_uri]
    color = params[:color]
    displayname = params[:calname]
    des = params[:description]
    result = @ycal.update_calendar(cal_uri, displayname, color, des)
    
    res = {}
    res[:result] = 0
    if result
        res[:result]  = 1
    end
    render :json => res
  end
  
  def delete_calendar
    cal_uri = params[:cal_uri]
    result = @ycal.delete_calendar(cal_uri)    
    res = {}
    res[:result] = 0
    if result
        res[:result]  = 1
    end
    render :json => res
  end
  
  def update_calobj_by_ical_str
    caluri = params[:cal_uri]
    calobj = params[:calobj]
    uuid = params[:uuid]   
       
    result = @ycal.update_calobj_by_ical_str(uuid, calobj, caluri)   #call this method from client.rb
    res = {}
    res[:result] = 0
    if result
      res[:result]  = 1
    end      
    render :json => res
  end

  # delete calendar object
  def delete_calobj
    cal_uri = params[:cal_uri]      
    uuid = params[:uuid]  
    is_cal_moving = params[:is_cal_moving]    
    result = @ycal.delete_calobj(uuid, cal_uri)   #call this method from client.rb

    # TODO: Should remove before insert to DeletedItem
    if cal_uri.present? && is_cal_moving.blank?
      links = Link.where("source_id = ? OR destination_id = ?", uuid, uuid)
      DeletedItem.save_deleted_item(@user_id, links)
      links.delete_all
    end

    res = {}
    res[:result] = 0
    if result
      res[:result]  = 1
    end
    render :json => res
  end

  def yahoo_login
    username = params[:username];
    pw_rsa = params[:ypw]
    pp username, pw_rsa
    if username and pw_rsa
      begin
        #private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
        #password = private_key.private_decrypt(Base64.decode64(account.pass_income))
        
        private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
        pw = private_key.private_decrypt(Base64.decode64(pw_rsa))
        
        #authenticate and create new client
        caldav = {      
          :url      => 'https://caldav.calendar.yahoo.com/dav/'+username+'/Calendar/',
          :user     => username,
          :ypw => pw.split('@')[0],
          :authtype => 'basic'        
        }
        @ycal = AgCalDAV::YahooClient.new(:uri => caldav[:url], :user => caldav[:user] , :ypw => caldav[:ypw], :authtype => caldav[:authtype])
        if @ycal.present?
          result = @ycal.get_user_principal
          respond_to do |format|
            format.json {render :json => result.to_json(:root => 'YAHOO_ACCOUNT' )}
          end
        else
          render :json => [{:error => API_USER_INVALID, :description => MSG_USER_INVALID}]
        end
      rescue
      end
    else
      render :json => [{:error => API_USER_INVALID, :description => MSG_USER_INVALID}]
    end
  end

  private

  def authenticate_with_yahoo_caldav_server
    username = params[:username]
    # pw_rsa = params[:ypw]
    setting_acc = current_user.set_accounts.find_by_user_income(username)
    # pp pw_rsa, setting_acc
    #account = SetAccount.first(:conditions => ['user_income = ?', user_name])
    #password = ''
    if username && setting_acc
      begin
        #private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
        #password = private_key.private_decrypt(Base64.decode64(account.pass_income))

        private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
        pw = private_key.private_decrypt(Base64.decode64(setting_acc.pass_income))

        #authenticate and create new client
        caldav = {
          :url      => 'https://caldav.calendar.yahoo.com/dav/'+username+'/Calendar/',
          :user     => username,
          :ypw => pw.split('@')[0],
          :authtype => 'basic'
        }
        @ycal = AgCalDAV::YahooClient.new(:uri => caldav[:url], :user => caldav[:user] , :ypw => caldav[:ypw], :authtype => caldav[:authtype])
      rescue
      end
    else
      render :json => [{:error => API_USER_INVALID, :description => MSG_USER_INVALID}]
    end
  end
end
