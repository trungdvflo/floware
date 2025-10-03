json.data @histories do |history|
  json.history do
    json.merge! history.attributes.merge(ref: history.ref).except('user_id')
  end
end
json.data_error @histories_errors if @histories_errors.present?
