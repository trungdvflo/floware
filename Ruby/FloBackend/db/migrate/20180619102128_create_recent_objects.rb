class CreateRecentObjects < ActiveRecord::Migration[5.0]
  def self.up
    unless table_exists? :recent_objects
      create_table :recent_objects do |t|
        t.references :user
        t.string :dav_type
        t.string :uid
        t.integer :state, default: 0
        t.decimal :created_date,  precision: 13, scale: 3
        t.decimal :updated_date, precision: 13, scale: 3
      end
    end
  end

  def self.down
    drop_table :recent_objects
  end
end
