class CreateTrackingApps < ActiveRecord::Migration[5.0]
  def self.up
    unless table_exists? :tracking_apps
      create_table :tracking_apps do |t|
        t.string :name
        t.string :app_version
        t.string :flo_version
        t.integer :created_date
        t.integer :updated_date
      end
    end
  end

  def self.down
    drop_table :tracking_apps
  end
end
