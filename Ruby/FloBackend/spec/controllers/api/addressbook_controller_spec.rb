describe Api::AddressbookController, type: :controller do
  include_context 'initialize auth with app_token'

  let!(:time_now) { Time.zone.now.to_i }
  describe '#getChanges' do
    let(:make_request) { get :getChanges, params: params }

    before do
      make_request
    end

    context 'with ad_uri' do
      let(:params) {{ ad_uri: '1', syncTk: '1' }}
      
      it 'without errors' do
        expect(response).to be_successful
      end

    end
  end
end
