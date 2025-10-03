class Calendarchange < ApplicationRecord
  ADD_OPERATION = 1
  MODIFY_OPERATION = 2
  DELETE_OPERATION = 3

  self.table_name = "calendarchanges"
  self.primary_key = "id"
  
  belongs_to :calendar

  def self.fields
    return ['id','uri', 'synctoken', 'calendarid', 'operation']
  end 
end
  
