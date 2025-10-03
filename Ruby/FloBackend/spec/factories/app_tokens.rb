FactoryBot.define do
  factory :app_token do
    user_id 1
    email 'test@flomail.net'
    token 'abc123456'
    time_expire '1460766870'
    key_api 'abc123456'
    app_pregId 'e70f1b125cbad944424393cf309efaf0'
  end
end
