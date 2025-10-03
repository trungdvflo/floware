class AddIsHideToProjectsUsers < ActiveRecord::Migration[5.0]
  def change
    unless column_exists? :projects_users, :is_hide
      add_column :projects_users, :is_hide, :integer, default: 0
    end
  end
end
