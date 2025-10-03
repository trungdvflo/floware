class Trash < ApplicationRecord
  self.table_name = "trash"
  self.primary_key = "id"

  # validates :url, :presence => true, :uniqueness => { :scope => :user_id, :case_sensitive => false}

  attr_accessor :ref, :links_relative

  before_create :set_create_time
  before_update :set_update_time

  scope :find_by_ids, ->(user_id, ids) { where('user_id = ? AND id IN (?)', user_id, ids) }
  validates :obj_type, inclusion: { in: ['VEVENT', 'VTODO',
                                         'VJOURNAL', 'VCALENDAR', 'FOLDER', 'LINK', 'URL',
                                         'TRACK', 'FILE', 'TRASH', 'KANBAN', 'EMAIL', 'CANVAS',
                                         'HISTORY', 'VCARD', 'ORDER_OBJ', 'SET_3RD_ACC',
                                         'SUGGESTED_COLLECTION', 'CSFILE'] }

  validates :status, numericality: { only_integer: true }, inclusion: { in: [1, 2] }
  validates :obj_id, presence: true, uniqueness: { scope: [:obj_type, :user_id] }

  #deleted by obj_id
  def self.delete_trash(user_id, ids)
    where('user_id = ? AND id IN (?)', user_id, ids).delete_all
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
