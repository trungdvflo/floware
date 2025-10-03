describe Api::HistoriesController, type: :controller do
  include_context 'initialize auth with app_token'

  describe '#create' do
    let(:model_created) { create(:history) }
    let(:make_request) { post :create, params: params }

    before do
      model_created

      make_request
    end

    context 'when valid' do
      let(:params) do
        {
          histories:
            [
              JSON.parse(build(:history).attributes.to_json)
            ]
        }
      end

      it 'create history success' do
        created_object = History.find json_response[:data].first[:history][:id]
        expect(History.count).to eq 2
        expect(created_object).not_to be_nil
      end
    end

    context 'when invalid' do
      let(:params) { {} }

      it 'Not create history' do
        expect(History.count).to eq 1
      end
    end
  end
end
