class Api::KanbansController < Api::BaseController
  include Pundit
  before_action :limit_params, only: [:create, :update]
  before_action :authorize_via_kanbans_params, only: [:create, :update, :destroy]
  before_action :authorize_via_project_ids_params, only: [:index, :archived]

  def index
    @kanbans = []
    if @project_ids.present?
      @kanbans = Kanban.where(project_id: @project_ids)
    else
      @kanbans = Kanban.where(user_id: current_user.id)
    end

    @kanbans = @kanbans.with_modifiedGTE(params[:modifiedGTE])
                       .with_modifiedLT(params[:modifiedLT])
                       .with_ids(params[:ids])
                       .with_min_id(params[:minID])
                       .with_p_item(params[:pItem])
                       .with_fields(params[:fields])
    if params[:has_del].to_i == 1
      @kanbans_deleted = DeletedItem.where(user_id: current_user.id, item_type: API_KANBAN)
                                    .with_modifiedGTE(params[:modifiedGTE])
                                    .with_modifiedLT(params[:modifiedLT])
                                    .with_ids(params[:ids])
                                    .with_min_id(params[:minDelID])
                                    .with_p_item(params[:pItem])
    end
  end

  def create
    @kanbans = []
    @kanbans_errors = []

    kanbans_params.each do |hash|
      project = Project.find_by(id: hash[:project_id])

      kanban = Kanban.new hash.except(:id)
      kanban.user_id = project.owner.id
      current_order_number = Kanban.where(user_id: project.owner.id,
                                          project_id: hash[:project_id]).maximum(:order_number) || 0
      kanban.order_number = current_order_number + 1
      if kanban.save
        @kanbans << kanban
      else
        @kanbans_errors << { error: API_ITEM_CANNOT_SAVE, attributes: hash,
                             description: kanban.errors.full_messages.join(',') }
      end
    end
  end

  def update
    @kanbans = []
    @kanbans_errors = []

    kanbans_params.each do |hash|
      project = Project.find_by(id: hash[:project_id])

      kanban = project.kanbans.find_by(id: hash[:id])
      if kanban.blank?
        @kanbans_errors << { error: API_ITEM_NOT_EXIST, attributes: hash,
                             description: MSG_ERR_NOT_EXIST }
        next
      end

      if kanban&.update_attributes hash.except(:id, :user_id)
        @kanbans << kanban
      else
        @kanbans_errors << { error: API_ITEM_CANNOT_SAVE, attributes: hash,
                             description: kanban&.errors&.full_messages.join(',') || MSG_ERR_NOT_SAVED }
      end
    end
  end

  def destroy
    @deleted_ids = []
    @delete_ids_errors = []

    kanbans_params.each do |hash|
      project = Project.find_by(id: hash[:project_id])

      kanban = project.kanbans.find_by(id: hash[:id])
      if kanban&.destroy
        @deleted_ids << kanban.id
      else
        @delete_ids_errors << { error: API_ITEM_NOT_EXIST,
                                description: MSG_ERR_NOT_EXIST,
                                id: hash[:id] }
      end
      deleted_item_service({ ids: @deleted_ids, user_id: project.owner.id}).execute
    end
  end

  def archived
    if @project_ids.present?
      @kanbans = Kanban.where(project_id: @project_ids, archive_status: 1)
    else
      @kanbans = Kanban.where(user_id: current_user.id, archive_status: 1)
    end
  end

  def destroy_by_folder
    folder_id = params[:folder_id]

    if folder_id.present?
      record = Kanban.where(['user_id = ? AND project_id = ?', @user_id, folder_id]).delete_all
    end

    respond = { :success => API_SUCCESS, :description => MSG_DELETE_SUCCESS, :record => record }

    respond_to do |format|
      format.json { render :json => respond }
    end
  end

  private

  def authorize_via_kanbans_params
    kanbans_params.each do |hash|
      project = Project.find_by(id: hash[:project_id]) || Project.new
      authorize project, :owner_or_member?
    end
  end

  def authorize_via_project_ids_params
    @project_ids = []
    @owner_ids = []

    projects_params.each do |project_id|
      project = Project.find_by(id: project_id) || Project.new
      authorize project, :owner_or_member?
      @project_ids << project.id
      @owner_ids << project.owner.id
    end
  end

  def limit_params
    if kanbans_params.size > API_LIMIT_PARAMS
      return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
    end
  end

  def kanbans_params
    params.permit(kanbans: [:project_id, :id, :name, :color, :order_number, :archive_status,
                            :kanban_type, :order_updae_time, :show_done_todo, :add_new_obj_type,
                            :sort_by_type, :archived_time, :ref])
          .require(:kanbans)
  end

  def projects_params
    params.permit(project_ids: []).fetch(:project_ids, {})
  end

  def deleted_item_service(hash_param)
    CreateDeletedItemService.new(ids: hash_param[:ids],
                                 user_id: hash_param[:user_id],
                                 item_type: API_KANBAN.to_s)
  end
end
