class CreateGroupsUsers < ActiveRecord::Migration[5.0]
  def self.up
    unless table_exists? :groups_users
      create_table :groups_users do |t|
        t.references :user
        t.references :group
        t.integer :created_date
        t.integer :updated_date
      end
    end
  end

  def self.down
    drop_table :groups_users
  end
end
