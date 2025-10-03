class Api::DevicetokenController < Api::BaseController
  before_action :authenticate, :user_info
  EXCEPT_FIELDS = [:user_id]
  
  #get info 
  def index
    respond_list = Array.new
    sql = "user_id = :user_id"
    conditions = {:user_id => @user_id}
    
    #get by time
    if params[:modifiedGTE] #get data - greater than or equal
      sql << ' AND updated_date >= :updated_date'
      conditions[:updated_date] = params[:modifiedGTE]
    end
    if params[:modifiedLT] #get data before - less than
      sql << ' AND updated_date < :updated_date'
      conditions[:updated_date] = params[:modifiedLT]
    end
    #get by ids
    ids = params[:ids]
    if ids and ids.length > 0
      sql << ' AND id IN(:ids)'
      conditions[:ids] = ids.split(',')
    end
    #get by fields
    if params[:minID]
      sql << ' AND id > :min_id'
      conditions[:min_id] = params[:minID] 
    end
    
    objs = DeviceToken.where([sql, conditions])
    
    if params[:pItem]
      objs = objs.order('id asc')
      objs = objs.limit(params[:pItem].to_i)
    else
      objs = objs.order('updated_date asc')
    end
    
    
    respond_list = objs
    
    #response dictionary
    res = {:data => objs}
    
    respond_to do |format|
      format.json {render :json => res.to_json(:except => EXCEPT_FIELDS)}
    end
  end
  
  #create 
  def create
    device_token = params[API_DEVICE_TOKEN] || params[API_PARAMS_JSON]
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    respond_list = Array.new
    data_err = []
    
    if device_token 
      dvtoken = device_token[:device_token]
      #need delete device token on old account
      DeviceToken.delete_device_token_of_others(dvtoken)
      # add new device token
      dvtoken = dvtoken.to_s.strip
      device = DeviceToken.new()
      device.user_id = user_id
      device.device_token = dvtoken
      device.device_type = device_token[:device_type] || 0
      device.cert_env = device_token[:cert_env] || 0
      device.device_env = device_token[:device_env] || 0
      device.device_uuid = device_token[:device_uuid] if device_token[:device_uuid]
      device.time_sent_silent = device_token[:time_sent_silent] if device_token[:time_sent_silent]
      device.time_received_silent = device_token[:time_received_silent] if device_token[:time_received_silent]
      device.status_app_run = device_token[:status_app_run] if device_token[:status_app_run]
      device.env_silent = device_token[:env_silent] if device_token[:env_silent]

      begin
        if device.save
          respond_list << device
        else
          data_err << { error: API_ITEM_CANNOT_SAVE,
                        description: device.errors.full_messages.join(','),
                        attributes: device_token }
        end
      rescue
        data_err << { error: API_ITEM_CANNOT_SAVE,
                      description: MSG_ERR_NOT_SAVED,
                      attributes: device_token }
      end
      
    end
    
    #response dictionary
    res = {:data => respond_list}
    res[:data_error] = data_err
    
    respond_to do |format|
      format.json {render :json => res.to_json(:except => EXCEPT_FIELDS)}
    end
  end

  def update
    @device_tokens = []
    device_token_params = params[API_DEVICE_TOKEN] || params[API_PARAMS_JSON] || {}
    device_token = DeviceToken.find_by(device_token: device_token_params[:device_token])

    return unless device_token
    device_token.user_id = current_user_id.user_id

    device_token.assign_attributes(device_token_params.permit!.except(:replied, :id, :device_token))
    device_token.time_received_silent = Time.now.utc.to_i if device_token_params[:replied].to_i == 1
    device_token.save
    @device_tokens << device_token
  end
  
  def destroy
    DeviceToken.find_by(user_id: current_user.id, device_token: params[:device_token])&.destroy
    render json: {}, status: 204
  end
end
