class CreateRestrictedUsers < ActiveRecord::Migration[5.0]
  def self.up
    unless table_exists? :restricted_users 
      create_table :restricted_users do |t|
        t.string :name

        t.timestamps
      end
    end
  end

  def self.down
    drop_table :restricted_users
  end
end
