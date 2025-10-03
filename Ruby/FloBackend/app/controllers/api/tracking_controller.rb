class Api::TrackingController < Api::BaseController
  EXCEPT_FIELDS = [:user_id]

  #get info
  def index
    #parameters
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    #respond
    respond_list = Array.new()
    sql = "user_id = :user_id"
    conditions = {:user_id => user_id}
    if params[:modifiedGTE] #get data - greater than or equal
      sql << ' AND updated_date >= :updated_date'
      conditions[:updated_date] = params[:modifiedGTE]
    end
    if params[:modifiedLT] #get data before - less than
      sql << ' AND updated_date < :updated_date'
      conditions[:updated_date] = params[:modifiedLT]
    end
    ids = params[:ids]
    if ids and ids.length > 0
      sql << ' AND id IN(:ids)'
      conditions[:ids] = ids.split(',')
    end

    if params[:minID]
      sql << ' AND id > :min_id'
      conditions[:min_id] = params[:minID]
    end

    cols = Tracking.where([sql, conditions])

    if params[:pItem]
      cols = cols.order('id asc')
      cols = cols.limit(params[:pItem].to_i)
    else
      cols = cols.order('updated_date asc')
    end


    field = params[:fields]
    if field and field.length > 0
      #auto remove field if it does not have field name
      arr = field.split(',')
      f = Array.new()
      arr.each do |a|
        f << a if Tracking.column_names.include?(a.to_s)
      end
      cols = cols.select(f)
    end

    @trackings = cols

    hasDataDel = params[:has_del] #check get deleted data
    if hasDataDel and hasDataDel.to_i == 1
      objsDel = Array.new()
      objsDel = DeletedItem.get_del_items(@user_id, API_TRACK.to_s , params[:modifiedGTE], params[:modifiedLT], ids, params[:minDelID], params[:pItem])
      @trackings_deleted = objsDel
    end
  
  end

  #create
  def create
    #parameters
    cols = params.permit![API_PARAMS_JSON]
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    #respond
    respond_list = Array.new()

    data = Array.new()
    data_err = Array.new()


    if cols and cols.length > 0
      if cols.size > API_LIMIT_PARAMS
        return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
      end
      cols.each do |col|
        begin
          cl = Tracking.new(col.permit!.except(:id))
          cl.user_id = user_id
          cl.path = col[:path].to_s
          cl.acc_id = col[:acc_id] || 0

          if valid_json? col[:emails].to_json
            cl.emails = col[:emails].to_json
          else
            data_err << { error: API_ITEM_CANNOT_SAVE,
                          description: 'Emails invalid',
                          attributes: col }
            next
          end

          if cl.save
            data << cl
          else
            data_err << { error: API_ITEM_CANNOT_SAVE, attributes: col, description: cl.errors.full_messages.join(',') }
          end
        rescue
          data_err << { error: API_ITEM_CANNOT_SAVE, attributes: col, description: MSG_ERR_NOT_SAVED }
        end
      end
    end

    @trackings = data
    @trackings_errors = data_err
  end

  #update
  def update
    #parameters
    cols = params.permit![API_PARAMS_JSON]
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    #respond
    respond_list = Array.new()

    data = Array.new()
    data_err = Array.new()


    if cols and cols.length > 0
      if cols.size > API_LIMIT_PARAMS
        return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
      end
      cols.each do |col|
        id = col[:id]
        next if !id
        cl = Tracking.find_by(user_id: user_id, id: id)
        if cl
          col.delete(:id)
          cl.assign_attributes(col.permit!.except(:emails))

          if col[:emails].present? and valid_json? col[:emails].to_json
            cl.emails = col[:emails].to_json
          end

          begin
            if cl.save
              data << cl
            else
              data_err << { error: API_ITEM_CANNOT_SAVE, attributes: col, description: cl.errors.full_messages.join(',') }
            end
          rescue
            data_err << { error: API_ITEM_CANNOT_SAVE, attributes: col, description: MSG_ERR_NOT_SAVED }
          end
        else
          data_err << { error: API_ITEM_NOT_EXIST, attributes: col, description: MSG_ERR_NOT_EXIST }
        end
      end
    end

    @trackings = data
    @trackings_errors = data_err
  end

  #delete
  def destroy
    super
  end

  def destroy_by_ids
    #parameters
    ids = params[:id]
    #recovery id
    recovery_ids = [:re_ids]
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    #respond
    respond_list = Array.new()
    if ids and ids.length > 0
      arrids = ids.split(',')
      if arrids and arrids.length > 0
        res = ""
        arrids.each do |id|
          res = res + id.to_s.strip + ',' if id.to_s.strip != ''
        end
        begin
          #delete Tracking
          Tracking.delete_all_trackings(user_id, res.to_s.chop) if res != ''
          
          #auto add deleted item
          if res and res.length > 0
            arrids.each do |id|
              if id.to_s.strip != ''
                delLnk = DeletedItem.new()
                delLnk.item_type = API_TRACK.to_s
                delLnk.user_id = @user_id
                delLnk.item_id = id
                delLnk.save
              end 
            end
          end
          
          respond_list << {:success => API_SUCCESS, :description => MSG_DELETE_SUCCESS}
        rescue
          respond_list << {:error => ids, :description => MSG_DELETE_FAIL}
        end
      end
    
    #recovery ids
    elsif recovery_ids and recovery_ids.length > 0
        arrReIds = recovery_ids.split(',')
        arrReIds.each do |id|
          res = res + id.to_s.strip + ',' if id.to_s.strip != ''
          #save deleted item
          if id.to_s.strip != ''
            data << {:id => id}
            
            delLnk = DeletedItem.new()
            delLnk.item_type = API_TRACK.to_s
            delLnk.user_id = @user_id
            delLnk.item_id = id
            delLnk.is_recovery = 1
            delLnk.save
          end
        end
          
    else
      respond_list << {:error => ids, :description => MSG_DELETE_FAIL}
    end
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_TRACKING, :except => EXCEPT_FIELDS)}
    end
  end

  private

  def delete(ids)
    deleted_ids = []

    tracking_by_ids = Tracking.find_by_ids(current_user_id.user_id, permit_id_params(ids))
    deleted_ids = tracking_by_ids.map(&:id)
    tracking_by_ids.delete_all

    deleted_item_service(ids: deleted_ids).execute
    deleted_ids
  end

  def recover(re_ids)
    deleted_ids = []

    tracking_by_ids = Tracking.find_by_ids(current_user_id.user_id, permit_id_params(re_ids))
    deleted_ids = tracking_by_ids.map(&:id)
    deleted_item_service(ids: deleted_ids, is_recovery: 1).execute

    deleted_ids
  end

  def deleted_item_service(hash_param)
    CreateDeletedItemService.new(ids: hash_param[:ids],
                                 user_id: current_user_id.user_id,
                                 item_type: API_TRACK.to_s,
                                 is_recovery: hash_param[:is_recovery])
  end

  def valid_json?(json)
    JSON.parse(json)
    true
  rescue
    false
  end
end
