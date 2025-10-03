class Api::CanvasController < Api::BaseController
  include Pundit
  before_action :limit_params, only: [:create, :update]
  before_action :authorize_via_kanbans_params, only: [:index]
  before_action :authorize_via_canvas_params, only: [:update, :destroy, :recover]

  def index
    @canvas = []

    if @kanban_ids.present?
      @canvas = Canvas.where(kanban_id: @kanban_ids)
    else
      @canvas = Canvas.where(user_id: current_user.id)
    end

    @canvas = @canvas.with_modifiedGTE(params[:modifiedGTE])
                     .with_modifiedLT(params[:modifiedLT])
                     .with_item_type(params[:item_type])
                     .with_ids(params[:ids])
                     .with_min_id(params[:minID])
                     .with_p_item(params[:pItem])
                     .with_fields(params[:fields])

    if params[:has_del].to_i == 1
      @canvas_deleted = DeletedItem.where(user_id: current_user.id, item_type: API_CANVAS_TYPE)
                                   .with_modifiedGTE(params[:modifiedGTE])
                                   .with_modifiedLT(params[:modifiedLT])
                                   .with_ids(params[:ids])
                                   .with_min_id(params[:minDelID])
                                   .with_p_item(params[:pItem])
    end
  end

  def create
    @canvas = []
    @canvas_errors = []

    canvas_params.each do |hash|
      project = Kanban.find_by(id: hash[:kanban_id])&.project || Project.new
      authorize project, :owner_or_member?
    end

    canvas_params.each do |hash|
      project = Kanban.find_by(id: hash[:kanban_id])&.project
      canvas = Canvas.new hash.except(:id)
      canvas.user_id = project.owner.id
      current_order_number = Canvas.where(user_id: project.owner.id,
                                          kanban_id: hash[:kanban_id])
                                   .minimum(:order_number) || 0
      canvas.order_number = current_order_number - 1
      if canvas.save
        @canvas << canvas
      else
        @canvas_errors << { error: API_ITEM_CANNOT_SAVE, attributes: hash,
                            description: canvas.errors.full_messages.join(',') }
      end
    end
  end

  def update
    @canvas = []
    @canvas_errors = []

    canvas_params.each do |hash|
      canvas = Canvas.find_by(id: hash[:id])

      if canvas.blank?
        @canvas_errors << { error: API_ITEM_NOT_EXIST, attributes: hash,
                            description: MSG_ERR_NOT_EXIST }
        next
      end

      if canvas&.update_attributes hash.except(:id, :user_id)
        @canvas << canvas
      else
        @canvas_errors << { error: API_ITEM_CANNOT_SAVE, attributes: hash,
                            description: canvas&.errors&.full_messages.join(',') || MSG_ERR_NOT_SAVED }
      end
    end
  end

  def destroy
    @deleted_ids = []
    @delete_ids_errors = []

    canvas_params.each do |hash|
      canvas = Canvas.find_by(id: hash[:id])
      project = canvas&.kanban&.project

      if canvas&.destroy
        @deleted_ids << canvas.id
      else
        @delete_ids_errors << { error: API_ITEM_NOT_EXIST,
                                description: MSG_ERR_NOT_EXIST,
                                id: hash[:id] }
      end
      deleted_item_service({ ids: @deleted_ids, user_id: project.owner.id}).execute
    end
  end

  def recover
    @deleted_ids = []
    @delete_ids_errors = []

    canvas_params.each do |hash|
      canvas = Canvas.find_by(id: hash[:id])
      project = canvas&.kanban&.project

      @deleted_ids << canvas.id if canvas
      deleted_item_service({ ids: @deleted_ids, user_id: project.owner.id, is_recovery: 1 }).execute
    end
  end

  # rubocop:disable Performance/RedundantMatch
  def destroy_by_item_id
    item_id =  if params[:item_id].match(/^\d+$/)
                 params[:item_id].to_i
               else
                 params[:item_id]
               end

    collection_id = params[:collection_id]
  
    canvas_detail = Canvas.where(item_id: item_id, collection_id: collection_id)
    if item_id.present?
      record = canvas_detail.destroy_all
      respond = { :success => API_SUCCESS, :description => MSG_DELETE_SUCCESS, :record => record }
    else
      respond = {:error => item_id, :description => MSG_DELETE_FAIL}
    end
  
    respond_to do |format|
      format.json { render :json => respond }
    end
  end
  # rubocop:enable Performance/RedundantMatch

  def get_kanbans_by_item_id
    #parameters
    user_id = 0
    user_id = current_user_id.user_id if current_user_id

    #respond
    respond_list = Array.new()
    sql = "user_id = :user_id"
    conditions = {:user_id => user_id}

    if !params[:item_ids].blank?
      item_ids = params[:item_ids].split(",")
      if item_ids.length == 1
        sql << ' AND item_id = :item_id '
      elsif item_ids.length > 1
        sql << ' AND item_id IN (:item_id) '
      end
      conditions[:item_id] = item_ids
    end

    if params[:item_ids]
      sql << ' AND collection_id = :collection_id '
      conditions[:collection_id] = params[:collection_id]
    end

    cols = Canvas.where([sql, conditions])

    field = params[:fields]
    if field and field.length > 0
      #auto remove field if it does not have field name
      arr = field.split(',')
      f = Array.new()
      arr.each do |a|
        f << a if Canvas.fields.include?(a.to_s)
      end
      cols = cols.select(f)
    end

    respond_list = cols

    respond_to do |format|
      format.json {render :json => respond_list.to_json(:root => API_CANVAS, :except => EXCEPT_FIELDS)}
    end
  end

  def destroy_by_folder
    folder_id = params[:folder_id]

    if folder_id.present?
      record = Canvas.where(['user_id = ? AND collection_id = ?', @user_id, folder_id]).delete_all
    end

    respond = { :success => API_SUCCESS, :description => MSG_DELETE_SUCCESS, :record => record }

    respond_to do |format|
      format.json { render :json => respond }
    end
  end

  private

  def authorize_via_canvas_params
    canvas_params.each do |hash|
      project = Canvas.find_by(id: hash[:id])&.kanban&.project || Project.new
      authorize project, :owner_or_member?
    end
  end

  def authorize_via_kanbans_params
    @kanban_ids = []

    kanbans_params.each do |kanban_id|
      project = Kanban.find_by(id: kanban_id)&.project || Project.new
      authorize project, :owner_or_member?
      @kanban_ids << kanban_id
    end
  end

  def limit_params
    if canvas_params.size > API_LIMIT_PARAMS
      return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
    end
  end

  def canvas_params
    params.permit(canvas: [:project_id, :item_card_order, :item_id, :item_type, :kanban_id, :source_account,
                           :order_number, :order_update_time, :id, :ref])
          .require(:canvas)
  end

  def kanbans_params
    params.permit(kanban_ids: []).fetch(:kanban_ids, {})
  end

  def deleted_item_service(hash_param)
    CreateDeletedItemService.new(ids: hash_param[:ids],
                                 user_id: hash_param[:user_id],
                                 item_type: API_CANVAS_TYPE.to_s)
  end
end
