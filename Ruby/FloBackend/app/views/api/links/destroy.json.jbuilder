json.data @deleted_ids do |id|
  json.id id
end

if @delete_ids_errors.present?
  json.data_error @delete_ids_errors do |err|
    json.extract! err, :id, :error, :description
  end
end
