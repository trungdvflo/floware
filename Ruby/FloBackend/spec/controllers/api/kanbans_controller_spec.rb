describe Api::KanbansController, type: :controller do
  include_context 'initialize auth with app_token'

  let!(:time_now) { Time.zone.now.to_i }
  let!(:virtual_domain) { create(:virtual_domain) }
  let!(:user_1) { create(:user, domain_id: virtual_domain.id, username: 'user_1@123flo.com', email: 'user_1@123flo.com') }
  let!(:user_2) { create(:user, domain_id: virtual_domain.id, username: 'user_2@123flo.com', email: 'user_2@123flo.com') }
  let!(:private_project_1) { create(:project, proj_name: 'private_project_1', user_id: current_user.id, updated_date: 1.day.from_now.to_i) }
  let!(:shared_collection_1) { create(:project, proj_name: 'shared_collection_1', proj_type: 3, user_id: user_1.id) }
  let!(:shared) { create(:projects_user, user: current_user, project: shared_collection_1,
                                         status: ProjectsUser::STATUS_ACCEPTED,
                                         permission: ProjectsUser::PERMISION_READ_WRITE) }

  describe '#index' do
    let(:make_request) { get :index, params: params }
    let(:kanban_1_day_ago) { create(:kanban, name: 'kanban_1_day_ago', project_id: shared_collection_1.id, user_id: user_1.id, updated_date: 1.day.ago.to_i) }
    let(:kanban_2_day_ago) { create(:kanban, name: 'kanban_2_day_ago', project_id: shared_collection_1.id, user_id: user_1.id, updated_date: 2.days.ago.to_i) }
    let(:kanban_1_day_from_now) { create(:kanban, name: 'kanban_1_day_from_now', project_id: shared_collection_1.id, user_id: user_1.id, updated_date: 1.day.from_now.to_i) }

    before do
      kanban_1_day_ago
      kanban_2_day_ago
      kanban_1_day_from_now

      make_request
    end

    context 'with no params' do
      let(:params) { {} }

      it 'throw error' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'idea params' do
      let(:params) {{ project_ids: [shared_collection_1.id] }}

      it 'return 3 items' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 3
      end
    end
  end

  describe '#create' do
    let(:make_request) { post :create, params: params }

    before do
      make_request
    end

    context 'no params' do
      let(:params) {{}}

      it 'throw error' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'idea params' do
      let(:params) {{ kanbans: [{name: 'kanban_1', project_id: shared_collection_1.id }] }}

      it 'return kanban_1' do
        expect(response).to be_successful
        expect(json_response[:data].first[:kanban][:name]).to eq 'kanban_1'
        expect(json_response[:data].first[:kanban][:project_id]).to eq shared_collection_1.id
      end
    end
  end

  describe '#update' do
    let(:make_request) { put :update, params: params }
    let(:kanban_1) { create(:kanban, name: 'kanban_1', project_id: shared_collection_1.id, user_id: user_1.id, updated_date: 1.day.ago.to_i) }

    before do
      make_request
    end

    context 'no params' do
      let(:params) {{}}

      it 'throw error' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'idea params' do
      let(:params) {{ kanbans: [{ id: kanban_1.id, project_id: shared_collection_1.id, name: 'kanban_updated' }] }}

      it 'return kanban updated' do
        expect(response).to be_successful
        expect(json_response[:data].first[:kanban][:name]).to eq 'kanban_updated'
        expect(json_response[:data].first[:kanban][:project_id]).to eq shared_collection_1.id
      end
    end
  end

  describe '#destroy' do
    let(:make_request) { delete :destroy, params: params }
    let(:kanban_1) { create(:kanban, name: 'kanban_1', project_id: shared_collection_1.id, user_id: user_1.id, updated_date: 1.day.ago.to_i) }

    before do
      make_request
    end

    context 'no params' do
      let(:params) {{}}

      it 'throw error' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'idea params' do
      let(:params) {{ kanbans: [{ id: kanban_1.id, project_id: shared_collection_1.id }] }}

      it 'return kanban id deleted' do
        expect(response).to be_successful
        expect(json_response[:data].first[:id]).to eq kanban_1.id
      end
    end
  end

  describe '#archived' do
    let(:make_request) { get :archived, params: params }
    let!(:kanban_1) { create(:kanban, name: 'kanban_1', project_id: shared_collection_1.id, user_id: user_1.id, archive_status: 1) }
    let!(:kanban_2) { create(:kanban, name: 'kanban_1', project_id: shared_collection_1.id, user_id: user_1.id, archive_status: 0) }

    before do
      make_request
    end

    context 'no params' do
      let(:params) {{}}

      it 'throw error' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'idea params' do
      let(:params) {{ project_ids: [shared_collection_1.id] }}

      it 'return archived kanbans' do
        expect(response).to be_successful
        expect(json_response[:data].first[:kanban][:name]).to eq 'kanban_1'
      end
    end
  end
end
