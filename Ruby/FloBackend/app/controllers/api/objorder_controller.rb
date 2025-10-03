class Api::ObjorderController < Api::BaseController
  require 'net/http'
  require 'uri'
  EXCEPT_FIELDS = [:user_id]

  # rubocop:disable Metrics/MethodLength
  def index
    obj_type = params[:objtype]
    #########################
    objEntity = nil
    fields = "id, order_number"
    modifiedDate = 'updated_date'
    deleteItemType = API_ORDER_OBJ
    sql = "user_id = :user_id"
    conditions = {:user_id => @user_id}

    # object type: 1 = url, 3 = kanban list,4 = kanban item or story board item, default = todo
    case obj_type.to_i
    when 1
      objEntity = Url
      deleteItemType = API_URL
      modifiedDate = 'order_update_time'
    when 3
      objEntity = Kanban
      deleteItemType = API_KANBAN
      modifiedDate = 'order_update_time'
    when 4
      objEntity = Canvas
      deleteItemType = API_CANVAS_TYPE
      modifiedDate = 'order_update_time'
      fields = "id,order_number, item_id, collection_id, item_type, kanban_id, user_id"
    else
      objEntity = ObjOrder
      deleteItemType = API_ORDER_OBJ
      if params[:obj_ids].present?
        sql << ' AND obj_id IN (:obj_ids)'
        conditions[:obj_ids] = params[:obj_ids].to_s.split(',').map(&:strip)
      end
    end

    if params[:modifiedGTE] #get data - greater than or equal
      sql << ' AND '+modifiedDate.to_s+' >= :updated_date'
      conditions[:updated_date] = params[:modifiedGTE]
    end
    if params[:modifiedLT] #get data before - less than
      sql << ' AND '+modifiedDate.to_s+' < :updated_date'
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

    objs = objEntity.where([sql, conditions])

    objs = objs.order('id asc')
    if params[:pItem]
      objs = objs.limit(params[:pItem].to_i)
    end


    field = params[:fields]
    if field and field.length > 0
      #auto remove field if it does not have field name
      arr = field.split(',')
      f = Array.new
      arr.each do |a|
        f << a if objEntity.column_names.include?(a.to_s)
      end
      objs = objs.select(f)
    end

    #response dictionary
    res = {}
    res[:data] = objs

    hasDataDel = params[:has_del] #check get deleted data
    if hasDataDel and hasDataDel.to_i == 1
      #deleted items
      objsDel = Array.new()
      objsDel = DeletedItem.get_del_items(@user_id, deleteItemType, params[:modifiedGTE], params[:modifiedLT], ids, params[:minDelID], params[:pItem])
      # respond_list << {:data_del => objsDel}
      res[:data_del] = objsDel
    end

    respond_to do |format|
      format.json {render :json => res.to_json(:root => "item", :except => EXCEPT_FIELDS)}
    end
  end
  # rubocop:enable Metrics/MethodLength

  #get update order
  def get_update_order
    respond_list = {}
    user_id = @user_id
    #object type: 1 = url, 2 = todo, 3 = kanban list,4 = kanban item, 5 = story board item,
    obj_type = params[:objtype]
    options = {}
    options[:modifiedLT] = params[:modifiedLT] if params[:modifiedLT]
    options[:modifiedGTE] = params[:modifiedGTE] if params[:modifiedGTE]
    options[:fields] = params[:fields] if params[:fields]
    #get new order by top (min - 1) or bottom of list, default = bottom (max + 1)
    options[:bottom] = params[:bottom] if params[:bottom]
    options[:top] = params[:top] if params[:top]
    options[:obj_type] = params[:objtype] if params[:objtype]

    #want to return result or not
    returnRes = params[:returnRes] if params[:returnRes]

    objs = Array.new()

    ids = params[:ids]
    objEntity = ObjOrder
    fields = "id, order_number"

    case obj_type.to_i
    when 1
      objEntity = Url
    when 2
      objEntity = ObjOrder
    when 3
      objEntity = Kanban
    when 4
      objEntity = Canvas
      fields = "id,order_number, item_id, collection_id, item_type, kanban_id, user_id"
    when 5
      objEntity = Canvas
      fields = "id,order_number, item_id, collection_id, item_type, kanban_id, user_id"
    end

    objs = ObjOrder.get_update_order_objs(user_id, ids, objEntity, fields, options) if objEntity

    res = {"error" => 0, "description" => "Update order number succesful."}
    respond_list = {:data => res}

    #return the result to client
    if returnRes and returnRes.to_i == 1
      respond_list = {:data => objs}
    end

    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => "item",:except => EXCEPT_FIELDS)}
    end
  end

  # rubocop:disable Style/For
  def create
    objs = params[API_OBJ_ORDER] || params[API_PARAMS_JSON]
    respond_list = Array.new()

    data = Array.new()
    data_err = Array.new()

    if objs and objs.length > 0
      if objs.size > API_LIMIT_PARAMS
        return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
      end
      for i in 0..(objs.length-1)
        begin
          item = objs[i][:obj_order]
          max = ObjOrder.get_max_order(@user_id)
          max_order = max.max_order ? (max.max_order + 1): 0

          obj = ObjOrder.new(item.permit!.except(:id))
          obj.user_id = @user_id
          obj.order_number = max_order
          if obj.save
            data << obj
          else

            data_err << { error: API_ITEM_CANNOT_SAVE,
                          description: MSG_ERR_NOT_SAVED,
                          attributes: item }
          end
        rescue
          data_err << { error: API_ITEM_CANNOT_SAVE,
                        description: MSG_ERR_NOT_SAVED,
                        attributes: item }
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
  # rubocop:enable Style/For

  #update
  def update
    objs = params.permit![API_OBJ_ORDER] || params.permit![API_PARAMS_JSON]
    user_id = @user_id
    @objects = []
    @object_errors = []
    #object type: 1 = url, 2 = todo, 3 = kanban list,4 = kanban item, 5 = story board item,
    obj_type = params[:objtype]
    options = {}
    options[:modifiedLT] = params[:modifiedLT] if params[:modifiedLT]
    options[:modifiedGTE] = params[:modifiedGTE] if params[:modifiedGTE]
    options[:fields] = params[:fields] if params[:fields]
    #get new order by top (min - 1) or bottom of list, default = bottom (max + 1)
    options[:bottom] = params[:bottom] if params[:bottom]
    options[:top] = params[:top] if params[:top]
    options[:obj_type] = params[:objtype] if params[:objtype]
    options[:source_account] = params[:source_account] if params[:source_account]

    @return_response = params[:returnRes]

    objEntity = ObjOrder
    fields = "id, order_number"

    case obj_type.to_i
    when 1
      objEntity = Url
    when 2
      objEntity = ObjOrder
    when 3
      objEntity = Kanban
    when 4
      objEntity = Canvas
      fields = "id,order_number, item_id, collection_id, item_type, kanban_id, user_id"
    when 5
      objEntity = Canvas
      fields = "id,order_number, item_id, collection_id, item_type, kanban_id, user_id"
    end

    if objs.blank?
      return
    end

    invalid_source_accounts = objs.reject do |obj|
      obj[:source_account].blank? or obj[:source_account].is_a? Numeric
    end

    if invalid_source_accounts.present?
      @object_errors << { error: API_ITEM_NOT_EXIST,
                          description: 'source account invalid' }
      return
    end
  
    if obj_type.to_i != 2
      records = objEntity.where(id: objs.map {|obj| obj[:id]})
      if objs&.size != records&.size
        @object_errors << { error: API_ITEM_NOT_EXIST,
                            description: 'Item does not existed or duplicated' }
        return
      end
    end
    @objects = ObjOrder.update_sort_order_objs(user_id, objs, objEntity, fields, options)
  end

  def destroy
    # TODO: maybe we don't need case re_ids
    super
  end

  # rubocop:disable Metrics/MethodLength
  def update_v2
    objs = params[API_OBJ_ORDER] || params[API_PARAMS_JSON]
    respond_list = {}
    user_id = @user_id
    #object type: 1 = url, 2 = todo, 3 = kanban list,4 = kanban item, 5 = story board item,
    obj_type = params[:objtype]
    options = {}
    options[:modifiedLT] = params[:modifiedLT] if params[:modifiedLT]
    options[:modifiedGTE] = params[:modifiedGTE] if params[:modifiedGTE]
    options[:fields] = params[:fields] if params[:fields]
    #get new order by top (min - 1) or bottom of list, default = bottom (max + 1)
    options[:bottom] = params[:bottom] if params[:bottom]
    options[:top] = params[:top] if params[:top]
    options[:obj_type] = params[:objtype] if params[:objtype]

    #want to return result or not
    returnRes = params[:returnRes] if params[:returnRes]

    ids = params[:ids] || []
    objEntity = nil
    fields = "id, order_number"

    if obj_type.blank?
      respond_list = {"error" => 1, "description" => "API order number don't update anything."}
      respond_to do |format|
        format.json {render :json => respond_list.to_json(:root => "item",:except => EXCEPT_FIELDS)}
      end
    end

    case obj_type.to_i
    when 1
      objEntity = Url
    when 2
      objEntity = ObjOrder
    when 3
      objEntity = Kanban
    when 4
      objEntity = Canvas
      fields = "id,order_number, item_id, collection_id, item_type, kanban_id, user_id"
    when 5
      objEntity = Canvas
      fields = "id,order_number, item_id, collection_id, item_type, kanban_id, user_id"
    end

    res = {"error" => 0, "description" => "Update order number succesful."}

    items = Array.new()

    if options[:bottom] == "1" || options[:top] == "1"
      items = ObjOrder.get_update_order_objs(user_id, ids, objEntity, fields, options) if objEntity
    else
      if objs and objs.length > 0
        items = ObjOrder.update_sort_order_objs(user_id, objs, objEntity, fields, options) if objEntity
      else
        res = {}
      end

      respond_list = res
    end

    items = case obj_type.to_i
            when 4
              items.map {|i| {id: i.id, item_id: i.item_id, order_number: i.order_number}}
            else
              items.map {|i| {id: i.id, order_number: i.order_number}}
            end

    #return the result to client
    if returnRes and returnRes.to_i == 1
      if items.blank?
        respond_list = {"error" => 1, "description" => "API order number don't update anything."}
      else
        respond_list = {:data => items}
      end
    end

    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => "item",:except => EXCEPT_FIELDS)}
    end
  end
  # rubocop:enable Metrics/MethodLength

  private

  def delete(ids)
    deleted_ids = []

    obj_order_by_ids = ObjOrder.find_by_ids(current_user_id.user_id, permit_id_params(ids))
    deleted_ids = obj_order_by_ids.map(&:id)
    obj_order_by_ids.delete_all
    deleted_item_service(ids: deleted_ids).execute

    deleted_ids
  end

  def recover(re_ids)
    deleted_ids = []

    obj_order_by_ids = ObjOrder.find_by_ids(current_user_id.user_id, permit_id_params(re_ids))
    deleted_ids = obj_order_by_ids.map(&:id)
    deleted_item_service(ids: deleted_ids, is_recovery: 1).execute

    deleted_ids
  end

  def deleted_item_service(hash_param)
    CreateDeletedItemService.new(ids: hash_param[:ids],
                                 user_id: current_user_id.user_id,
                                 item_type: API_ORDER_OBJ.to_s,
                                 is_recovery: hash_param[:is_recovery])
  end
end
