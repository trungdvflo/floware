class CanvasService
  attr_reader :d_items, :user_id, :is_recovery
  def initialize(service_params)
    @d_items = service_params[:d_items]
    @user_id = service_params[:user_id]
    @is_recovery = service_params[:is_recovery] || "0"
  end

  def execute_it
    ActiveRecord::Base.transaction do
      # @d_items.each do |d_item|
      #   single_deleted_param(d_item[:item_id], @is_recovery) if link_data_present?
      # end
      if data_present?
        ids_del = @d_items.map { |item| item[:obj_id] }
        d_canvas_detail = Canvas.where(user_id: @user_id, item_id: ids_del).destroy_all
        d_canvas_detail.each { |x| save_delete_item(API_CANVAS_TYPE, x.id, 0) }
      end
    end
  end

  def delete_canvas_of_col
    ActiveRecord::Base.transaction do
      if data_present?
        # get collection delete
        collection_id = @d_items.map{ |item| item[:collection_id] } if @d_items.present?
        kanban_ids = Kanban.where(user_id: @user_id, project_id: collection_id).pluck(:id)
        ids_del = @d_items.map { |item| item[:obj_id] }
        d_canvas_detail = Canvas.where(user_id: @user_id, item_id: ids_del, kanban_id: kanban_ids).destroy_all
        d_canvas_detail.each { |x| save_delete_item(API_CANVAS_TYPE, x.id, 0) }
        d_canvas_detail.map(&:kanban_id)
      end
    end
  end

  def self.delete_canvas_by_kanban_ids(user_id, kanban_ids)
    ActiveRecord::Base.transaction do
      if user_id.present? && kanban_ids.present?
        d_canvas_detail = Canvas.where(user_id: user_id, kanban_id: kanban_ids).destroy_all
        d_canvas_detail.each { |x| CanvasService.save_deleted_item(API_CANVAS_TYPE, x.id, 0) }
        d_canvas_detail.map(&:kanban_id)
      end
    end
  end

  def self.save_deleted_item(user_id, type, id, is_recovery = 0)
    id = id.to_s.strip

    if id.present?
      item = DeletedItem.new
      item.item_type = type.to_s
      item.user_id = user_id
      item.item_id = id
      item.is_recovery = is_recovery if is_recovery and is_recovery.to_i == 1
      item.save
    end
  end

  private

  def data_present?
    [@d_items, @user_id].all?(&:present?)
  end

  def save_delete_item(type, id, is_recovery = 0)
    id = id.to_s.strip

    if id.present?
      item = DeletedItem.new
      item.item_type = type.to_s
      item.user_id = @user_id
      item.item_id = id
      item.is_recovery = is_recovery if is_recovery and is_recovery.to_i == 1
      item.save
    end
  end

  # def single_deleted_param(item_id, is_recovery)
  # end
end
