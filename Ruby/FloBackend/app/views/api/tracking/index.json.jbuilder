json.data @trackings do |tracking|
  json.tracking do
    json.merge! tracking.attributes.except('user_id')
    begin
      json.emails JSON.parse(tracking.emails)
    rescue
    end
  end
end

if @trackings_deleted
  json.data_del @trackings_deleted do |tracking_deleted|
    json.deleted_item do
      json.merge! tracking_deleted.attributes.except('user_id')
    end
  end
end
