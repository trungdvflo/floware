class Api::RecentObjectsController < Api::BaseController
  def index
    @recent_objects = RecentObject.where(user_id: current_user_id.user_id)
                                  .order('updated_date desc')
                                  .with_ids(params[:ids])
                                  .with_dav_type(params[:dav_type])
                                  .with_min_id(params[:minID])
                                  .with_p_item(params[:pItem])
                                  .with_p_number(params[:pNumber], params[:pItem])
                                  .with_uids(params[:uids])
  end

  def create
    @recent_objects = []
    recent_objects_params = params[:recent_objects] || params[API_PARAMS_JSON]
    return unless recent_objects_params.present?

    recent_objects_params.each do |recent_object_params|
      next unless recent_object_params[:uid].present?
      @recent_objects << RecentObject.create_or_update(hash_recent_object_params(recent_object_params))
    end
  end

  private

  def hash_recent_object_params(recent_object_params)
    hash = {}

    hash[:user_id] = current_user_id.user_id
    hash[:dav_type] = recent_object_params[:dav_type]
    hash[:state] = recent_object_params[:state] || 0
    hash[:uid] = recent_object_params[:uid]

    hash
  end
end
