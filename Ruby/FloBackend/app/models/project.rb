class Project < ApplicationRecord
  include CommonScopes

  SHARED = 3

  self.table_name = "projects"
  self.primary_key = "id"

  after_initialize :defaults, if: :new_record?

  attr_accessor :ref
  attr_accessor :is_trash
  validates :proj_name, :presence => true, :uniqueness => { :scope => [:user_id, :parent_id], :case_sensitive => false, :message => " is already exists."}

  belongs_to :owner, class_name: 'User', foreign_key: :user_id
  has_many :projects_users, dependent: :delete_all
  has_many :members, through: :projects_users, source: :user
  has_many :projects_cards, dependent: :delete_all

  has_many :suggested_collections, dependent: :delete_all
  has_many :kanbans, dependent: :delete_all

  before_create :set_create_time
  before_update :set_update_time

  validates :parent_id, numericality: true
  validates :flag, numericality: { only_integer: true }, inclusion: { in: [0, 1] }, if:  Proc.new { |object| object.flag.present? }
  validates :is_hide, numericality: { only_integer: true }, inclusion: { in: [0, 1] }, if:  Proc.new { |object| object.is_hide.present? }
  validates :proj_type, numericality: { only_integer: true }, inclusion: { in: [-1, -2, -3, -4, -5, 0, 1, 2, 3] }, if:  Proc.new { |object| object.proj_type.present? }
  validates :state, numericality: { only_integer: true }, inclusion: { in: [0, 1, 2] }, if:  Proc.new { |object| object.state.present? }
  validates :is_expand, numericality: { only_integer: true }, inclusion: { in: [0, 1] }, if:  Proc.new { |object| object.is_expand.present? }
  validates :view_mode, numericality: { only_integer: true }, inclusion: { in: [0, 1] }, if:  Proc.new { |object| object.view_mode.present? }
  validates :view_sort, numericality: { only_integer: true }, inclusion: { in: [0, 1] }, if:  Proc.new { |object| object.view_sort.present? }
  validates :kanban_mode, numericality: { only_integer: true }, inclusion: { in: [0, 1] }, if:  Proc.new { |object| object.kanban_mode.present? }

  validate :parent_exist?
  validate :project_color
  validate :alerts_valid?

  HEXA_COLOR_MATCHER = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

  scope :available, lambda {
    where(is_hide: 1)
  }

  scope :has_trash, lambda { |trash_ids|
    where(id: trash_ids).select('*, TRUE as is_trash')
  }
  scope :not_trash, lambda { |trash_ids|
    where.not(id: trash_ids).select('*, FALSE as is_trash')
  }

  def alerts_valid?
    alert_keys = ['uid', 'action', 'trigger', 'description', 'created_date', 'updated_date']
    trigger_keys = ['past', 'weeks', 'days', 'hours', 'minutes', 'seconds']

    if alerts.present?
      begin
        json_alerts = JSON.parse alerts
        json_alerts.each do |alert|
          alert.keys.each do |item|
            unless alert_keys.include? item
              errors.add(:alerts, 'invalid')
              return false
            end
          end

          alert['trigger'].keys.each do |item|
            unless trigger_keys.include? item
              errors.add(:alerts, 'invalid')
              return false
            end
          end

          unless [true, false].include? alert['trigger']['past']
            errors.add(:alerts, 'invalid')
            return false
          end

          unless [*0..4].include? alert['trigger']['weeks']
            errors.add(:alerts, 'invalid')
            return false
          end

          unless [*0..30].include? alert['trigger']['days']
            errors.add(:alerts, 'invalid')
            return false
          end

          unless [*0..24].include? alert['trigger']['hours']
            errors.add(:alerts, 'invalid')
            return false
          end

          unless [*0..60].include? alert['trigger']['minutes']
            errors.add(:alerts, 'invalid')
            return false
          end

          unless [*0..60].include? alert['trigger']['seconds']
            errors.add(:alerts, 'invalid')
            return false
          end
        end
      rescue
        errors.add(:alerts, 'invalid')
        return false
      end
    end
  end

  def project_color
    if proj_color.present? and proj_color[HEXA_COLOR_MATCHER, 1].blank?
      errors.add(:proj_color, 'should be hexa color format')
    end
  end

  def parent_exist?
    return true if parent_id.to_i == 0
    parent = Project.find_by(id: parent_id, user_id: user_id)
    errors.add(:parent_id, 'should be exist') if parent.blank?
  end

  def self.delete_all_projects(user_id, ids)
    where(user_id: user_id, id: ids.split(',')).destroy_all
  end

  # update folder color
  def self.update_folder_color(caluri, color)
    where(calendar_id: caluri).update_all(proj_color: color)
  end

  # update folder is_hide
  def self.update_folder_stt(folder_id, is_hide)
    where(id: folder_id.split(',')).update_all(is_hide: is_hide)
  end

  #auto update default calendar for folder when user delete folder's calendar
  def self.update_default_calendar(proj_cal_uri, def_cal_uri)
    where(calendar_id: proj_cal_uri).update_all(calendar_id: def_cal_uri)
  end

  def self.fields
    return ['id','proj_name', 'proj_color', 'calendar_id', 'parent_id','created_date', 'updated_date']
  end

  private

  def defaults
    self.alerts ||= ""
    self.order_storyboard ||= ""
    self.order_kanban ||= ""
  end

  def set_create_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
    self.recent_time = Time.now.utc.to_f.round(3)
  end

  def set_update_time
    self.updated_date = Time.now.utc.to_f.round(3)
    self.recent_time = Time.now.utc.to_f.round(3)
  end
end
