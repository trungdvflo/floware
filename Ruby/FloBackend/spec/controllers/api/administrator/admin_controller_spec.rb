describe Api::Administrator::AdminController, type: :controller do
  include_context 'initialize auth with app_token'
  let!(:time_now) { Time.zone.now.to_i }

  describe '#index' do
  end
end
