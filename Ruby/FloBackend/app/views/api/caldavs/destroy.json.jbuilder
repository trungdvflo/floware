json.data @deleted_uids do |uid|
  json.uid uid
end

if @delete_uids_errors.present?
  json.data_error @delete_uids_errors do |err|
    json.extract! err, :error, :description
  end
end
