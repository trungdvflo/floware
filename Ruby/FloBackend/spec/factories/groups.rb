FactoryBot.define do
  factory :group do
    name { Faker::Name.first_name }
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
