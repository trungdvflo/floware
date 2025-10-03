FactoryBot.define do
  factory :obj_order, class: ObjOrder do
    user_id 1
    obj_id { Faker::Number.number(6) }
    obj_type "VTODO"
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
