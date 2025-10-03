FactoryBot.define do
  after(:build) do |user|
    user.class.skip_callback(:create, :before, :set_create_time, raise: false)
    user.class.skip_callback(:create, :before, :set_update_time, raise: false)
    user.class.skip_callback(:create, :before, :update_time, raise: false)
  end
end
