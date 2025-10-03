json.data @cloud_storages do |cs|
  json.cloud_storage do
    response_attr = cs.attributes.keys.map(&:to_sym) - [:user_id]
    json.extract! cs, *response_attr
  end
end

if @cloud_storages_deleted
  json.data_del do
    json.array! @cloud_storages_deleted
  end
end
