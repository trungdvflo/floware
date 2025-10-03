if @return_response.present?
  json.data @objects do |obj|
    json.item do
      json.merge! obj.attributes.except('user_id')
    end
  end

  if @object_errors.present?
    json.data_error @object_errors
  end
else
  json.data []
end
