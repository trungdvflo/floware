class CreateUsersTrackingApps < ActiveRecord::Migration[5.0]
  def self.up
    unless table_exists? :users_tracking_apps
      create_table :users_tracking_apps do |t|
        t.references :user
        t.references :tracking_app
        t.integer :last_used_date
        t.integer :created_date
        t.integer :updated_date
      end
    end
  end

  def self.down
    drop_table :users_tracking_apps
  end
end
