json.data @calendar_objects do |calendar_object|
  json.calendar_object do
    # json.merge! calendar_object.attributes.except('id')
    json.merge! calendar_object.attributes
  end
end
json.data_error @calendar_objects_errors if @calendar_objects_errors.present?
