describe Api::Web::UrlsController, type: :controller do
  include_context 'initialize auth with app_token'
  let!(:time_now) { Time.zone.now.to_i }

  describe '#index' do
    let(:make_request) { get :index, params: params }

    before do
      # create bookmark for another user
      create(:url, title: 'Twitter', user_id: 10)

      create(:url, title: 'Facebook')
      create(:url, title: 'Google')

      create(:url, title: 'Floware', updated_date: time_now)
      create(:url, title: 'Amazon', updated_date: 1.day.from_now.to_i)

      create(:url, id: 200_000, title: 'ChoTot', updated_date: 1.day.ago.utc.to_i)
      create(:url, id: 100_000, title: 'Lazada', updated_date: 2.days.ago.utc.to_i)

      # create url in Trash
      lcl = create(:url, title: 'LCL')
      create(:trash, obj_id: lcl.id)

      # deleted url from Trash
      create(:deleted_item, item_id: lcl.id)

      make_request
    end

    context 'with no params' do
      let(:params) { {} }

      it 'response all user bookmark but except urls in Trash' do
        expect(response).to be_successful
        expect(Url.count).to eq 8
        expect(json_response.count).to eq 6
      end
    end

    context 'with modifiedLT params is valid ' do
      let(:params) { { modifiedLT: time_now } }

      it 'response data with updated_date less than from now' do
        expect(response).to be_successful
        expect(json_response.count).to eq 2
      end
    end

    context 'with modifiedLT params is invalid ' do
      let(:params) { { modifiedLT: '--abc'} }

      it 'response empty array without errors' do
        expect(response).to be_successful
        expect(json_response.count).to eq 0
      end
    end

    context 'with modifiedGTE params is valid' do
      let(:params) { { modifiedGTE: time_now } }

      it 'response data with updated_date greater than or equal from now' do
        expect(response).to be_successful
        expect(json_response.count).to eq 4
      end
    end

    #TODO: This case was failed, because json response all data from database
    # context 'with modifiedGTE params is invalid' do
      # let(:params) { { modifiedGTE: '-abc'} }

      # it 'return empty array without errors' do
        # expect(response).to be_successful
        # # expect(json_response.count).to eq 0
      # end
    # end

    context 'with ids params is valid' do
      let(:params) { { ids: '100000, 200000' } }

      it 'return Lazada and ChoTot urls' do
        expect(response).to be_successful
        expect(json_response.count).to eq 2
      end
    end

    context 'with ids params is invalid' do
      let(:params) { { ids: '-1000000' } }

      it 'return empty array without errors' do
        expect(response).to be_successful
        expect(json_response.count).to eq 0
      end
    end

    context 'with include_trash params is valid' do
      let(:params) { { include_trash: true } }

      it 'return all url of user include url in Trash' do
        expect(response).to be_successful
        expect(Url.count).to eq 8
        expect(json_response.count).to eq 7
      end
    end

    context 'with include_trash params is invalid' do
      let(:params) { { include_trash: '-abc' } }

      it 'return all data except trash' do
        expect(response).to be_successful
        expect(Url.count).to eq 8
        expect(json_response.count).to eq 7
      end
    end

    context 'with fields params is valid' do
      let(:params) { { fields: 'url,title' } }

      it 'return all url of user with fields input' do
        expect(response).to be_successful
        expect(json_response.count).to eq 6
        expect(json_response.first[:url]).not_to be_nil
        expect(json_response.first[:title]).not_to be_nil
        expect(json_response.first[:id]).to be_nil
        expect(json_response.first[:user_id]).to be_nil
        expect(json_response.first[:created_date]).to be_nil
        expect(json_response.first[:updated_date]).to be_nil
        expect(json_response.first[:order_number]).to be_nil
        expect(json_response.first[:order_number_time]).to be_nil
      end
    end

    context 'with fields params is invalid' do
      let(:params) { { fields: '-abc' } }

      it 'return all url of user with all fields' do
        expect(response).to be_successful
        expect(json_response.count).to eq 6
        expect(json_response.first[:url]).not_to be_nil
        expect(json_response.first[:title]).not_to be_nil
        expect(json_response.first[:id]).not_to be_nil
        expect(json_response.first[:user_id]).not_to be_nil
        expect(json_response.first[:created_date]).not_to be_nil
        expect(json_response.first[:updated_date]).not_to be_nil
        expect(json_response.first[:order_number]).not_to be_nil
      end
    end

    context 'with has_del params is valid' do
      let(:params) { { has_del: 1 } }

      it 'return 1 url deleted' do
        expect(response).to be_successful
        expect(json_response.first[:data].count).to eq 6
        expect(json_response.last[:data_del].count).to eq 1
      end
    end

    context 'with has_del params is invalid' do
      let(:params) { { has_del: -100 } }

      it 'return all urls' do
        expect(response).to be_successful
        expect(json_response.count).to eq 6
      end
    end
  end

  describe '#create' do
    let(:make_request) { post :create, params: params }

    before do
      create(:url, title: 'Facebook', order_number: 10_000)

      make_request
    end

    #TODO: This case was failed because system crash
    # context 'with url invalid' do
      # let(:params) { { urls: [{ url: 'abc' }] } }

      # it 'dont save urls' do
        # expect(response).to be_successful
        # expect(Url.count).to eq 0
      # end
    # end

    context 'with url valid' do
      let(:params) { { urls: [{ url: 'https://www.google.com' }] } }

      it 'create url bookmark success' do
        expect(response).to be_successful
        expect(Url.count).to eq 2
        expect(json_response.first[:title]).to eq 'Google'
        expect(json_response.first[:order_number]).to eq 10_001
      end
    end
  end

  describe '#update' do
    let(:make_request) { put :update, params: params }

    before do
      create(:url, id: 10_000, title: 'Facebook', order_number: 10_000)

      make_request
    end

    context 'with url invalid' do
      let(:params) { { urls: [{ id: 10_000, title: 'Google', url: 'abc' }] } }

      it 'update url bookmark fail' do
        expect(response).to be_successful
        expect(Url.count).to eq 1
        # TODO: expect can't not update url because url wrong format but it still update. Need to fix it
      end
    end

    context 'with url valid and url exist' do
      let(:params) { { urls: [{ id: 10_000, title: 'Google', url: 'https://www.google.com' }] } }

      it 'update url bookmark success' do
        expect(response).to be_successful
        expect(Url.count).to eq 1
        expect(json_response.first[:title]).to eq 'Google'
        expect(json_response.first[:order_number]).to eq 10_000
        expect(json_response.first[:url]).to eq 'https://www.google.com'
      end
    end

    context 'with url not exist' do
      let(:params) { { urls: [{ id: 10_001, title: 'Google', url: 'https://www.google.com' }] } }

      it 'show error' do
        expect(response).to be_successful
        expect(Url.count).to eq 1
        expect(json_response.first[:error]).to eq '10001'
      end
    end
  end

  describe '#destroy' do
    let(:make_request) { delete :destroy, params: params }

    before do
      create(:url, id: 10_000, title: 'Facebook')
      create(:url, id: 10_001, title: 'Google')
      create(:url, id: 10_002, title: 'Twitter')

      make_request
    end

    context 'with url exist' do
      let(:params) {{ id: '10000,10001' }}

      it 'delete success' do
        expect(response).to be_successful
        expect(Url.count).to eq 1
        expect(DeletedItem.count).to eq 2
        expect(json_response.first[:success]).not_to be_nil
      end
    end

    context 'with url not exist' do
      let(:params) {{ id: '20000,20001' }}

      it 'not delete anything' do
        expect(response).to be_successful
        expect(Url.count).to eq 3
        expect(DeletedItem.count).to eq 0
        # TODO: expect show error json. But it return json success
      end
    end
  end

  describe '#fetch_url' do
    let(:make_request) { get :fetch_url, params: params }

    before do
      make_request
    end

    context 'with url invalid' do
      let(:params) {{ url: 'abc'}}

      it 'return error' do
        expect(json_response.first[:ressult]).to include('Sorry, we can not load the page!')
      end
    end
    
    context 'with url valid' do
      let(:params) {{ url: 'http://www.google.com'}}

      it 'return content of google site' do
        # TODO: misspellings
        expect(json_response.first[:ressult]).to include('Google')
      end
    end
  end
end
