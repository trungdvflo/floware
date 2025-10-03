class AddIndexToRecentObjects < ActiveRecord::Migration[5.0]
  def self.up
    unless index_exists?(:recent_objects, [:user_id, :uid, :updated_date])
      add_index :recent_objects, [:user_id, :uid, :updated_date]
    end
  end

  def self.down
    remove_index :recent_objects, :user_id
  end
end
