class DeviceToken < ApplicationRecord
  self.table_name = "device_token"
  self.primary_key = "id"
  
  validates :device_token, presence: true, uniqueness: true
  
  attr_accessor :ref
  
  before_create :set_create_time
  before_update :set_update_time

  validates :device_type, numericality: { only_integer: true }, inclusion: { in: [0, 1, 2, 3, 4] }, if:  Proc.new { |object| object.device_type.present? }
  validates :cert_env, numericality: { only_integer: true }, inclusion: { in: [0, 1] }, if:  Proc.new { |object| object.cert_env.present? }
  validates :status_app_run, numericality: { only_integer: true }, inclusion: { in: [0, 1, 2] }, if:  Proc.new { |object| object.status_app_run.present? }
  validates :device_env, numericality: { only_integer: true }, inclusion: { in: [0, 1] }, if:  Proc.new { |object| object.device_env.present? }
  
  def self.delete_device_token(ids)
    where('device_token IN (?)', ids).delete_all
  end
  
  def self.delete_device_token_of_others(dvtk)
    where('device_token = ?', dvtk).delete_all
  end
  
  private
  
  def set_create_time
    self.created_date = Time.now.to_i
    self.updated_date = Time.now.to_i
  end
  
  def set_update_time
    self.updated_date = Time.now.to_i
  end
end
