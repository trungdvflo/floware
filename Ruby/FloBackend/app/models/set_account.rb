class SetAccount < ApplicationRecord
  self.table_name = "set_accounts"
  self.primary_key = "id"

  ACCOUNT_TYPE_GOOGLE = 1
  ACCOUNT_TYPE_YAHOO = 2
  ACCOUNT_TYPE_OTHER_EMAIL = 3
  ACCOUNT_TYPE_OTHER_CALDAV = 4
  ACCOUNT_TYPE_ICLOUD = 5
  ACCOUNT_TYPE_SMARTDAY = 6
  ACCOUNT_TYPE_OTHER_ACCOUNT= 7

  before_create :set_create_time
  before_update :set_update_time

  attr_accessor :ref
  validates :user_income, :presence => true, :uniqueness => { :scope => [:user_id, :account_type, :server_income], :case_sensitive => false, :message => " is already exists."}

  before_save :defaults

  scope :find_by_ids, ->(user_id, ids) { where('user_id = ? AND id IN (?)', user_id, ids) }

  validates :useSSL_income, numericality: { only_integer: true }, inclusion: { in: [0, 1] }
  validates :useSSL_smtp, numericality: { only_integer: true }, inclusion: { in: [0, 1] }
  validates :auth_type, numericality: { only_integer: true }, inclusion: { in: [0, 256] }
  validates :account_type, numericality: { only_integer: true }, inclusion: { in: [1, 2, 3, 4, 5, 6, 7] }
  validate :account_sync_valid?, if: :account_sync_changed?

  def account_sync_valid?
    return true if account_sync.blank?

    account_sync_keys = Set.new ['Email', 'Calendar', 'Contact']
    account_sync_values = [0, 1]

    begin
      json_account_sync = JSON.parse(account_sync)
      if json_account_sync.size <= 3
        json_account_sync.keys.each do |item|
          unless account_sync_keys.include? item
            errors.add(:account_sync, 'invalid')
            return false
          end
          unless account_sync_values.include? json_account_sync[item]
            errors.add(:account_sync, 'invalid')
            return false
          end
        end
      else
        errors.add(:account_sync, 'invalid')
        return false
      end
    rescue
      errors.add(:account_sync, 'invalid')
      return false
    end
  end

  def self.delete_all_set_accounts(user_id, ids)
    where(user_id: user_id, id: ids.split(',')).delete_all
  end

  #send mail for 3rd account when they add 3rd account into Flo system
  def self.send_mail_to_3rd_account(email_3rd, floEmail = '')
    if email_3rd and email_3rd.to_s.length > 0
      email = email_3rd.to_s.strip.downcase
      UserMailer.flo_send_3rd_account(email, floEmail).deliver_now
    end
  end

  def self.fields
    return ['id', 'signature', 'created_date','updated_date','server_income','user_income','pass_income','port_income','useSSL_income',
      'type_income','server_smtp','user_smtp','pass_smtp','port_smtp','useSSL_smtp','auth_type_smtp','server_caldav',
      'server_path_caldav','port_caldav','useSSL_caldav','useKerberos_caldav','auth_type','account_type','account_sync','auth_key','auth_token',
      'full_name', 'description', 'refresh_token', 'provider', 'icloud_user_id', 'user_caldav', 'email_address']
  end

  def self.get_all_3rd_acc_by_email(email)
    sql = "SELECT acc.user_income, acc.account_type "
    sql << "FROM set_accounts acc, users u "
    sql << "WHERE acc.user_id = u.id "
    sql << "AND u.username= :email"
    find_by_sql([sql, { email: email }])
  end

  private

  def defaults
    self.signature ||= ""
  end

  def set_create_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
  end

  def set_update_time
    self.updated_date = Time.now.utc.to_f.round(3)
  end
end
