FactoryBot.define do
  factory :cloud_storage do
    user_id 1
    uid_filename { SecureRandom.uuid }
    real_filename { Faker::File.file_name }
    device_uid { Faker::Crypto.sha1 }
    bookmark_data { Faker::Crypto.sha1 }
    size { Faker::Number.number(4) }
    ext { Faker::File.extension }
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
