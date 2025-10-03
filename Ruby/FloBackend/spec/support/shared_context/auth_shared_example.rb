shared_context 'initialize auth with app_token' do
  let!(:virtual_domain) { create(:virtual_domain) }
  let!(:current_user) { create(:user, domain_id: virtual_domain.id, id: 1) }
  let!(:token) { build(:app_token, user_id: current_user.id) }
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }

  before do
    # stub authenticate
    stub_authenticate_with_app_token(token)
  end
end
