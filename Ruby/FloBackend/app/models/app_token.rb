class AppToken < ApplicationRecord
  self.table_name = "app_token"
  self.primary_key = "id"

  before_create :set_create_time
  before_update :set_update_time

  belongs_to :user

  #delete all token when user change password
  def self.delete_tokens(user_id)
    where(user_id: user_id).delete_all
  end

  private
  
  def set_create_time
    self.created_time = Time.now.utc.to_f.round(3)
  end
  
  def set_update_time
    self.time_expire = Time.now.utc.to_f.round(3)
  end
  
end
