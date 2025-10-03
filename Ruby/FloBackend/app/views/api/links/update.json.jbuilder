json.data @links do |link|
  json.link do
    json.merge! link.attributes.merge(ref: link.ref).except('user_id', 'belongto')
    begin
      json.meta_data JSON.parse(link.meta_data || '{}')
    rescue
    end
  end
end

if @links_errors.present?
  json.data_error @links_errors
end
