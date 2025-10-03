class ImportContact < ApplicationRecord
  self.table_name = "import_contact"
  self.primary_key = "id"
  
  def self.fields
    return ['id','file_name', 'user_id', 'file_size', 'last_modify', 'created_date', 'updated_date']
  end  
end

