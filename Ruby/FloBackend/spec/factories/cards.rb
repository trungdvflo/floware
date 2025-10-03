FactoryBot.define do
  factory :card do
    uri { Faker::Crypto.sha1 }
  end
end
