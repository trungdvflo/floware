require "./lib/icloud-reader.rb"
require "./lib/agcaldav.rb"

class Api::IcloudController < Api::BaseController
  attr :icloud, :icl, :url, :server_number, :username, :ipw, :authtype, :icloud_user_id
  before_action :authenticate_with_icloud_caldav_server, :except => [:check_auth_with_icloud, :icloud_login]

  def icloud_login
    user_name = params[:username]
    ipw = params[:ipw]
    access_token = params[:server_number]
    begin
      private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
      pw = private_key.private_decrypt(Base64.decode64(ipw))
      #authenticate and create new client
      icloud = {
        :server_number => 1,
        :username => user_name,
        :password => pw[0, pw.rindex('@')]
      }
      @icl = ICloudReader.new(icloud)
      if @icl.present?
        icloud_user_id = @icl.load_user_id()
        respond_to do |format|
          format.json {render :json => icloud_user_id.to_json(:root => 'ICLOUD_ACCOUNT' )}
        end
      else
        render :json => [{:error => API_USER_INVALID, :description => MSG_USER_INVALID}]
      end
    rescue
    end
  end

  def authenticate_with_icloud_caldav_server
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    username = params[:username]
    account = SetAccount.find_by(user_id: user_id, user_caldav: username, account_type: ICLOUD_ACC_TYPE)
    if account
      begin
        # pass =  Api::Web::Utils.decrypt_rsa(rsa_pass)
        private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
        # password = private_key.private_decrypt(Base64.decode64(account.pass_income)).split('@')[0]
        pw = private_key.private_decrypt(Base64.decode64(account.pass_income))
        port = ''
        if account.port_caldav
          port = ':' + account.port_caldav.to_s
        end
        caldav_url = account.server_caldav.to_s + port.to_s + account.server_path_caldav.to_s
        #authenticate and create new client
        caldav = {
          :url      => caldav_url,
          :user     => account.user_caldav,
          :icloud_user_id => account.icloud_user_id,
          :password => pw[0, pw.rindex('@')],
          :authtype => 'basic'
        }
        @icloud = AgCalDAV::ICloudClient.new(:uri => caldav[:url], :user => caldav[:user] , :password => caldav[:password],:icloud_user_id => caldav[:icloud_user_id], :authtype => caldav[:authtype])
      rescue
      end
    else
      render :json => [{:error => API_USER_INVALID, :description => MSG_USER_INVALID}]
    end
  end

  def authenticate_with_icloud_server
    user_name = params[:username]
    # ipw = params[:ipw]
    set_account = current_user.set_accounts.find_by_user_income(user_name)
    # binding.pry
    return if set_account.blank?

    access_token = params[:server_number]
    begin
      private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
      pw = private_key.private_decrypt(Base64.decode64(set_account.pass_income))
      #authenticate and create new client
      icloud = {
        :server_number => 1,
        :username => user_name,
        :password => pw[0, pw.rindex('@')]
      }
      @icl = ICloudReader.new(icloud)
    rescue
    end
  end

  def check_auth_with_icloud
    authenticate_with_icloud_server()
    if @icl.present?
      icloud_user_id = @icl.load_user_id()
      respond_to do |format|
        format.json {render :json => icloud_user_id.to_json(:root => 'ICLOUD_ACCOUNT' )}
      end
    else
      render :json => [{:error => API_USER_INVALID, :description => MSG_USER_INVALID}]
    end
  end

  def getlist_calendars
    @listCals = Array.new
    cals = []
    cals = @icloud.getlistcalendars if @icloud.present?
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
                   'type' => ICLOUD_ACC_TYPE,
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

        minRange = bom.prev_month
        maxRange = eom.next_month
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

    calObjs= @icloud.report(cal_uri, objType, minRange..maxRange)
    if calObjs
      calObjs.each do |obj|
        obj['calendarcolor'] = cal_color
        obj['componenttype'] = objType
        obj['tpObjType'] = ICLOUD_ACC_TYPE
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

        # min_range = bom.prev_month
        # max_range = eom.next_month

        min_range = bom
        max_range = eom
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
        results = @icloud.report(cal[:uri], obj_type, min_range..max_range)
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
            obj['tpObjType'] = ICLOUD_ACC_TYPE 
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

  def update_calendar
    caluri = params[:cal_uri]
    color = params[:color]
    displayname = params[:calname]
    des = params[:description]
    result = @icloud.update_calendar(caluri, displayname, color, des)

    res = {}
    res[:result] = 0
    if result
        res[:result]  = 1
    end
    render :json => res
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

  # create/update calendar object by string format from client
  def update_calobj_by_ical_str
    caluri = params[:cal_uri]
    calobj = params[:calobj]
    uuid = params[:uuid]
    
    result = @icloud.update_calobj_by_ical_str(uuid, calobj, caluri)   #call this method from client.rb
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
    href = params[:href]
    is_cal_moving = params[:is_cal_moving]
    result = @icloud.delete_calobj(uuid, cal_uri, href)   #call this method from icloud_client.rb

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
end
