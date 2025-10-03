FactoryBot.define do
  factory :projects_card do
    project 1
    card_uid { Faker::Crypto.sha1 }
    href 'test@123flo.com'
  end
end
