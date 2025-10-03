class AddMetaDataToLinks < ActiveRecord::Migration[5.0]
  def change
    unless column_exists? :links, :meta_data
      add_column :links, :meta_data, :text
    end
  end
end
