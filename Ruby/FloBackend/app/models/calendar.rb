class Calendar < ApplicationRecord
  self.table_name = "calendars"
  self.primary_key = "id"

  has_many :calendarchanges, foreign_key: 'calendarid', dependent: :destroy
  has_many :calendar_objects, foreign_key: 'calendarid', dependent: :destroy
  
  def self.fields
    return ['id','principaluri', 'displayname', 'uri', 'ctag','description', 'calendarorder', 'calendarcolor', 'invisible']
  end 
  
  def self.create_omni_calendar(user_id, cal_uri = nil)
    
    # Create calendar timezone object
    # Note: These values are default (view more in agcaldav.client library)
    new_cal = Icalendar::Calendar.new
    new_cal.timezone do |t|
      t.tzid = "America/Chicago"
    
      t.daylight do |d|
        d.tzoffsetfrom = "-0600"
        d.tzoffsetto   = "-0500"
        d.tzname       = "CDT"
        d.dtstart      = "19700308T020000"
        d.rrule        = "FREQ=YEARLY;BYMONTH=3;BYDAY=2SU"
      end
    
      t.standard do |s|
        s.tzoffsetfrom = "-0500"
        s.tzoffsetto   = "-0600"
        s.tzname       = "CST"
        s.dtstart      = "19701101T020000"
        s.rrule        = "FREQ=YEARLY;BYMONTH=11;BYDAY=1SU"
      end
    end
    
    # Create Omni calendar record
    user = User.find_by_id(user_id)
    email = (user and user.id) ? user.email : ''
    principal = "principals/" + email.to_s.strip.downcase
    omni_cal = DEF_OMNI_CALENDAR_NAME
    uri = (cal_uri and cal_uri.to_s.strip.length > 0) ? cal_uri : UUID.new.generate()
    cal = Calendar.new()
    cal.principaluri = principal.to_s
    cal.displayname = omni_cal
    cal.uri = uri
    cal.calendarcolor = DEF_OMNI_CALENDAR_COLOR
    cal.timezone = new_cal.to_ical
    cal.description = omni_cal
    cal.components = 'VEVENT,VTODO,VJOURNAL,VFREEBUSY,VALARM'
    cal.save
    
    return uri #return calendar uri to save setting
  end
  
  #auto check and create Omni calendar
  def self.check_and_create_omni_cal(omni_cal, user_id)
    uri = omni_cal
    notExisted = 0
    #check exist omni_cal
    if omni_cal and omni_cal.to_s.strip.length > 0
      cal = Calendar.where(uri: omni_cal.strip).first
      if !cal
        notExisted = 1
      end
    else
      notExisted = 1
    end
    #if not existed, will create calendar
    if notExisted.to_i == 1
      uri = Calendar.create_omni_calendar(user_id, uri)
    end
    return uri
  end
end
