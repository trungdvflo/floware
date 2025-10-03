class Api::Web::HistoryController < Api::Web::BaseController
  EXCEPT_FIELDS = [:user_id]

  #get info
  def index
    #parameters
    user_id = 0
    user_id = current_user_id.user_id if current_user_id
    #respond
    respond_list = Array.new()
    
    #response for contact history
    contact_uid = params[:uid]
    if contact_uid
      histories = History.get_histories_by_contact(contact_uid, user_id)
      arrHistories = []

      trashed_items = {}
      # Convert active record resuls to hash for checking the existent item in trash
      # {'object-uri-abcd-xyz' => 1}
      cos_type = ['VEVENT','VTODO','STODO']
      trashed_items =  Trash.where("user_id=#{@user_id} AND obj_type IN('VEVENT','VTODO','STODO')")
                           .each_with_object({}) do |el, hash|
        hash[el[:obj_id]] = 1
      end

      histories.each do |history|
        obj = {}

        intrash = false
        if !trashed_items.empty? && !cos_type.index(history.obj_type.to_s).nil?
          intrash = Api::Web::Utils.filter_by_trash(trashed_items, history.obj_id)
        end
        next if intrash
        
        if history.obj_type and history.obj_type.to_s == API_VEVENT.to_s
          arr = []
          arr << history
          event = Api::Web::Utils.convert_calendar_obj(arr, false, nil, nil)
          obj[:event] = event
        end
        
        obj[:source_type] = history.source_type
        obj[:source_id] = history.source_id
        obj[:obj_type] = history.obj_type
        obj[:obj_id] = history.obj_id
        obj[:action] = history.action
        obj[:action_data] = history.action_data
        obj[:created_date] = history.created_date
        obj[:updated_date] = history.updated_date
        obj[:color] = history.calendarcolor
        obj[:id] = history.history_id
        
        arrHistories << obj 
      end
      respond_list = arrHistories
    else
      ################ API ################
      sql = "user_id = :user_id"
      conditions = {:user_id => user_id}
      if params[:modifiedGTE] #get data - greater than or equal
        sql << ' AND updated_date >= :updated_date '
        conditions[:updated_date] = params[:modifiedGTE]
      end
      if params[:modifiedLT] #get data before - less than
        sql << ' AND updated_date < :updated_date '
        conditions[:updated_date] = params[:modifiedLT]
      end
      ids = params[:ids]
      if ids and ids.length > 0
        sql << ' AND id IN(:ids) '
        conditions[:ids] = ids.split(',')
      end
      #uid of contact
      uid = params[:uid]
      if uid and uid.length > 0
        sql << ' AND source_id IN(:uid) '
        conditions[:uid] = uid.split(',')
      end
      #get by collection id, it is project id
      if params[:obj_id]
        sql << ' AND obj_id = :obj_id '
        conditions[:obj_id] = params[:obj_id]
      end
      #get by object type = VTODO, VEVENT, VJOURNAL, EMAIL
      if params[:obj_type]
        sql << ' AND obj_type = :obj_type '
        conditions[:obj_type] = params[:obj_type]
      end
      cols = History.where([sql, conditions])
      cols = cols.order('updated_date asc')
      field = params[:fields]
      if field and field.length > 0
        #auto remove field if it does not have field name
        arr = field.split(',')
        f = Array.new()
        arr.each do |a|
          # f << a if History.fields.include?(a.to_s)
          f << a if a.to_s.strip.length > 0
        end
        cols = cols.select(f)
      end
      #get collection data
      hasDataDel = params[:has_del] #check get deleted data
      if hasDataDel and hasDataDel.to_i = 1
        respond_list << {:data => cols}
        #deleted items
        objsDel = Array.new()
        objsDel = DeletedItem.get_del_items(@user_id, API_HISTORY_TYPE.to_s , params[:modifiedGTE], params[:modifiedLT], ids, params[:minDelID], params[:pItem])
        respond_list << {:data_del => objsDel}
      else #get data by version 1
        respond_list = cols
      end
      
    end
    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_HISTORY, :except => EXCEPT_FIELDS)}
    end
  end

  # get contact histories
  def get_histories
    user_id = current_user_id.user_id if current_user_id
    histories = History.where(user_id: user_id)
                       .where(params.permit(:source_id, :source_type, 
                                            :source_root_uid, :source_account))

    respond_to do |format|
      format.json {render :json => {histories: histories}.to_json(:root => false, :except => EXCEPT_FIELDS)}
    end
  end

  def create_histories
    respond_list = Array.new()
    user_id = current_user_id.user_id if current_user_id
    histories_params.each do |history|
      history[:user_id] = user_id
      res = History.create(history)
      if res
        respond_list << res
      else
        respond_list << { error: API_ITEM_CANNOT_SAVE,
                          history: res,
                          description: res.errors.full_messages }
      end
    end
    respond_to do |format|
      format.json {render :json => {histories: respond_list}.to_json(:root => false, :except => EXCEPT_FIELDS)}
    end
  end

  def delete_histories
    respond_list = []
    user_id = current_user_id.user_id if current_user_id
    conditions = params[:histories]
    conditions.each do |condition|
      condition[:user_id] = user_id
      res = History.where(condition.permit!).destroy_all
      if res
        respond_list.concat res
        deleted_ids = res.map(&:id)
        deleted_item_service(ids: deleted_ids).execute
      else
        respond_list << { error: API_ITEM_CANNOT_DELETE,
                          history: res,
                          description: res.errors.full_messages }
      end
    end

    respond_to do |format|
      format.json {render :json => {histories: respond_list}.to_json(:root => false, :except => EXCEPT_FIELDS)}
    end
  end

  def update_histories
    respond_list = []
    user_id = current_user_id.user_id if current_user_id
    histories = params[:histories]
    updated_histories = []

    histories.each do |history|
      old_history = history[:old_history]
      new_history = history[:new_history]
      updated_histories = [] 

      if old_history.present? && new_history.present?
        old_history[:user_id] = user_id
        new_history = new_history.permit(:source_id, :source_type, :source_root_uid, :source_account,
          :destination_account, :obj_id, :obj_type, :action, :action_data, :path, :destination_root_uid)
        updating_histories = History.where(old_history.permit!)
        updating_histories.find_each do |updating_history|
          updating_history.update_attributes(new_history)
          updated_histories << updating_history
        end
      end
    end

    respond_to do |format|
      format.json { render :json => {histories: updated_histories}.to_json(:root => false, :except => EXCEPT_FIELDS)}
    end
  end

  def histories_params
    params.permit(histories: [:source_id, :source_type, :source_root_uid, :source_account, :user_id,
      :destination_account, :obj_id, :obj_type, :action, :action_data, :path, :destination_root_uid])
          .require(:histories)
  end

  def deleted_item_service(hash_param)
    user_id = current_user_id.user_id if current_user_id
    CreateDeletedItemService.new(ids: hash_param[:ids],
                                 user_id: user_id,
                                 item_type: API_HISTORY_TYPE.to_s)
  end
end
