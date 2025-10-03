class CloudStorage < ApplicationRecord
  include CommonScopes
  attr_accessor :ref

  before_create :set_create_time
  before_update :set_update_time

  after_initialize :defaults, if: :new_record?

  belongs_to :user

  validates :bookmark_data, length: { minimum: 0, allow_nil: false, message: "can't be nil" }
  validates :uid_filename, presence: true

  private

  def defaults
    self.device_uid ||= ""
  end

  def set_create_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
  end

  def set_update_time
    self.updated_date = Time.now.utc.to_f.round(3)
  end
end
