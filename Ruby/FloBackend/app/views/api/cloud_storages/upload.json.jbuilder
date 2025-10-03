description = @data_response[:description]
cloud_storage = @data_response[:cloud_storage]

json.data do
  json.description description
  if cloud_storage
    json.cloud_storage do
      response_attr = cloud_storage.keys - ['user_id']
      json.extract! cloud_storage, *response_attr
    end
  end
end
