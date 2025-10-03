describe Api::DevicetokenController, type: :controller do
  include_context 'initialize auth with app_token'
  include_examples :index_spec, DeviceToken, "device_token", [:modifiedGTE, :modifiedLT, :ids, :minID, :pItem]

  let!(:time_now) { Time.zone.now.to_i }

  let(:expect_object) { build(:device_token) }
  describe '#create' do
    let(:make_request) { post :create, params: params }

    before do
      create(:device_token)
      make_request
    end

    context 'with device token is valid' do
      let(:params) { JSON.parse(expect_object.to_json) }

      it 'create device token success' do
        expect(response).to be_successful
        expect(DeviceToken.count).to eq 2
        expect(json_response[:data].first[:device_token][:device_token]).to eq expect_object.device_token
        expect(json_response[:data].first[:device_token][:device_type]).to eq expect_object.device_type
        expect(json_response[:data].first[:device_token][:cert_env]).to eq expect_object.cert_env
      end
    end
  end
end
