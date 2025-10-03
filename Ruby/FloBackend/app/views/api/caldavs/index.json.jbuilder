json.data @calendar_objects do |calendar_object|
  json.calendar_object do
    # json.merge! calendar_object.attributes.except('id')
    json.merge! calendar_object.attributes
  end
end

if @canvas_deleted
  json.data_del @canvas_deleted do |canvas_deleted|
    json.deleted_item do
      json.merge! canvas_deleted.attributes.except('user_id')
    end
  end
end
