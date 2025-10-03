json.data @device_tokens do |device_token|
  json.device_token do
    json.merge! device_token.attributes.except('user_id')
  end
end
