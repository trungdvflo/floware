class Api::TrashController < Api::BaseController
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

    types_params = params[:types]
    if types_params.present? and types_params.length > 0
      types = types_params.split(',')
      if %w[VEVENT VTODO VJOURNAL FOLDER].to_set.superset?(types.to_set)
        sql << ' AND obj_type in (:obj_type)'
        conditions[:obj_type] = types
      end
    end

    #get by fields
    if params[:minID]
      sql << ' AND id > :min_id'
      conditions[:min_id] = params[:minID]
    end

    objs = Trash.where([sql, conditions])

    if params[:pItem]
      objs = objs.order('id asc, trash_time desc')
      objs = objs.limit(params[:pItem].to_i)
    else
      objs = objs.order('trash_time desc, id desc')
    end

    field = params[:fields]
    if field and field.length > 0
      arr = field.split(',')
      f = Array.new()
      arr.each do |a|
        f << a if Trash.column_names.include?(a.to_s)
      end
      objs = objs.select(f)
    end

    # lazy-load for web
    if params[:cur_items] && params[:next_items]
      if params[:cur_items].to_i == 0
        objs = objs.limit(params[:next_items])
      else
        objs = objs.limit(params[:next_items]).offset(params[:cur_items].to_i)
      end
    end
    res = {:data => objs}

    #get item deleted
    has_data_del = params[:has_del] #check get deleted data
    if has_data_del and has_data_del.to_i == 1
      #deleted items
      objs_del = Array.new()
      objs_del = DeletedItem.get_del_items(@user_id, API_TRASH, params[:modifiedGTE], params[:modifiedLT], ids, params[:minDelID], params[:pItem])
      res[:data_del] = objs_del
    end

    respond_to do |format|
      format.json {render :json => res.to_json(:except => EXCEPT_FIELDS)}
    end
  end

  #create
  def create
    trashs = params[API_TRASHS] || params[API_PARAMS_JSON]
    calendarid = params[:calendarid]
    count = 0
    respond_list = Array.new()

    data = Array.new()
    data_err = Array.new()

    if trashs.present?
      if trashs.size > API_LIMIT_PARAMS
        return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
      end
      trashs.each do |obj|
        begin
          obj = obj[1] if obj.kind_of?(Array)
          obj.delete(:id)
          trash = Trash.new(obj.permit!)
          trash.user_id = @user_id
          trash.trash_time = obj[:trash_time] ? obj[:trash_time] : Time.now.utc.to_f.round(3)

          if trash.obj_type == API_FOLDER
            setting = Setting.find_by(user_id: current_user.id)
            if setting&.default_folder.to_i == trash.obj_id.to_i
              data_err << { error: API_ITEM_CANNOT_SAVE,
                                    description: 'Can not trash default collection',
                                    attributes: obj }
              next
            end
          end

          if trash.save
            trash.links_relative = Link.
                obj_is_linked_with_id_not_include_type(trash.obj_id, API_FOLDER).map do |link|
              {
                uid: link[:obj_id],
                itemType: link[:obj_type]
              }
            end
            data << trash
          else
            data_err << { error: API_ITEM_CANNOT_SAVE,
                          description: trash.errors.full_messages.join(','),
                          attributes: obj }
          end
        rescue
          data_err << { error: API_ITEM_CANNOT_SAVE,
                        description: MSG_ERR_NOT_SAVED,
                        attributes: obj }
        end
      end
    end

    # flo's specific api - insert calendar objects to trash, no limit
    co_trashs = []
    if calendarid
      calobjs = CalendarObject.where(calendarid: calendarid)
      if calobjs.any?
        calobjs.each do |co|
          begin
            ct = { obj_id: co.uri.split('.')[0], obj_type: co.componenttype }
            co_trashs << ct
            trash = Trash.new(ct)
            trash.user_id = @user_id
            trash.trash_time = Time.now.utc.to_f.round(3)
            trash.save
          rescue
          end
        end
      end
    end

    #response dictionary
    res = {:data => data}
    res[:data_error] = data_err if data_err and data_err.length > 0

    res = {:data => co_trashs} unless calendarid.nil?

    respond_to do |format|
      format.json {render :json => res.to_json(:except => EXCEPT_FIELDS, methods: [:ref, :links_relative])}
    end
  end

  #update
  def update
    objs = params[API_TRASHS] || params[API_PARAMS_JSON]
    respond_list = Array.new()

    data = Array.new()
    data_err = Array.new()

    if objs and objs.length > 0
      if objs.size > API_LIMIT_PARAMS
        return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
      end
      objs.each do |obj|
        id = obj[:id]
        next if !id
        cl = Trash.find_by(user_id: @user_id, id: id)
        if cl
          obj.delete(:id)
          if cl.obj_type == API_FOLDER or obj[:obj_type] == API_FOLDER
            setting = Setting.find_by(user_id: current_user.id)
            if setting&.default_folder.to_i == cl.obj_id.to_i or setting&.default_folder.to_i == obj[:obj_id].to_i
              data_err << { error: API_ITEM_CANNOT_SAVE,
                            description: 'Can not trash default collection',
                            attributes: obj }
              next
            end
          end
          if cl.update_attributes(obj.permit!)
            data << cl
          else
            data_err << { error: API_ITEM_CANNOT_SAVE,
                          description: MSG_ERR_NOT_SAVED,
                          attributes: obj }
          end
        else
          data_err << { error: API_ITEM_CANNOT_SAVE,
                        description: MSG_ERR_NOT_SAVED,
                        attributes: obj }
        end
      end
    end

    #response dictionary
    res = {:data => data}
    res[:data_error] = data_err if data_err and data_err.length > 0

    respond_to do |format|
      format.json {render :json => res.to_json(:except => EXCEPT_FIELDS, :methods => :ref)}
    end
  end

  def destroy
    super
  end

  def destroy_all
    trash_by_types = Trash.where(['user_id = ?', @user_id])
      .group_by { |i| i.obj_type }
      .map { |k, v| { k.to_sym => v.map { |i| i.obj_id } } }

    d_items = []
    ActiveRecord::Base.transaction do
      trash_by_types.each do |i|
        case i.keys.first
        when :URL # TODO: duplicate
          d_items = Url.where(['user_id = ? and id in (?)', @user_id, i[:URL]]).destroy_all
          d_items.each { |x| save_delete_item(API_URL, x.id) }
        when :EMAIL
          i[:EMAIL].each do |obj_id|
            json_data = JSON.parse(Base64.decode64(obj_id))
            json_data["user_id"] = @user_id
            json_data["acc_id"] = 0
            d_track_items = Tracking.where(json_data.except("title", "set_acc")).destroy_all
            d_track_items.each { |x| save_delete_item(API_TRACK, x.id) }
          end
        end
      end

      # remove all trash then insert to the "deleted_items" table
      d_items = Trash.where(user_id: @user_id).destroy_all

      d_items_del = d_items.map {|r| { obj_id: r[:obj_id], obj_type: r[:obj_type] } }
      deleted_item_srv = CanvasService.new(d_items: d_items_del, user_id: @user_id)
      deleted_item_srv.execute_it

      deleted_item_srv = LinkService.new(d_items: d_items_del, user_id: @user_id)
      deleted_item_srv.execute_it

      d_items.each { |x| if x.obj_type != API_FOLDER then save_delete_item(API_TRASH, x.id) end }
    end
    success =
      if d_items.length == 0
        API_ITEM_NOT_EXIST
      elsif d_items.length > 0
        API_SUCCESS
      end
    respond_to do |format|
      format.json { render json: { success: success } }
    end
  end

  def restore_all
    success = {}
    ActiveRecord::Base.transaction do
      begin
        d_items = Trash.where(user_id: @user_id).destroy_all
        # set is_recovery = 1 when user restore the item for client app sync and show on UI
        ids_folder = []
        d_items.each do |d_item|
          if d_item[:obj_type] == API_FOLDER
            ids_folder << d_item[:obj_id].to_i
          end
        end
        is_recovery = 1
        d_items.each { |x| save_delete_item(API_TRASH, x.id, is_recovery) }
        success[:status] = true
        success[:tree_ids] = ids_folder
      rescue
        success = false
      end
    end
    respond_to do |format|
      format.json { render json: { success: success } }
    end
  end

  private

  def delete(ids)
    deleted_ids = []
    trash_by_ids = Trash.find_by_ids(current_user_id.user_id, permit_id_params(ids))
    deleted_ids = trash_by_ids.map(&:id)
    trash_by_ids.delete_all

    deleted_item_service(ids: deleted_ids).execute
    deleted_ids
  end

  def recover(re_ids)
    deleted_ids = []
    trash_by_ids = Trash.find_by_ids(current_user_id.user_id, permit_id_params(re_ids))
    deleted_ids = trash_by_ids.map(&:id)
    trash_by_ids.delete_all

    deleted_item_service(ids: deleted_ids, is_recovery: 1).execute
    deleted_ids
  end

  def deleted_item_service(hash_param)
    CreateDeletedItemService.new(ids: hash_param[:ids],
                                 user_id: current_user_id.user_id,
                                 item_type: API_TRASH.to_s,
                                 is_recovery: hash_param[:is_recovery])
  end
end
