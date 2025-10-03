class Setting < ApplicationRecord
  self.table_name = "settings"
  self.primary_key = "id"

  after_initialize :defaults, if: :new_record?
  before_create :set_create_time
  validates :week_start, numericality: { only_integer: true }, inclusion: { in: [0, 1] }, if:  Proc.new { |object| object.week_start.present? }
  validates :action_icon, numericality: { only_integer: true }, inclusion: { in: [0, 1] },  if:  Proc.new { |object| object.action_icon.present? }
  validates :show_star, numericality: { only_integer: true }, inclusion: { in: [0, 1] },  if:  Proc.new { |object| object.show_star.present? }
  validates :number_mail_lines_preview, numericality: { only_integer: true }, inclusion: { in: [0, 1, 2, 3, 4, 5, 6, 7] },  if:  Proc.new { |object| object.number_mail_lines_preview.present? }
  validates :event_duration, numericality: { only_integer: true }

  validate :keep_state_valid?, if: :keep_state_changed?
  validate :working_time_valid?, if: :working_time_changed?
  validate :default_folder_valid?, if: :default_folder_changed?
  validate :recent_tz_valid?, if: :recent_tz_changed?

  def working_time_valid?
    key_working_time = ['day', 'iMin', 'iMax']

    if working_time.present?
      begin
        json_working_time = JSON.parse working_time
        json_working_time.each do |time|
          if time.keys.size != 3
            errors.add(:working_time, 'invalid')
            return false
          end

          time.keys.each do |key|
            unless key_working_time.include? key
              errors.add(:working_time, 'invalid')
              return false
            end
          end

          if time['iMin'].is_a?(Numeric) == false or time['iMin'] < 0 == true or time['iMin'] > 86400 == true
            errors.add(:working_time, 'invalid')
            return false
          end

          if time['iMax'].is_a?(Numeric) == false or time['iMax'] < 0 or time['iMax'] > 86400
            errors.add(:working_time, 'invalid')
            return false
          end

          if time['iMin'] > time['iMax']
            errors.add(:working_time, 'invalid')
            return false
          end
        end
      rescue
        errors.add(:working_time, 'invalid')
        return false
      end
    end
  end

  def recent_tz_valid?
    recent_tz_keys = ['city', 'country', 'timezone']

    if recent_tz.present?
      begin
        json_recent_tz = JSON.parse recent_tz
        json_recent_tz.each do |tz|
          if tz.keys.size != 3
            errors.add(:recent_tz, 'invalid')
            return false
          end

          tz.keys.each do |item|
            unless recent_tz_keys.include? item
              errors.add(:recent_tz, 'invalid')
              return false
            end
          end
        end
      rescue
        errors.add(:recent_tz, 'invalid')
        return false
      end
    end
  end

  def keep_state_valid?
    if keep_state.present?
      begin
        JSON.parse keep_state
      rescue
        errors.add(:keep_state, 'invalid')
        return false
      end
    end
  end

  def default_folder_valid?
    if default_folder.present?
      project = Project.find_by(id: default_folder, user_id: user_id)
      if project.blank?
        errors.add(:default_folder, 'invalid')
        return false
      end
    end
  end

  # create setting default for user
  def self.create_setting_default(user_id = 0, calendar_uid = '', folder_id = 0, timezone = '')
   wkHours = '[
  {"day":"Mon","iMin":32400, "iMax": 64800}
  ,{"day":"Tue","iMin":32400, "iMax": 64800}
  ,{"day":"Wed","iMin":32400, "iMax": 64800}
  ,{"day":"Thu","iMin":32400, "iMax": 64800}
  ,{"day":"Fri","iMin":32400, "iMax": 64800}
  ,{"day":"Sat","iMin":32400, "iMax": 64800}
  ,{"day":"Sun","iMin":32400, "iMax": 64800}
  ]'

    setting = {}
    setting[:user_id] = user_id
    setting[:default_cal] = calendar_uid
    setting[:timezone] = timezone.present? ? timezone : 'America/Chicago'
    setting[:event_duration] = 3600 #default is 1 hour
    setting[:alert_default] = 1 #pop up alert
    setting[:alert_before] =  -1
    setting[:default_ade_alert] = -1
    setting[:snooze_default] = 900 #15 mins
    setting[:timezone_support] = 1 #true or false
    setting[:task_duration] = 1800 #mins = 30 mins = 1800 seconds
    setting[:deadline] = -1 #None option
    setting[:due_task] = 0
    setting[:number_stask] = 5
    setting[:total_duration] = 21600
    setting[:buffer_time] = 900
    setting[:hide_stask] = 0
    setting[:default_folder] = folder_id
    setting[:calendar_color] = DEF_COLOR.to_s
    setting[:folder_color] = DEF_COLOR.to_s
    setting[:working_time] = wkHours.to_s #json string
    setting[:m_show] = 23 #month show
    setting[:dw_show] = 17 #day week show
    setting[:default_todo_alert] = -1 #date of due option
    setting[:mail_moving_check] = 3 #check for bear track
    setting[:noti_bear_track] = 3 #show notification for bear trackon alert box
    setting[:filing_email] = false
    #for contact
    setting[:contact_display_name] = 1
    setting[:contact_display_inlist] = 0


    # setting[:default_milestone_alert] = 1800 #30 mins

    return setting
  end


  private

  def defaults
    self.navbar_system ||= ""
    self.navbar_custom ||= ""
    self.infobox ||= ""
    self.avatar ||= ""
    self.signature ||= ""
  end

  def set_create_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
  end
end
