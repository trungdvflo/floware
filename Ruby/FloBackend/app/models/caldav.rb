require "./lib/agcaldav.rb"

class Caldav
  attr_accessor :cal
  attr_accessor :url, :user, :password, :authtype

  def initialize
    url = FLOL_CALDAV_SERVER_URL #'http://localhost:8086/calendarserver.php/calendars/'
    user = CGI.escape('cong@flow-mail.com')
    password = 'cong2004'
    authtype = 'digest'

    begin
      require '~/.caldav_cred.rb'
    rescue LoadError
    end
  end
  
  def self.create_calendar_default(calendarURL, display_name, desc)
    calendar_time_zone = cal.createTimezone.to_ical
    cal.create_calendar(calendarURL, display_name, desc, calendar_time_zone)
  end

  def self.test_create_calendar(calendarURL, display_name, desc)
    calendar_time_zone = cal.createTimezone.to_ical
    cal.create_calendar(calendarURL, display_name, desc, calendar_time_zone)
  end

  # rubocop:disable Style/ColonMethodCall
  def self.update_calendar
    calendar_url = CGI::escape("LeBros'sCalII")
    cal = Icalendar::Calendar.new
    result = cal.update_calendar(calendar, calendar)
    return result
  end
  # rubocop:enable Style/ColonMethodCall

  # rubocop:disable Style/ColonMethodCall
  def self.update_calendar_color
    calendar_url = CGI::escape("work")
    color = '#FF9900FF'

    result = cal.update_calendar_color(calendar_url, color)
    return result
  end
  # rubocop:enable Style/ColonMethodCall

  def self.delete_calendar(calendar)
    result = cal.delete_calendar(calendar)
    return result
  end
end

