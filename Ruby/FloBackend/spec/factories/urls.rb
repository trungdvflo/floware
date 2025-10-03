FactoryBot.define do
  factory :url do
    title { Faker::Company.name }
    url { Faker::Internet.url }
    order_number { Faker::Number.number(3) }
    user_id 1
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
