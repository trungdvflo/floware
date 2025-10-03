FactoryBot.define do
  factory :setting do
    timezone { FFaker::AddressCHFR.time_zone }
    user_id 1
    navbar_system 1
    navbar_custom 1
    infobox 1
  end
end
