class Api::SettingsController < Api::BaseController
  EXCEPT_FIELDS = [
    :user_id, 
    :m_ade, :m_event, :m_task, :m_stask, :m_done_task, :m_due_task, :m_note,
    :dw_due_task, :dw_ade, :dw_done_task, :dw_note
  ]
  
  #get info setting
  def index
    #parameters
    createOmni = params[:create_omni]
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    #respond
    sql = "user_id = :user_id"
    conditions = {:user_id => user_id}
    
    # set = Setting.find(:first, :conditions => ['user_id = ?', user_id])
    set = Setting.where([sql, conditions])
    #get field
    field = params[:fields]
    if field and field.length > 0
      #auto remove field if it does not have field name
      arr = field.split(',')
      f = Array.new()
      arr.each do |a|
        f << a if a.to_s.strip.length > 0
      end
      set = set.select(f)
    end
    
    set = set[0] if set
    
    if !set
      #auto check and create calendar
      # cal_uri = Calendar.create_omni_calendar(user_id)
      cal_uri = UUID.new.generate() #auto generate calendar uri for Omni
      
      #create setting default
      set = Setting.new()
      set.user_id = user_id
      set.omni_cal_id = cal_uri #set omni calendar
      set.save
    elsif set.omni_cal_id and set.omni_cal_id.to_s.strip.length == 0
      #check Omni calendar exist
      #check exist Omni calendar, if not, it will auto create
      # cal_uri = Calendar.check_and_create_omni_cal(set.omni_cal_id, user_id)
      cal_uri = UUID.new.generate()
      set.omni_cal_id = cal_uri #set omni calendar
      set.save
    end
    #check and auto create Omni calendar
    if createOmni and createOmni.to_i == 1
      #check exist Omni calendar, if not, it will auto create
      cal_uri = Calendar.check_and_create_omni_cal(set.omni_cal_id, user_id)
      set.omni_cal_id = cal_uri #set omni calendar
      set.save
    end
    
    @setting = set
  end
  
  #update setting
  def update
    #parameters
    setting = params[API_SETTING] || params[API_PARAMS_JSON]
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    #respond
    set = Setting.find_by(user_id: user_id)
    @setting = {}
    @setting_errors = []
    if set and setting
      #update setting
      #TODO: set attributes here
      
      #read only attributes
      setting.delete(:id)
      setting.delete(:user_id)
      setting.delete(:created_date)
      setting.delete(:updated_date)
      #set updated date for setting, just get this from server
      setting[:updated_date] = Time.now.to_i
      
      #condition setting for calendarID and projectID (collectionID) NOT BLANK or NULL
      if setting[:default_cal] and setting[:default_cal].to_s.strip == ""
        setting.delete(:default_cal)
      end
      #check time zone
      if setting[:timezone] and setting[:timezone].to_s.strip.downcase == "floating"
        setting.delete(:timezone)
      end

      set.assign_attributes(setting.permit!.except(:emailbox_order, :infobox_order, :order_todo,
                                                   :keep_state, :working_time, :recent_tz))

      if setting[:working_time].present? and valid_json?(setting[:working_time].to_json)
        set.working_time = setting[:working_time].to_json
      end

      if setting[:recent_tz].present? and valid_json?(setting[:recent_tz].to_json)
        set.recent_tz = setting[:recent_tz].to_json
      end

      if setting[:keep_state].present? and valid_json?(setting[:keep_state].to_json)
        set.keep_state = setting[:keep_state].to_json
      end

      begin
        if set.save
          @setting = set
        else
          @setting_errors << { error: API_ITEM_CANNOT_SAVE, attributes: setting, description: set.errors.full_messages.join(',') }
        end
      rescue
        @setting_errors << { error: API_ITEM_NOT_EXIST, attributes: setting, description: MSG_ERR_NOT_EXIST }
      end
    end
  end

  private

  def valid_json?(json)
    JSON.parse(json)
    true
  rescue
    false
  end
end
