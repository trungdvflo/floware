FactoryBot.define do
  factory :device_token, class: DeviceToken do
    user_id 1
    device_token { Faker::Crypto.sha256 }
    device_type 1
    cert_env 1
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
