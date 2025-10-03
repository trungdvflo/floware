json.data @links do |link|
  json.link do
    json.merge! link.attributes.except('user_id', 'belongto')
    begin
      json.meta_data JSON.parse(link.meta_data || '{}')
    rescue
    end
  end
end
