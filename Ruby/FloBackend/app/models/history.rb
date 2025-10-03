class History < ApplicationRecord
  self.table_name = "history"
  self.primary_key = "id"

  include CommonScopes
  before_create :set_create_time
  before_update :set_update_time
  
  attr_accessor :ref

  validates :source_id, presence: true, uniqueness: { scope: [:source_type, :source_account,
                                              :source_root_uid, :source_root_uid, :obj_type,
                                              :obj_id, :destination_account,
                                              :destination_root_uid, :user_id],
                                      conditions: -> { where.not('action in (4,5,9,10)') } }
  has_many :criterion_types

  validates :source_type, inclusion: { in: ['VCARD', 'RECEIVER', 'SENDER', 'INVITEE' ]}
  validates :action, numericality: { only_integer: true }, inclusion: { in: [4, 5, 6, 7, 8, 9, 10]}
  validates :source_account, numericality: { only_integer: true }, if:  Proc.new { |object| object.source_account.present? }

  validate :third_party_account_exist?
  validate :root_uid_valid?
  validate :obj_type_valid?

  def third_party_account_exist?
    if source_account.to_i != 0
      third_party_account = SetAccount.find_by(id: source_account, user_id: user_id)
      if third_party_account.blank?
        errors.add(:source_account, 'should be exist')
        return false
      end
    end
    if destination_account.to_i != 0
      third_party_account = SetAccount.find_by(id: destination_account, user_id: user_id)
      if third_party_account.blank?
        errors.add(:destination_account, 'should be exist')
        return false
      end
    end
    return true
  end

  def root_uid_valid?
    if source_type == 'VCARD' and source_root_uid.blank?
      errors.add(:source_root_uid, 'should not empty')
      return false
    end

    if obj_type == 'VEVENT' and destination_root_uid.blank?
      errors.add(:destination_root_uid, 'should not empty')
      return false
    end
  end

  def obj_type_valid?
    if action == 4 or action == 5 or action == 9 or action == 10
      if obj_type.present?
        errors.add(:obj_type, 'should be empty')
        return false
      end
    end

    if action == 6 or action == 7
      if obj_type != 'EMAIL'
        errors.add(:obj_type, 'invalid')
        return false
      end
    end

    if action == 8
      if obj_type != 'VEVENT'
        errors.add(:obj_type, 'invalid')
        return false
      end
    end
  end

  def self.delete_all_history(user_id, ids)
    where(user_id: user_id, id: ids.split(',')).delete_all
  end
  
  def self.get_histories_by_contact(contact_uid, user_id)
    sql = " SELECT h.id as history_id, h.*, co.*, c.calendarcolor , c.uri"
    sql << " FROM history h "
    sql << " LEFT JOIN calendarobjects co ON co.uid = h.obj_id "
    sql << " LEFT JOIN calendars c ON c.id = co.calendarid "
    sql << " LEFT JOIN principals p ON p.uri = c.principaluri "
    sql << " INNER JOIN users u "
    sql << " ON (u.email = p.email or h.obj_type != 'VEVENT') and u.id = h.user_id"
    sql << " WHERE h.source_id = ? "
    sql << " AND h.user_id = ? "
    sql << " ORDER BY h.created_date DESC "
  
    find_by_sql([sql, contact_uid, user_id])
  end
  
  def self.get_histories_by_event(event_uid, user_id)
    sql = "SELECT h.id as history_id, h.*, c.carddata, ad.uri as ab_uri"
    sql << " FROM history h"
    sql << " LEFT JOIN cards c ON c.uri = CONCAT_WS('.',h.source_id, 'vcf')"
    sql << " LEFT JOIN addressbooks ad ON c.addressbookid = ad.id"
    sql << " WHERE h.user_id = ?"
    sql << " AND h.obj_id = ? AND h.obj_type ='VEVENT'"
    sql << " ORDER BY h.created_date DESC"
  
    find_by_sql([sql, user_id, event_uid])
  end

  def self.delete_histories_by_objects(user_id, objs)
    objs.each do |obj|
      history = History.arel_table
      clause_1 = history[:user_id].eq(user_id)
                                  .and(history[:source_id].eq(obj[:source_id]))
                                  .and(history[:source_type].eq(obj[:source_type]))
                                  .and(history[:obj_id].eq(obj[:obj_id]))
                                  .and(history[:obj_type].eq(obj[:obj_type]))
      clause_2 = history[:user_id].eq(user_id)
                                  .and(history[:source_id].eq(obj[:obj_id]))
                                  .and(history[:source_type].eq(obj[:obj_type]))
                                  .and(history[:obj_id].eq(obj[:source_id]))
                                  .and(history[:obj_type].eq(obj[:source_type]))

      where(clause_1.or(clause_2)).delete_all
    end
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
