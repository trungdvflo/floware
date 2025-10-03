FactoryBot.define do
  factory :history do
    user_id 1
    source_id { UUID.new.generate }
    source_type "VCARD"
    obj_id { UUID.new.generate }
    obj_type "VEVENT"
    source_account 1
    action 4
    action_data "MyString"
  end
end
