shared_examples_for :index_spec do |model, model_json, permit_params|
  model_name = model_json

  let!(:time_now) { Time.zone.now.to_i }

  describe '#index' do
    let(:model_1_day_ago) { create(model_name.to_sym, updated_date: 1.day.ago.to_i) }
    let(:model_2_day_ago) { create(model_name.to_sym, updated_date: 2.days.ago.to_i) }
    let(:model_1_day_from_now) { create(model_name.to_sym, updated_date: 1.day.from_now.to_i) }
    let(:make_request) { get :index, params: params }

    before do
      create(model_name.to_sym, user_id: 10)
      create(model_name.to_sym)
      create(model_name.to_sym)

      model_1_day_ago
      model_2_day_ago
      model_1_day_from_now

      make_request
    end

    context 'with no params' do
      let(:params) {{  }}
      it "response all #{model}" do
        expect(response).to be_successful
        expect(model.count).to eq 6
        expect(json_response[:data].count).to eq 5
      end
    end

    if permit_params.include? :modifiedGTE
      context 'with modifiedLT params is valid' do
        let(:params) { { modifiedLT: time_now } }

        it 'response data with updated_date less than from now' do
          expect(response).to be_successful
          expect(model.count).to eq 6
          expect(json_response[:data].count).to eq 2
        end
      end
    end

    if permit_params.include? :modifiedLT
      context 'with modifiedGTE params is valid' do
        let(:params) { { modifiedGTE: time_now } }

        it 'response data with updated_date greater than or equal from now' do
          expect(response).to be_successful
          expect(model.count).to eq 6
          expect(json_response[:data].count).to eq 3
        end
      end
    end

    if permit_params.include? :ids
      context 'with ids params is valid' do
        let(:params) {{ ids: "#{model_1_day_ago.id},#{model_2_day_ago.id}" }}

        it 'return 2 items' do
          expect(response).to be_successful
          expect(model.count).to eq 6
          expect(json_response[:data].count).to eq 2
        end
      end
    end

    if permit_params.include? :pItem
      context 'with pItem params is valid' do
        let(:params) { { pItem: '3' } }
        it 'return 3 deleted item' do
          expect(response).to be_successful
          expect(model.count).to eq 6
          expect(json_response[:data].count).to eq 3
        end
      end
    end

    if permit_params.include? :fields
      context 'with fields params is valid' do
        let(:params) { { fields: 'id,updated_date,proj_name' } }
        it 'return 5 deleted item with fields selected' do
          expect(response).to be_successful
          expect(json_response[:data].count).to eq 5
          expect(json_response[:data].first[model_name.to_sym][:id]).not_to be_nil
          expect(json_response[:data].first[model_name.to_sym][:updated_date]).not_to be_nil
          expect(json_response[:data].first[model_name.to_sym][:created_date]).to be_nil
        end
      end
    end

    if permit_params.include? :minID
      context 'with minID params is valid' do
        let(:params) { { minID: "#{model_2_day_ago.id}" } }
        it 'return 2 deleted item' do
          expect(response).to be_successful
          expect(json_response[:data].count).to eq 1
          expect(json_response[:data].first[model_name.to_sym][:id]).to eq model_1_day_from_now.id
        end
      end
    end
  end
end
