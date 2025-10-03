json.data @links do |link|
  json.link do
    json.merge! link.attributes.except('user_id', 'belongto')
    begin
      json.meta_data JSON.parse(link.meta_data || '{}')
    rescue
    end
  end
end

if @links_deleted
  json.data_del @links_deleted do |link_deleted|
    json.deleted_item do
      json.merge! link_deleted.attributes.except('user_id')
    end
  end
end
