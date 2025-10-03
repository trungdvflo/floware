FactoryBot.define do
  factory :groups_user do
    user_id 1
    group_id group
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
