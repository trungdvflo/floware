class CreateProjectsCards < ActiveRecord::Migration[5.0]
  def change
    unless table_exists? :projects_cards
      create_table :projects_cards do |t|
        t.references :project, index: true
        t.string :card_uid
        t.string :href
        t.references :set_account, index: true, default: 0
        t.decimal :created_date,  precision: 13, scale: 3
        t.decimal :updated_date, precision: 13, scale: 3
      end
    end
  end
end
