FactoryBot.define do
  factory :set_accounts, class: SetAccount do
    user_income { Faker::Internet.free_email }
    pass_income { Faker::Internet.password(10, 20) }
    signature "1"
    email_address ""
    account_type 1
    user_id 1
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
