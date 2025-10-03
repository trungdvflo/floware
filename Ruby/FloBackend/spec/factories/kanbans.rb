FactoryBot.define do
  factory :kanban do
    name { Faker::Company.name }
    user_id 1
    project_id 1
    order_kbitem 1
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
