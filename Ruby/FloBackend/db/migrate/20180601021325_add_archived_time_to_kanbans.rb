class AddArchivedTimeToKanbans < ActiveRecord::Migration[5.0]
  def self.up
    unless column_exists? :kanbans, :archived_time
      add_column :kanbans, :archived_time, :double, precision: 13, scale: 3, default: 0.000
    end
  end

  def self.down
    remove_column :kanbans, :archived_time
  end
end
