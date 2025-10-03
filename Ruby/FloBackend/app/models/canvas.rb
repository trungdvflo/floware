load 'lib/encode_decode_base64.rb'
class Canvas < ApplicationRecord
  self.table_name = "canvas_detail"
  self.primary_key = "id"

  include EncodeDecodeBase64
  include CommonScopes

  before_create :set_create_time
  before_update :set_update_time
  validates :item_id, uniqueness: { scope: [:collection_id, :item_type, :kanban_id, :user_id] }

  attr_accessor :ref

  belongs_to :kanban

  scope :find_by_ids, ->(user_id, ids) { where('user_id = ? AND id IN (?)', user_id, ids) }
  scope :find_by_item_ids, ->(user_id, item_ids) { where('user_id = ? AND item_id IN (?)', user_id, item_ids) }

  scope :with_item_type, lambda { |item_type|
    where(item_type: item_type) if item_type.present?
  }

  scope :with_kanban_id, lambda { |kanban_id|
    where(kanban_id: kanban_id) if kanban_id.present?
  }

  validates :item_type, inclusion: { in: ['VEVENT', 'VTODO',
                                          'VJOURNAL', 'EMAIL', 'VCARD', 'URL', 'FILE' ] }
  validates :source_account, numericality: { only_integer: true }, if:  Proc.new { |object| object.source_account.present? }
  validate :third_party_account_exist?

  def third_party_account_exist?
    if source_account.to_i != 0
      third_party_account = SetAccount.find_by(id: source_account, user_id: user_id)
      if third_party_account.blank?
        errors.add(:source_account, 'should be exist')
        return false
      end
    end
    true
  end

  def self.delete_all_canvas(user_id, ids)
    # where('user_id = ? AND ids IN (?)', user_id, ids).delete_all
    where(user_id: user_id, id: ids.split(',')).delete_all
  end

  def self.fields
    return ['id', 'collection_id','item_card_order','item_id','item_type','created_date', 'updated_date', 'kanban_id']
  end

  private

  def set_create_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
    #check item type is EMAIL
    #convert right format json
    if self.item_type and self.item_id.to_s.strip.length > 0 and
        self.item_type.to_s.upcase.strip == API_EMAIL # of if above
      self.item_id = EncodeDecodeBase64.process_string_b64_from_ascii_to_utf8(self.item_id)
    end
    self.order_update_time = 0
  end

  def set_update_time
    self.updated_date = Time.now.utc.to_f.round(3)
    #check item type is EMAIL
    #convert right format json
    if self.item_type and self.item_id.to_s.strip.length > 0 and
        self.item_type.to_s.upcase.strip == API_EMAIL # of if above
      self.item_type = EncodeDecodeBase64.process_string_b64_from_ascii_to_utf8(self.item_type)
    end
  end

end
