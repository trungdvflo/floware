module Icalendar
  class Timezone < Component
  	# + subtasks: is a json string with array items
  	# Ex:[{{"id":"123","title":"con coc con", "modified":"123456"},{},{}}]
  	# + stask: is schedule task, default is false = 0. true = 1
  	# change key name: add "x_lcl" prefix

    optional_property :x_lic_location
  end
end