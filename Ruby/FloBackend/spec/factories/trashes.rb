FactoryBot.define do
  factory :trash do
    user_id 1
    obj_type 'URL'
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
