class Kanban < ApplicationRecord
  include CommonScopes
  self.table_name = "kanbans"
  self.primary_key = "id"

  after_initialize :defaults, if: :new_record?

  attr_accessor :ref
  validates :order_number, uniqueness: {scope: [:user_id, :id], :message => " order_number is already exists."}
  validate :kanban_color
  validates :archive_status, numericality: { only_integer: true }, inclusion: { in: [0, 1] }, if:  Proc.new { |object| object.archive_status.present? }
  validates :show_done_todo, numericality: { only_integer: true }, inclusion: { in: [0, 1] },  if:  Proc.new { |object| object.show_done_todo.present? }
  validates :add_new_obj_type,  numericality: { only_integer: true }, inclusion: { in: [0, 1, 2, 3] },  if:  Proc.new { |object| object.add_new_obj_type.present? }
  validates :sort_by_type, numericality: { only_integer: true }, inclusion: { in: [0, 1, 2, 3] },  if:  Proc.new { |object| object.sort_by_type.present? }
  validates :kanban_type, numericality: { only_integer: true }, inclusion: { in: [0, 1] },  if:  Proc.new { |object| object.kanban_type.present? }
  validates :color, presence: true
  validates :name, presence: true

  scope :find_by_ids, ->(user_id, ids) { where('user_id = ? AND id IN (?)', user_id, ids) }

  belongs_to :project

  before_create :set_create_time
  before_update :set_update_time

  HEXA_COLOR_MATCHER = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

  #delete all item by uids
  def self.delete_kanbans(user_id, uids)
    uids_arr = uids.split(',')
    where(user_id: user_id, id: uids_arr).delete_all
    CanvasService.delete_canvas_by_kanban_ids(user_id, uids_arr)
  end

  def kanban_color
    if color.present? and color[HEXA_COLOR_MATCHER, 1].blank?
      errors.add(:color, 'should be hexa color format')
    end
  end

  private

  def defaults
    self.order_kbitem ||= ''
  end

  def set_create_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
    self.order_update_time = 0
  end

  def set_update_time
    self.updated_date = Time.now.utc.to_f.round(3)
  end
end
