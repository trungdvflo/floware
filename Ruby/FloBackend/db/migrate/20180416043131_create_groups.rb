class CreateGroups < ActiveRecord::Migration[5.0]
  def self.up
    unless table_exists? :groups
      create_table :groups do |t|
        t.string :name
        t.integer :created_date
        t.integer :updated_date
      end
    end
  end

  def self.down
    drop_table :groups
  end
end
