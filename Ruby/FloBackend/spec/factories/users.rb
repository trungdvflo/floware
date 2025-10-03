FactoryBot.define do
  factory :user do
    username 'test@123flo.com'
    email 'test@123flo.com'
    description 'Flo User'
    rsa '1'
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
