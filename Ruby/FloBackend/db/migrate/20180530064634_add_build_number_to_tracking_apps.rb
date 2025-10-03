class AddBuildNumberToTrackingApps < ActiveRecord::Migration[5.0]
  def self.up
    add_column :tracking_apps, :build_number, :string unless column_exists? :tracking_apps, :build_number
  end

  def self.down
    remove_column :tracking_apps, :build_number
  end
end
