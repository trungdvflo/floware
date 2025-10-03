class AddDescriptionToGroups < ActiveRecord::Migration[5.0]
  def self.up
    unless column_exists? :groups, :description
      add_column :groups, :description, :text
    end
  end

  def self.down
    remove_column :groups, :description
  end
end
