module Icalendar
  class Event < Component
  	# + subtasks: is a json string with array items
  	# Ex:[{{"id":"123","title":"con coc con", "modified":"123456"},{},{}}]
  	# + stask: is schedule task, default is false = 0. true = 1
  	# change key name: add "x_lcl" prefix
    optional_property :subtasks	
    optional_property :stask
    optional_property :star
    optional_property :color
    optional_property :folderid #no need anymore
    optional_property :taskduration
    optional_single_property :completed, Icalendar::Values::DateTime
    optional_single_property :due, Icalendar::Values::DateTime
    optional_property :notecontent
    
    
    optional_property :x_lcl_subtasks 
    optional_single_property :x_lcl_stask
    optional_single_property :x_lcl_star
    optional_property :x_lcl_color
    optional_property :x_lcl_folderid #no need anymore
    optional_property :x_lcl_taskduration
    optional_property :x_lcl_due
    optional_property :x_lcl_notecontent
    optional_property :x_lcl_tzcity
    optional_property :floware_only
  end
end
