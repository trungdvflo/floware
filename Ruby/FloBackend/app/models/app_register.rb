class AppRegister < ApplicationRecord
  self.table_name = "app_register"
  self.primary_key = "id"

  before_create :set_create_time
  before_update :set_update_time

  private
  
  def set_create_time
    self.created_date = Time.now.to_i
    self.updated_date = Time.now.to_i
  end
  
  def set_update_time
    self.updated_date = Time.now.to_i
  end
    
end
