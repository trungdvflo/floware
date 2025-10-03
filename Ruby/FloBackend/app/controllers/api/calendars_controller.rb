class Api::CalendarsController < Api::BaseController
  EXCEPT_FIELDS = [:user_id]

  def update
    #parameters
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    email = ''
    email = current_user_id.email if current_user_id
    cals = params[API_CALENDARS] || params[API_PARAMS_JSON]
    
    #response dictionary
    data = Array.new()
    data_err = Array.new()
    
    if cals and cals.length > 0
      if cals.size > API_LIMIT_PARAMS
        return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
      end
      cals.each do |cal|
        uri = cal[:uri]
        next if !uri
        cl = Calendar.find_by(principaluri: "principals/#{email}", uri: uri)
        if cl
          cl.components = 'VEVENT,VTODO,VJOURNAL,VFREEBUSY,VALARM'
          if cl.save
            data << cl
          else
            data_err << {:error => cl.errors}
          end
        else
          data_err << {:error => "#{uri}"} #does not exist.
        end 
      end
    end
    #response dictionary
    res = {:data => data}
    res[:data_error] = data_err if data_err and data_err.length > 0
    
    respond_to do |format|
      format.json {render :json => res.to_json(:except => EXCEPT_FIELDS)}
    end
  end
end
