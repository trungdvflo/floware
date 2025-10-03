require 'net/https'
#require 'net/http/digest_auth'
#require 'uuid'
require 'rexml/document'
require 'rexml/xpath'
require 'icalendar'
#require 'time'
require 'date'

#'event_v1.rb', 'todo_v1.rb': iclendar v1.1.6
['client.rb', 'google_client', 'yahoo_client', 'icloud_client.rb', 'request.rb', 'net.rb', 'query.rb', 'filter.rb',
 'event.rb', 'todo.rb', 'journal.rb', 'alarm.rb', 'timezone.rb', 'format.rb', 'manual_parser.rb',
 'calendars_collection.rb', 'calendar.rb'].each do |f|
    require File.join( File.dirname(__FILE__), 'agcaldav', f )
end
