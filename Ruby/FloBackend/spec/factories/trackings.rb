FactoryBot.define do
  factory :tracking do
    user_id 1
    emails { Faker::Internet.free_email }
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
