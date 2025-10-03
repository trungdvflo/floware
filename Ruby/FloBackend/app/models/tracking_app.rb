class TrackingApp < ApplicationRecord
  before_create :set_create_time
  before_update :set_update_time

  def self.first_or_create(attributes = nil, &block)
    where(attributes).first || create(attributes, &block)
  end

  private

  def set_create_time
    self.created_date = Time.now.utc.to_i
    self.updated_date = Time.now.utc.to_i
  end

  def set_update_time
    self.updated_date = Time.now.utc.to_i
  end
end
