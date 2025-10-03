class CreateDeletedItemService
  def initialize(service_params)
    @ids = service_params[:ids]
    @user_id = service_params[:user_id]
    @item_type = service_params[:item_type]
    @is_recovery = service_params[:is_recovery] || 0
  end

  def execute
    DeletedItem.find_or_create_by(deleted_item_params)
  end

  private

  def deleted_item_params
    arr_params = []
    @ids.each do |id|
      arr_params << single_deleted_item_param(id)
    end

    arr_params
  end

  def single_deleted_item_param(id)
    DeletedItem.new(item_type: @item_type,
                    user_id: @user_id,
                    is_recovery: @is_recovery,
                    item_id: id)
  end

end
