json.data @deleted_ids do |id|
  json.id id.to_s
end

unless @data_error.empty?
  json.data_error @data_error do |err|
    json.extract! err, :id, :error, :description
  end
end
