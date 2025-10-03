shared_examples_for :resources do |model, model_json, methods|
  model_name = model_json

  let!(:time_now) { Time.zone.now.to_i }

  if methods.include? :create
    describe '#create' do
      let(:model_created) { create(model_name.to_sym) }
      let(:make_request) { post :create, params: params }

      before do
        model_created

        make_request
      end

      context 'when valid' do
        let(:params) do
          {
            _json:
              [
                JSON.parse(build(model_name.to_sym).attributes.to_json)
              ]
          }
        end

        it "create #{model} success" do
          created_object = model.find json_response[:data].first[model_name.to_sym][:id]
          expect(model.count).to eq 2
          expect(created_object).not_to be_nil
          if model.column_names.include?('order_number')
            expect(created_object.order_number).to eq model_created.order_number + 1
          end
        end
      end

      context 'when invalid' do
        let(:params) { {} }

        it "Not create #{model}" do
          expect(model.count).to eq 1
        end
      end
    end
  end

  if methods.include? :update
    describe '#update' do
      let(:model_created_1) { create(model_name.to_sym) }
      let(:model_created_2) { create(model_name.to_sym) }
      let(:expect_model) { build(model_name.to_sym, id: model_created_1.id) }
      let(:make_request) { put :update, params: params}

      before do
        model_created_1
        model_created_2

        make_request
      end

      context 'when valid' do
        let(:params) do
          {
            id: model_created_1.id,
            _json:
              [
                JSON.parse(expect_model.attributes.to_json)
              ]
          }
        end

        it 'update successful' do
          expect(response).to be_successful
          expect(model.count).to eq 2
          expect_json = JSON.parse(expect_model.attributes.to_json, symbolize_names: true)
          expect_json.delete(:user_id)
          expect_json.delete(:updated_date)
          expect_json.delete(:auth_key)
          expect_json.delete(:auth_token)
          expect_json.delete(:pass_income)
          expect_json.delete(:pass_smtp)

          real_json = json_response[:data].first[model_name.to_sym]
          real_json.delete(:updated_date)

          expect(real_json).to eq expect_json
        end
      end

      #TODO: This case was fields, because system was crashed
      # context 'when invalid with data invalid' do
        # let(:params) do
          # {
            # id: model_created_1.id,
            # _json:
              # [
                # { id: model_created_1.id, abc: "-100000" }
              # ]
          # }
        # end

        # it 'return empty array without errors' do
        # end
      # end

      context "when invalid with #{model} not exist" do
        let(:params) do
          {
            id: 100_000,
            _json:
              [
                JSON.parse(expect_model.attributes.to_json)
              ]
          }
        end
        let(:expect_model) { build(model_name.to_sym, id: 100_000) }

        it 'return empty data array and data_error' do
          expect(response).to be_successful
          expect(model.count).to eq 2
          expect(json_response[:data]).to eq []
          expect(json_response[:data_error].first[:error].to_i).to eq 10
          # expect(json_response[:data_error].first[:attributes][:id].to_i).to eq 100_000
        end
      end
    end
  end
end
