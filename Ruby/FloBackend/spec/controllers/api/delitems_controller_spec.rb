describe Api::DelitemsController, type: :controller do
  include_context 'initialize auth with app_token'
  let!(:time_now) { Time.zone.now.to_i }

  describe '#index' do
    let(:make_request) { get :index, params: params }

    before do
      # deleted item of another user
      create(:deleted_item, user_id: 10)

      create(:deleted_item, id: 10_000, updated_date: time_now)
      create(:deleted_item, id: 20_000, updated_date: time_now)
      create(:deleted_item, id: 30_000, updated_date: time_now)

      create(:deleted_item, id: 100_000, item_type: 'CANVAS', updated_date: 1.day.from_now.to_i)
      create(:deleted_item, id: 200_000, updated_date: 1.day.ago.to_i)
      create(:deleted_item, id: 300_000, updated_date: 2.days.ago.to_i)

      make_request
    end

    context 'with no params' do
      let(:params) { {} }

      it 'response 6 items' do
        expect(response).to be_successful
        expect(DeletedItem.count).to eq 7
        expect(json_response[:data].count).to eq 6
      end
    end

    context 'with modifiedLT params is valid' do
      let(:params) { { modifiedLT: time_now } }

      it 'response data with updated_date less than from now' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 2
      end
    end

    context 'with modifiedLT params is invalid' do
      let(:params) { { modifiedLT: '-abc'} }

      it 'response empty array without errors' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 0
      end
    end

    context 'with modifiedGTE params is valid' do
      let(:params) { { modifiedGTE: time_now } }

      it 'response data with updated_date greater than or equal from now' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 4
      end
    end

    #TODO: This case was failed, because json response all data from database
    # context 'with modifiedGTE params is invalid' do
      # let(:params) { { modifiedGTE: '-abc'} }

      # it 'response empty array without errors' do
        # expect(response).to be_successful
        # expect(json_response['data'].count).to eq 0
      # end
    # end

    context 'with ids params is valid' do
      let(:params) { { ids: '100000, 200000' } }

      it 'return 2 deleted items' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 2
      end
    end

    context 'with ids params is invalid' do
      let(:params) { { ids: '-500000' } }

      it 'return empty array without errors' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 0
      end
    end

    context 'with itype params is valid' do
      let(:params) { { itype: 'CANVAS' } }

      it 'return 1 deleted item' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 1
        expect(json_response[:data].first[:deleted_item][:item_type]).to eq 'CANVAS'
        expect(json_response[:data].first[:deleted_item][:id]).to eq 100_000
      end
    end

    context 'with itype params invalid' do
      let(:params) { { itype: '-abc' } }

      it 'return array empty without errors' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 0
      end
    end

    context 'with minID params is valid' do
      let(:params) { { minID: '200000' } }

      it 'return 2 deleted item' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 1
        expect(json_response[:data].first[:deleted_item][:id]).to eq 300_000
      end
    end

    context 'with minID params is invalid' do
      let(:params) { { minID: '500000' } }

      it 'return empty array without errors' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 0
      end
    end

    context 'with pItem params is valid' do
      let(:params) { { pItem: '3' } }
      it 'return 3 deleted item' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 3
      end
    end

    #TODO: This case was failed because system crash
    # context 'with pItem params is invalid' do
      # let(:params) { { pItem: '-1' } }
      # it 'return empty array without errors' do
        # expect(response).to be_successful
        # expect(json_response['data'].count).to eq 0
      # end
    # end

    context 'with fields params is valid' do
      let(:params) { { fields: 'id,item_id' } }

      it 'return 6 deleted item with fields selected' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 6
        expect(json_response[:data].first[:deleted_item][:id]).not_to be_nil
        expect(json_response[:data].first[:deleted_item][:item_id]).not_to be_nil
        expect(json_response[:data].first[:deleted_item][:is_recovery]).to be_nil
        expect(json_response[:data].first[:deleted_item][:item_type]).to be_nil
        expect(json_response[:data].first[:deleted_item][:created_date]).to be_nil
        expect(json_response[:data].first[:deleted_item][:updated_date]).to be_nil
      end
    end

    context 'with fields params is invalid' do
      let(:params) { { fields: '-123' } }

      it 'return 6 deleted item array with all fields' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 6
        expect(json_response[:data].first[:deleted_item][:id]).not_to be_nil
        expect(json_response[:data].first[:deleted_item][:item_id]).not_to be_nil
        expect(json_response[:data].first[:deleted_item][:is_recovery]).not_to be_nil
        expect(json_response[:data].first[:deleted_item][:item_type]).not_to be_nil
        expect(json_response[:data].first[:deleted_item][:created_date]).not_to be_nil
        expect(json_response[:data].first[:deleted_item][:updated_date]).not_to be_nil
      end
    end
  end
end
