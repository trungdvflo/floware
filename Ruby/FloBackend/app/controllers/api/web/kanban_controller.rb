class Api::Web::KanbanController < Api::Web::BaseController
  EXCEPT_FIELDS = [:user_id]

  #create
  def create
    objs = params[API_KANBANS] || params[API_PARAMS_JSON]
    count = 0
    respond_list = Array.new

    if objs and objs.length > 0
      objs.each do |obj|
        begin
          obj = obj[1] if obj.kind_of?(Array)
          obj.delete(:order_number)
          
          lk = Kanban.new(obj.permit!)
          lk.user_id = @user_id
          #TODO: need to optimize code here
          if lk.kanban_type.present? && lk.kanban_type == 1
            min_order = Kanban.where(user_id: @user_id).minimum(:order_number) || 0
            lk.order_number = min_order - 1
          else
            max_order = Kanban.where(user_id: @user_id).maximum(:order_number) || 0
            lk.order_number = max_order + 1
          end
          if lk.save
            respond_list << lk
          else
            respond_list << {:error => lk.errors, :description => MSG_ERR_INVALID}
          end
        rescue
          respond_list << {:error => 1, :description => MSG_ERR_NOT_SAVED}
        end

        break if count == API_MAX_RECORD
        count = count + 1
      end
    end

    respond_to do |format|
      format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS, :methods => :ref)}
    end
  end

  def destroy
    ids = params[:id]
    respond_list = Array.new

    if ids and ids.length > 0
      arrids = ids.split(',')
      if arrids and arrids.length > 0
        res = ''
        arrids.each do |id|
          res = res + id.to_s.strip + ',' if id.to_s.strip != ''
          #save deleted item canvas
          if id.to_s.strip != ''
            delLnk = DeletedItem.new()
            delLnk.item_type = API_KANBAN.to_s
            delLnk.user_id = @user_id
            delLnk.item_id = id.to_s
            delLnk.save
          end
        end
        # begin
          Kanban.delete_kanbans(@user_id, res.to_s.chop) if res != ''
          respond_list << {:success => API_SUCCESS,:ids => res, :description => MSG_DELETE_SUCCESS}
      end
    else
      respond_list << {:error => ids, :description => MSG_DELETE_FAIL}
    end

    respond_to do |format|
      format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS)}
    end
  end
end
