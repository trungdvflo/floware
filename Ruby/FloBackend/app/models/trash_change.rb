class TrashChange < ApplicationRecord
  self.table_name = "trash_change"
  self.primary_key = "id"
  
  # validates :url, :presence => true, :uniqueness => { :scope => :user_id, :case_sensitive => false}
  
  attr_accessor :ref
  
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
