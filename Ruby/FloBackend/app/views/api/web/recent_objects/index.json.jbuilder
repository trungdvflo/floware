json.data @recent_objects do |recent_object|
  json.recent_object do
    response_attr = recent_object.attributes.keys.map(&:to_sym) - [:user_id]
    json.extract! recent_object, *response_attr
  end
end
