json.data @suggested_collections do |suggested_collection|
  json.id suggested_collection.id
  json.criterion_type suggested_collection.criterion_type
  json.criterion_value suggested_collection.criterion_value
  json.created_date suggested_collection.created_date
  json.updated_date suggested_collection.updated_date
  json.frequency_used suggested_collection.frequency_used
  if suggested_collection.identical_senders.present?
    json.identical_senders suggested_collection.identical_senders do |sender|
      json.email_address sender.email_address
    end
  end
  json.project suggested_collection.project, :id, :proj_name, :proj_color
end
json.data_error @suggested_collections_errors if @suggested_collections_errors.present?
