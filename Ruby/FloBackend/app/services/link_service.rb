class LinkService
  attr_reader :d_items, :user_id, :is_recovery
  def initialize(service_params)
    @d_items = service_params[:d_items]
    @user_id = service_params[:user_id]
    @is_recovery = service_params[:is_recovery] || "0"
  end

  def execute_it
    ActiveRecord::Base.transaction do
      # @links = Link.find_by_ids(@user_id, @uids)
      #
      # @links.delete_all
      if data_present?
        @d_items.each do |d_item|
          single_deleted_link_param(d_item[:obj_id], d_item[:obj_type], @is_recovery)
        end
      end
    end
  end

  private

  def data_present?
    [@d_items, @user_id].all?(&:present?)
  end

  def link_params(d_items)
    # arr_params = []
    # @uids.each do |uid|
    #   arr_params << single_deleted_link_param(id)
    # end
    #
    # arr_params
  end

  def single_deleted_link_param(id, obj_type, is_recovery)
    case is_recovery
    when "1" # recovery
      # nothing because is recovery
    when "0" # delete permanently
      sql = 'user_id = ? AND
            (source_id = ? AND source_type = ?) OR
            (destination_id = ? AND destination_type = ?)'

      @links = Link.where([sql, @user_id, id, obj_type, id,  obj_type])

      DeletedItem.save_deleted_item(@user_id, @links) if @links.present?

      @links.delete_all
    else # don't set params params[:is_recovery]
      sql = 'user_id = ? AND
            (source_id = ? AND source_type = ?) OR
            (destination_id = ? AND destination_type = ?)'

      @links = Link.where([sql, @user_id, id, obj_type, id,  obj_type])

      DeletedItem.save_deleted_item(@user_id, @links) if @links.present?

      @links.delete_all
    end
  end
end