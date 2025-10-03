json.data @cloud_storages do |cloud_storage|
  json.cloud_storage do
    json.extract! cloud_storage,
                  :id,
                  :uid_filename,
                  :real_filename,
                  :device_uid,
                  :bookmark_data,
                  :size,
                  :ext,
                  :upload_status,
                  :created_date,
                  :updated_date,
                  :ref
  end
end
json.data_error @data_err if @data_err.present?
