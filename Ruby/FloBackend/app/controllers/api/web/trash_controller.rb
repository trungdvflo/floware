class Api::Web::TrashController < Api::Web::BaseController
  EXCEPT_FIELDS = [:user_id]

  #get info
  # def index
  #   respond_list = Array.new
  #   sql = "user_id = :user_id"
  #   conditions = {:user_id => @user_id}
  #
  #   #get by time
  #   if params[:modifiedGTE] #get data - greater than or equal
  #     sql << ' AND updated_date >= :updated_date'
  #     conditions[:updated_date] = params[:modifiedGTE]
  #   end
  #   if params[:modifiedLT] #get data before - less than
  #     sql << ' AND updated_date < :updated_date'
  #     conditions[:updated_date] = params[:modifiedLT]
  #   end
  #
  #   #get by ids
  #   ids = params[:ids]
  #   if ids and ids.length > 0
  #     sql << ' AND id IN(:ids)'
  #     conditions[:ids] = ids.split(',')
  #   end
  #
  #   types_params = params[:types]
  #   if types_params.present? and types_params.length > 0
  #     types = types_params.split(',')
  #     if %w[VEVENT VTODO VJOURNAL FOLDER].to_set.superset?(types.to_set)
  #       sql << ' AND obj_type in (:obj_type)'
  #       conditions[:obj_type] = types
  #     end
  #   end
  #
  #   #get by fields
  #   objs = Trash.where([sql, conditions])
  #   objs = objs.order('trash_time desc, id desc')
  #   field = params[:fields]
  #   if field and field.length > 0
  #     objs = objs.select(f)
  #   end
  #
  #   # lazy-load
  #   if params[:cur_items] && params[:next_items]
  #     if params[:cur_items].to_i == 0
  #       objs = objs.limit(params[:next_items])
  #     else
  #       objs = objs.limit(params[:next_items]).offset(params[:cur_items].to_i)
  #     end
  #   end
  #
  #   #data change: add and update
  #   #get item deleted
  #   hasDataDel = params[:has_del] #check get deleted data
  #   if hasDataDel and hasDataDel.to_i == 1
  #     respond_list << {:data => objs}
  #     #deleted items
  #     objsDel = Array.new()
  #     objsDel = DeletedItem.get_del_items(@user_id, API_TRASH.to_s , params[:modifiedGTE], params[:modifiedLT], ids, params[:minDelID], params[:pItem])
  #     respond_list << {:data_del => objsDel}
  #   else #get data by version 1
  #     respond_list = objs
  #   end
  #
  #   respond_to do |format|
  #     format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS)}
  #   end
  # end

  #create
  # def create
  #   trashs = params[API_TRASHS] || params[API_PARAMS_JSON]
  #   calendarid = params[:calendarid]
  #   count = 0
  #   respond_list = Array.new
  #
  #   if trashs and trashs.length > 0
  #     trashs.each do |obj|
  #       begin
  #         obj = obj[1] if obj.kind_of?(Array)
  #         trash = Trash.new(obj.permit!)
  #         trash.user_id = @user_id
  #         trash.trash_time = Time.now.utc.to_f.round(3)
  #         if trash.save
  #           data_trash = trash.attributes
  #           data_trash["links_relative"] = Link.obj_is_linked_with_id_not_include_type(trash.obj_id, API_FOLDER).map do |link|
  #             {
  #                 uid: link[:obj_id],
  #                 itemType: link[:obj_type]
  #             }
  #           end
  #           respond_list << data_trash
  #         else
  #           respond_list << {:error => trash.errors, :description => MSG_ERR_INVALID}
  #         end
  #       rescue
  #         respond_list << {:error => trash.errors, :description => MSG_ERR_NOT_SAVED}
  #       end
  #
  #       break if count == API_MAX_RECORD
  #       count = count + 1
  #     end
  #   end
  #
  #   # flo's specific api - insert calendar objects to trash, no limit
  #   if calendarid
  #     calobjs = CalendarObject.where(calendarid: calendarid);
  #     co_trashs = []
  #     if calobjs.any?
  #       calobjs.each do |co|
  #         begin
  #           ct = { obj_id: co.uri.split('.')[0], obj_type: co.componenttype };
  #           co_trashs << ct
  #           trash = Trash.new(ct)
  #           trash.user_id = @user_id
  #           trash.trash_time = Time.now.utc.to_f.round(3)
  #           trash.save
  #         rescue
  #         end
  #       end
  #     end
  #   end
  #
  #   respond_to do |format|
  #     if !calendarid
  #       format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS, :methods => :ref)}
  #     else
  #       format.json { render :json => co_trashs.to_json }
  #     end
  #   end
  # end

  #update
  def update
    objs = params[API_TRASHS] || params[API_PARAMS_JSON]
    count = 0
    respond_list = Array.new

    if objs and objs.length > 0
      objs.each do |obj|
        id = obj[:id]
        next if !id
        cl = Trash.find_by(user_id: user_id, id: id)
        if cl
          obj.delete(:id)
          if cl.update_attributes(obj.permit!)
            respond_list << cl
          else
            respond_list << {:error => cl.errors}
          end
        else
          respond_list << {:error => "#{id}"} #does not exist.
        end
        #check if it greater than 50 items
        break if count == API_MAX_RECORD
        count = count + 1
      end
    end

    respond_to do |format|
      format.json {render :json => respond_list.to_json(:except => EXCEPT_FIELDS)}
    end
  end

  # Note: destroy by obj_id, not id
  def destroy
    ids = params[:id]
    #recovery id
    recovery_ids = params[:re_ids]
    is_recovery = params[:is_recovery]
    respond, links_relative = {}, []
    error = false
    ActiveRecord::Base.transaction do
      if ids.present?
        ids = ids.split(',').map{ |x| x.to_s.strip }.select{ |x| x.present? }
        if ids.present?
          data = ids.map { |id| { id: id } }
          begin
            d_items = Trash.where(user_id: @user_id, obj_id: ids).destroy_all
            d_items.each { |x| save_delete_item(API_TRASH, x.id, is_recovery) }
            d_items.each do |d_item|
              case is_recovery
              when "1" # recovery
                # already insert to deleted item with type = "TRASH" and is_recovery = 1
                # nothing because is recovery
                # don't update link because dont delete link when trash
                # respond << {:success => API_SUCCESS, :ids => ids, :description => MSG_RECOVER_SUCCESS, :links => d_links}

                data.map! do |item|
                  item[:links_relative] = Link.obj_is_linked_with_id_not_include_type(d_item[:obj_id], API_FOLDER).map do |link|
                    {
                        uid: link.obj_id,
                        itemType: link.obj_type
                    }
                  end
                  item
                end
              when "0" # delete permanently
                d_items_del = [{ obj_id: d_item[:obj_id], obj_type: d_item[:obj_type] }]
                deleted_item_srv = CanvasService.new(d_items: d_items_del, user_id: @user_id)
                deleted_item_srv.execute_it

                deleted_item_srv = LinkService.new(d_items: d_items_del, user_id: @user_id)
                deleted_item_srv.execute_it
                # else # don't set params params[:is_recovery]
                # auto with action default is recovery
                # dont use because save_delete_item have default is recovery
                # if edit func can get many error
                # respond = [{:error => ids, :description => "Error don't sent params[:is_recovery]"}]
                # return render :json => respond.to_json(:except => EXCEPT_FIELDS)
              end
            end

            if d_items.present?
              description = is_recovery == "0" ? MSG_DELETE_SUCCESS : MSG_RECOVER_SUCCESS
              respond = {
                  success: API_SUCCESS,
                  data: data,
                  description: description
              }
            else
              respond = {
                error: API_ITEM_NOT_EXIST,
                data_error: data.map do |obj|
                  {
                    attributes: obj,
                    links_relative: []
                  }
                end,
                description: MSG_ERR_NOT_EXIST
              }
              return render :json => respond.to_json(:except => EXCEPT_FIELDS), status: :bad_request
            end
          rescue Exception => ex
            error = true
            respond = {
                data_error: data.map { |obj| { attributes: obj } },
                error: ids,
                description: MSG_DELETE_FAIL,
                msg: ex
            }
            raise ActiveRecord::Rollback
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
              delLnk.item_type = API_TRASH.to_s
              delLnk.user_id = @user_id
              delLnk.item_id = id
              delLnk.is_recovery = 1
              delLnk.save
            end
          end
      else
        respond = {
          data_error: [],
          error: ids,
          description: MSG_DELETE_FAIL
        }
      end
    end
    return render :json => respond.to_json(:except => EXCEPT_FIELDS), status: :internal_server_error if error

    respond_to do |format|
      format.json {render :json => respond.to_json(:except => EXCEPT_FIELDS)}
    end
  end

  # comment don't use on FLOL
  # def destroy_cal
  #   cal_id = params['cal_id']
  #   co_trashs = []
  #
  #   if cal_id.present?
  #     cos = CalendarObject.where(calendarid: cal_id)
  #     co_trashs = cos.map do |co|
  #       { obj_id: co.uri.split('.')[0], obj_type: co.componenttype }
  #     end
  #     co_ids = co_trashs.map { |t| t[:obj_id] }
  #
  #     Trash.where(['user_id = ? and obj_type = ? and obj_id = ?', @user_id, 'CALENDAR', cal_id]).delete_all
  #     Trash.where(['user_id = ? and obj_id in (?)', @user_id, co_ids]).delete_all
  #
  #     # TODO: switch to caldav methdods to verify user_id
  #     Calendar.where(['id = ?', cal_id]).delete_all
  #     CalendarObject.where(['calendarid = ?', cal_id]).delete_all
  #   end
  #
  #   respond_to do |format|
  #     format.json { render :json => co_trashs }
  #   end
  # end

  # comment don't use on FLOL
  # def restore_cal
  #   cal_id = params['cal_id']
  #   co_trashs = []
  #
  #   if cal_id.present?
  #     cos = CalendarObject.where(calendarid: cal_id)
  #     co_trashs = cos.map do |co|
  #       { obj_id: co.uri.split('.')[0], obj_type: co.componenttype }
  #     end
  #     co_ids = co_trashs.map { |t| t[:obj_id] }
  #
  #     Trash.where(['user_id = ? and obj_type = ? and obj_id = ?', @user_id, 'CALENDAR', cal_id]).delete_all
  #     Trash.where(['user_id = ? and obj_id in (?)', @user_id, co_ids]).delete_all
  #   end
  #
  #   respond_to do |format|
  #     format.json { render :json => co_trashs }
  #   end
  # end

  # Note: delete contact & url
  # caldav & folder are already handled by other specific api
  # calendar is no longer allowed to be deleted
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
end
