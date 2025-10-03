class CreateSuggestedCollections < ActiveRecord::Migration[5.0]
  def change
    unless table_exists? :suggested_collections
      create_table :suggested_collections do |t|
        t.references :project, index: true
        t.integer :criterion_type, index: true, default: 1
        t.references :user, index: true
        t.text :criterion_value
        t.integer :frequency_used, default: 0
        t.decimal :created_date,  precision: 13, scale: 3
        t.decimal :updated_date, precision: 13, scale: 3
      end
    end
  end
end
