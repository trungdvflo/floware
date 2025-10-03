FactoryBot.define do
  factory :deleted_item do
    item_type 'URL'
    user_id '1'
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
