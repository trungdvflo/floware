FactoryBot.define do
  factory :app_register do
    app_regId { Faker::Crypto.sha256 }
    app_alias { Faker::Crypto.sha256 }
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
