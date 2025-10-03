json.data @trackings do |tracking|
  json.tracking do
    json.merge! tracking.attributes.merge(ref: tracking.ref).except('user_id')
    begin
      json.emails JSON.parse(tracking.emails)
    rescue
    end
  end
end

json.data_error @trackings_errors if @trackings_errors.present?
