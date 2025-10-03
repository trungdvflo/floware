class Api::HistoriesController < Api::BaseController
  EXCEPT_FIELDS = [:user_id]
  def index
    @histories = History.where(user_id: current_user.id)
                        .with_modifiedGTE(params[:modifiedGTE])
                        .with_modifiedLT(params[:modifiedLT])
                        .with_ids(params[:ids])
                        .with_min_id(params[:minID])
                        .with_p_item(params[:pItem])
                        .with_fields(params[:fields])

    if params[:has_del].to_i == 1
      @histories_deleted = DeletedItem.get_del_items(current_user.id, API_HISTORY_TYPE,
                                                     params[:modifiedGTE], params[:modifiedLT],
                                                     params[:ids], params[:minDelID], params[:pItem])
    end
  end

  def create
    @histories = []
    @histories_errors = []

    if histories_params.size > API_LIMIT_PARAMS
      return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
    end

    histories_params.each do |history_hash|
      history = History.new history_hash
      history.user_id = current_user.id
      if history.save
        @histories << history
      else
        @histories_errors << { error: API_ITEM_CANNOT_SAVE,
                               attributes: history_hash,
                               description: history.errors.full_messages.join(',') }
      end
    end
  end

  def destroy
    super
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
                          attributes: res,
                          description: res.errors.full_messages.join(',') }
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
                          description: res.errors.full_messages.join(',') }
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

  private

  def deleted_item_service(hash_param)
    CreateDeletedItemService.new(ids: hash_param[:ids],
                                 user_id: current_user.id,
                                 item_type: API_HISTORY_TYPE.to_s)
  end

  def delete(ids)
    deleted_ids = []
    history_by_ids = History.find_by_ids(current_user.id, permit_id_params(ids))
    deleted_ids = history_by_ids.map(&:id)
    history_by_ids.destroy_all

    deleted_item_service(ids: deleted_ids).execute
    deleted_ids
  end

  def histories_params
    params.permit(:modifiedLT, :modifiedGTE, :ids, :pItem, :fields, :has_del,
                  histories: [:source_id,
                              :source_type,
                              :action,
                              :action_data,
                              :source_root_uid,
                              :destination_root_uid,
                              :destination_account,
                              :ref,
                              :path,
                              :obj_id,
                              :obj_type,
                              :source_account])
          .require(:histories)
  end
end
