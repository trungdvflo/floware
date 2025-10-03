FactoryBot.define do
  factory :project do
    proj_name { Faker::Crypto.sha256 }
    user_id 1
    alerts ""
    order_storyboard 1
    order_kanban 1
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
