class CreateCriterions < ActiveRecord::Migration[5.0]
  def change
    unless table_exists? :criterions
      create_table :criterions do |t|
        t.integer :criterion_type, default: 0
        t.string :name
        t.integer :point, default: 0
        t.integer :priority, default: 1
        t.decimal :created_date,  precision: 13, scale: 3
        t.decimal :updated_date, precision: 13, scale: 3
      end
    end
  end
end
