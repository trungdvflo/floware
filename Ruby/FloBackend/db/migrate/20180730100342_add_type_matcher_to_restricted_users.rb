class AddTypeMatcherToRestrictedUsers < ActiveRecord::Migration[5.0]
  def self.up
    unless column_exists? :restricted_users, :type_matcher
      add_column :restricted_users, :type_matcher, :integer, default: 0
    end
  end

  def self.down
    remove_column :restricted_users, :type_matcher
  end
end
