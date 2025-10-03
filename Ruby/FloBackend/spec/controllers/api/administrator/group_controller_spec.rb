describe Api::Administrator::GroupsController, type: :controller do
  include_context 'initialize auth with app_token'

  let!(:virtual_domain) { create(:virtual_domain) }
  let!(:admin) { create(:admin, email: 'test@flomail.net') }

  describe '#index' do
    let(:make_request) { get :index, params: params }

    before do
      3.times { create(:group) }

      make_request
    end

    context 'when valid with no params' do
      let(:params) {{  }}

      it 'return list groups successful' do
        expect(json_response.count).to eq 4
        expect(json_response[:total]).to eq 3
        expect(json_response[:data].count).to eq 4
      end
    end

    context 'when valid with paginator params' do
      let(:params) { { per_page: 1, page: 2  } }

      it 'return a record on page 1' do
        expect(json_response.count).to eq 4
        expect(json_response[:total]).to eq 3
        expect(json_response[:data].count).to eq 1
      end
    end
  end

  describe '#create' do
    let(:make_request) { post :create, params: params }

    before do
      create(:group, name: 'beta_1')

      make_request
    end

    context 'when valid' do
      let(:params) { { name: 'beta_2'  } }

      it 'create successful' do
        expect(json_response[:data][:group][:name]).to include 'beta_2'
        expect(Group.count).to eq 2
      end
    end

    context 'when invalid' do
      let(:params) { { name: 'beta_1'  } }

      it 'create failed' do
        expect(json_response[:description][:name]).to include 'has already been taken'
      end
    end
  end

  describe '#update' do
    let(:make_request) { put :update, params: params }
    let(:group_beta_1) { create(:group, name: 'beta_1') }
    let(:group_beta_2) { create(:group, name: 'beta_2') }

    before do
      group_beta_1
      group_beta_2

      make_request
    end

    context 'when valid' do
      let(:params) {{ id: group_beta_1.id, name: 'beta_3' }}

      it 'update successful' do
        expect(json_response[:data][:group][:id]).to eq group_beta_1.id
        expect(json_response[:data][:group][:name]).to eq 'beta_3'
      end
    end

    context 'when invalid' do
      let(:params) {{ id: group_beta_1.id, name: 'beta_2' }}

      it 'update failed' do
        expect(json_response[:description][:name]).to include 'has already been taken'
      end
    end
  end

  describe '#destroy' do
    let(:make_request) { delete :destroy, params: params }
    let(:group_beta_1) { create(:group, name: 'beta_1') }
    let(:group_beta_2) { create(:group, name: 'beta_2') }

    before do
      group_beta_1
      group_beta_2

      make_request
    end

    context 'when valid' do
      let(:params) {{ id: group_beta_1.id }}

      it 'delete successful' do
        expect(json_response[:data][:group][:id]).to eq group_beta_1.id
      end
    end

    context 'when invalid' do
      let(:params) {{ id: 100_000 }}

      it 'delete failed' do
        expect(json_response[:description]).to include "Couldn't find Group with 'id'=100000"
      end
    end
  end

  describe '#add_users' do
    let(:make_request) { post :add_users, params: params }
    let!(:user_1) do
      create(:user, email: 'test01@flomail.net',
                    username: 'test01@flomail.net',
                    fullname: 'test01',
                    secondary_email: 'test02@flomail.net',
                    token: 'test01 token',
                    domain_id: virtual_domain.id)
    end
    let!(:user_2) do
      create(:user, email: 'test02@flomail.net',
                    username: 'test02@flomail.net',
                    fullname: 'test02',
                    secondary_email: 'test03@flomail.net',
                    token: 'test02 token',
                    domain_id: virtual_domain.id)
    end

    let(:group_dev) { create(:group, name: 'dev') }
    let(:group_beta) { create(:group, name: 'beta') }

    before do
      group_dev
      make_request
    end

    context 'when valid' do
      let(:params) {{ user_emails: "#{user_1.email},#{user_2.email}", group_ids: "#{group_dev.id}" }}

      it 'add users to groups successful' do
        expect(json_response[:data][:message]).to include 'Add successfully'
        expect(GroupsUser.count).to eq 2
      end
    end

    context 'when invalid' do
      let(:params) {{ user_emails: 'abc@xxx.com', group_ids: '100000' }}

      it 'add users to groups failed' do
        expect(json_response[:data][:message]).to include 'Add failed'
        expect(json_response[:data][:errors]).to include 'Error while adding users'
      end
    end
  end

  describe '#remove_users' do
    let(:make_request) { post :remove_users, params: params }
    let!(:user_1) do
      create(:user, email: 'test01@flomail.net',
                    username: 'test01@flomail.net',
                    fullname: 'test01',
                    secondary_email: 'test02@flomail.net',
                    token: 'test01 token',
                    domain_id: virtual_domain.id)
    end
    let!(:user_2) do
      create(:user, email: 'test02@flomail.net',
                    username: 'test02@flomail.net',
                    fullname: 'test02',
                    secondary_email: 'test03@flomail.net',
                    token: 'test02 token',
                    domain_id: virtual_domain.id)
    end

    let!(:group_dev) { create(:group, name: 'dev') }
    let!(:group_beta) { create(:group, name: 'beta') }

    let!(:group_user_beta_1) { create(:groups_user, group: group_beta, user_id: user_1.id) }
    let!(:group_user_beta_2) { create(:groups_user, user_id: user_2.id, group: group_beta) }

    before do
      make_request
    end

    context 'when valid' do
      let(:params) {{ id: "#{group_beta.id}", user_emails: "#{user_1.email}, #{user_2.email}" }}

      it 'remove successfully' do
        expect(json_response[:data][:message]).to include 'Remove successfully'
        expect(GroupsUser.count).to eq 0
      end
    end

    context 'when invalid' do
      let(:params) {{ id: "100000", user_emails: "#{user_1.email}, #{user_2.email}" }}

      it 'remove successfully' do
        expect(json_response[:description]).to include "Couldn't find Group with"
        expect(GroupsUser.count).to eq 2
      end
    end
  end
end
