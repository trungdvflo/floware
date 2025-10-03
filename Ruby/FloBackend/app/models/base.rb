class Base < ActiveRecord::Base
  self.abstract_class = true

  def self.save_delete_item(user_id, type, id, is_recovery = 0)
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
end