class CreateIdenticalSenders < ActiveRecord::Migration[5.0]
  def change
    unless table_exists? :identical_senders
      create_table :identical_senders do |t|
        t.references :suggested_collection, index: true
        t.references :user_id, index: true
        t.string :email_address
        t.decimal :created_date,  precision: 13, scale: 3
        t.decimal :updated_date, precision: 13, scale: 3
      end
    end
  end
end
