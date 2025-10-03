class Tracking < ApplicationRecord
  self.table_name = "tracking"
  self.primary_key = "id"

  attr_accessor :ref

  before_create :set_create_time
  before_update :set_update_time

  scope :find_by_ids, ->(user_id, ids) { where('user_id = ? AND id IN (?)', user_id, ids) }
  validates :status, presence: true, numericality: { only_integer: true }, inclusion: { in: [0, 1, 2] },  if:  Proc.new { |object| object.status.present? }
  validates :path, presence: true
  validates :acc_id, presence: true, numericality: { only_integer: true }
  validates :uid, presence: true
  validate :third_party_account_exist?
  validate :email_valid?, if: :emails_changed?

  EMAIL_PATTERN = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

  def email_valid?
    json_emails.each do |email|
      if email.keys.size > 1
        errors.add(:emails, 'invalid')
        return false
      end

      if email['email'][EMAIL_PATTERN, 1].blank?
        errors.add(:emails, 'should be email format')
        return false
      end
    end
  end

  def json_emails
    result = []
    begin
      result = JSON.parse(emails) if emails.present?
    rescue
      result = []
      errors.add(:emails, 'invalid')
    end
    result
  end

  def third_party_account_exist?
    if acc_id.to_i != 0
      third_party_account = SetAccount.find_by(id: acc_id, user_id: user_id)
      if third_party_account.blank?
        errors.add(:acc_id, 'should be exist')
        return false
      end
    end
    true
  end

  def self.delete_all_trackings(user_id, ids)
    where(user_id: user_id, id: ids.split(',')).delete_all
  end

  private

  def set_create_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
  end

  def set_update_time
    self.updated_date = Time.now.utc.to_f.round(3)
  end
end
