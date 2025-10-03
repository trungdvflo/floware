class UsersTrackingApp < ApplicationRecord
  before_create :set_create_time
  before_update :set_update_time

  belongs_to :user
  belongs_to :tracking_app

  validates :user_id, presence: true, uniqueness: { scope: :tracking_app_id }
  validates :tracking_app_id, presence: true

  def self.first_or_initialize(attributes = nil, &block)
    where(attributes).first || new(attributes, &block)
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
