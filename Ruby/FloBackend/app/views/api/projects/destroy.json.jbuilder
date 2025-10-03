json.data @deleted_ids do |id|
  json.id id
end

if @projects_errors.present?
  json.data_error @projects_errors do |err|
    json.extract! err, :id, :error, :description
  end
end
