FactoryBot.define do
  factory :canvas, class: 'Canvas' do
    item_id { Faker::Crypto.md5 }
    user_id 1
    item_type 'VTODO'
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
