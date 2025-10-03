class CreateProjectsUsers < ActiveRecord::Migration[5.0]
  def change
    unless table_exists? :projects_users
      create_table :projects_users do |t|
        t.references :project, index: true
        t.references :user, index: true
        t.integer :status, default: 0
        t.integer :permission, default: 0
        t.decimal :created_date,  precision: 13, scale: 3
        t.decimal :updated_date, precision: 13, scale: 3
      end
    end
  end
end
