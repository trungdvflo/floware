shared_examples_for :destroy_spec do |model, model_json, permit_params|
  model_name = model_json

  describe '#destroy' do
    let(:model_created_1) { create(model_name.to_sym) }
    let(:model_created_2) { create(model_name.to_sym) }
    let(:model_created_3) { create(model_name.to_sym) }
    let(:make_request) { delete :destroy, params: params }

    before do
      model_created_1
      model_created_2
      model_created_3

      make_request
    end

    if permit_params.include? :id
      context 'when valid with id params' do
        let(:params) {{ id: "#{model_created_1.id},#{model_created_3.id}" }}

        it 'deleted successful' do
          expect(response).to be_successful
          expect(model.count).to eq 1
          expect(DeletedItem.count).to eq 2
          expect(json_response[:data].count).to eq 2
          expect(json_response[:data]).to include({id: model_created_1.id.to_s})
          expect(json_response[:data]).to include({id: model_created_3.id.to_s})
          expect(json_response[:data]).not_to include({id: model_created_2.id.to_s})
        end
      end

      context 'when invalid with id params' do
        let(:params) {{ id: "100000" }}

        it 'do nothing and response without error' do
          expect(response).to be_successful
          expect(DeletedItem.count).to eq 0
          expect(model.count).to eq 3
          expect(json_response[:data_error].count).to eq 1
        end
      end
    end


    if permit_params.include? :re_ids
      context 'when valid with re_ids params' do
        let(:params) {{ id: "0", re_ids: "#{model_created_1.id}" }}

        it 'insert to DeletedItem table with is_recovery = 1' do
          expect(response).to be_successful
          expect(DeletedItem.count).to eq 1
          expect(DeletedItem.first.is_recovery).to eq 1
          expect(json_response[:data].first[:id]).to eq model_created_1.id.to_s
        end
      end

      context 'when invalid with re_ids params' do
        let(:params) {{ id: "0", re_ids: "100000" }}

        it 'do nothing and response without errors' do
          expect(response).to be_successful
          expect(DeletedItem.count).to eq 0
          expect(model.count).to eq 3
          expect(json_response[:data].count).to eq 0
        end
      end
    end
  end
end
