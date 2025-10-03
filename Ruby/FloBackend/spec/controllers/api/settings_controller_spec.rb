describe Api::SettingsController, type: :controller do
  include_context 'initialize auth with app_token'

  describe '#index' do
    let(:make_request) { get :index, params: params }

    before do
      make_request
    end

    context 'setting in the first time and with no params' do
      let(:params) {{  }}

      it 'create setting successful' do
        expect(json_response[:setting].count).to eq 71
        expect(Setting.count).to eq 1
        expect(Calendar.count).to eq 0
      end
    end

    context 'setting in the first time and with create_omni params' do
      let(:params) {{ create_omni: 1 }}

      it 'create setting successful' do
        expect(json_response[:setting].count).to eq 71
        expect(Setting.count).to eq 1
        expect(Calendar.count).to eq 1
      end
    end
  end

  describe '#update' do
    let(:make_request) { put :update, params: params }
    let(:setting) { create(:setting) }
    let(:expect_setting) { build(:setting) }

    before do
      setting
      make_request
    end

    context 'with params is valid' do
      let(:params) { { _json: JSON.parse(expect_setting.attributes.to_json) } }
      it 'return without errors' do
        expect(json_response[:data][:setting].count).to eq 71
        expect(json_response[:data][:setting][:timezone]).to eq expect_setting.timezone
      end
    end

    # TODO: json wrong format but it still was allowed save
    # context 'with params is invalid' do
    # end

  end
end
