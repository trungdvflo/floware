class Api::Web::ObjorderController < Api::Web::BaseController
  require 'net/http'
  require 'uri'

  EXCEPT_FIELDS = [:user_id]

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
      fields = "id,order_number, item_id, collection_id, item_type, kanban_id, user_id, source_account"
    when 5
      objEntity = Canvas
      fields = "id,order_number, item_id, collection_id, item_type, kanban_id, user_id, source_account"
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

end
