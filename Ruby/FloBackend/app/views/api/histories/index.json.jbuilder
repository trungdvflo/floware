json.data @histories do |history|
  json.history do
    json.merge! history.attributes.except('user_id')
  end
end

if @histories_deleted
  json.data_del @histories_deleted do |history_deleted|
    json.deleted_item do
      json.id history_deleted.id
      json.item_type history_deleted.item_type
      json.item_id history_deleted.item_id
      json.created_date history_deleted.created_date
      json.updated_date history_deleted.updated_date
      json.is_recovery history_deleted.is_recovery
    end
  end
end
