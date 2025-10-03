FactoryBot.define do
  factory :addressbook do
    principaluri { "principaluri/#{Faker::Internet.free_email}" }
    uri { Faker::Internet.free_email }
    synctoken 1
  end
end
