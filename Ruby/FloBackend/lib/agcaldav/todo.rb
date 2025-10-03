module Icalendar

  class Todo < Component
    # change key name: add "x-lcl" prefix
    optional_property :subtasks 
    optional_property :stask
    optional_property :star
    optional_property :color
    optional_property :folderid #no need anymore
    optional_property :taskduration
    optional_property :notecontent
    optional_single_property :dtend, Icalendar::Values::DateTime
    
    optional_property :x_lcl_subtasks
    optional_single_property :x_lcl_stask
    optional_single_property :x_lcl_star
    optional_property :x_lcl_color
    optional_property :x_lcl_folderid #no need anymore
    optional_property :x_lcl_taskduration
    optional_property :x_lcl_due
    optional_property :x_lcl_notecontent
    optional_property :x_apple_sort_order #apple reminder
    optional_property :x_yahoo_duration #yahoo todo
    optional_property :floware_only
    
    # required_property :dtstamp, Icalendar::Values::DateTime
    # required_property :uid
    # # dtstart only required if duration is specified
    # required_property :dtstart, Icalendar::Values::DateTime,
                      # ->(todo, dtstart) { !(!todo.duration.nil? && dtstart.nil?) }
# 
    # optional_single_property :due, Icalendar::Values::DateTime
    # optional_single_property :duration, Icalendar::Values::Duration
    # mutually_exclusive_properties :due, :duration
# 
    # optional_single_property :ip_class
    # optional_single_property :completed, Icalendar::Values::DateTime
    # optional_single_property :created, Icalendar::Values::DateTime
    # optional_single_property :description
    # optional_single_property :geo, Icalendar::Values::Float
    # optional_single_property :last_modified, Icalendar::Values::DateTime
    # optional_single_property :location
    # optional_single_property :organizer, Icalendar::Values::CalAddress
    # optional_single_property :percent_complete, Icalendar::Values::Integer
    # optional_single_property :priority, Icalendar::Values::Integer
    # optional_single_property :recurrence_id, Icalendar::Values::DateTime
    # optional_single_property :sequence, Icalendar::Values::Integer
    # optional_single_property :status
    # optional_single_property :summary
    # optional_single_property :url, Icalendar::Values::Uri
# 
    # optional_property :rrule, Icalendar::Values::Recur, true
    # optional_property :attach, Icalendar::Values::Uri
    # optional_property :attendee, Icalendar::Values::CalAddress
    # optional_property :categories
    # optional_property :comment
    # optional_property :contact
    # optional_property :exdate, Icalendar::Values::DateTime
    # optional_property :request_status
    # optional_property :related_to
    # optional_property :resources
    # optional_property :rdate, Icalendar::Values::DateTime
# 
    # component :alarm, false
# 
    # def initialize
      # super 'todo'
      # self.dtstamp = Icalendar::Values::DateTime.new Time.now.utc, 'tzid' => 'UTC'
      # self.uid = new_uid
    # end

  end

end
