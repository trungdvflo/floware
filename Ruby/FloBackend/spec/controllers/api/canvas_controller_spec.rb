describe Api::CanvasController, type: :controller do
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
  let(:kanban) { create(:kanban, name: 'TODOLIST', project_id: shared_collection_1.id, user_id: user_1.id, updated_date: 2.days.ago.to_i) }

  describe '#index' do
    let(:make_request) { get :index, params: params }
    let(:canvas_1_day_ago) { create(:canvas, kanban_id: kanban.id, user_id: user_1.id, updated_date: 1.day.ago.to_i) }
    let(:canvas_2_day_ago) { create(:canvas, kanban_id: kanban.id, user_id: user_1.id, updated_date: 2.days.ago.to_i) }
    let(:canvas_1_day_from_now) { create(:canvas, kanban_id: kanban.id, user_id: user_1.id, updated_date: 1.day.from_now.to_i) } 

    before do
      canvas_1_day_ago
      canvas_2_day_ago
      canvas_1_day_from_now

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
      let(:params) {{ kanban_ids: [kanban.id] }}

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
      let(:params) {{ canvas: [{ item_type: 'VTODO',
                                 item_id: 'dc434fd8-7208-44ed-ae28-dc85ea6020f9',
                                 kanban_id: kanban.id }] }}

      it 'return canvas_1' do
        expect(response).to be_successful
        expect(json_response[:data].first[:canvas][:item_id]).to eq 'dc434fd8-7208-44ed-ae28-dc85ea6020f9'
      end
    end
  end

  describe '#update' do
    let(:make_request) { put :update, params: params }
    let(:canvas_1) { create(:canvas, kanban_id: kanban.id, user_id: user_1.id, updated_date: 1.day.ago.to_i) }

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
      let(:params) {{ canvas: [{ id: canvas_1.id, kanban_id: kanban.id, item_id: 'dc434fd8-7208-44ed-ae28-dc85ea6020f9' }] }}

      it 'return canvas updated' do
        expect(response).to be_successful
        expect(json_response[:data].first[:canvas][:item_id]).to eq 'dc434fd8-7208-44ed-ae28-dc85ea6020f9' 
      end
    end
  end

  describe '#destroy' do
    let(:make_request) { delete :destroy, params: params }
    let(:canvas_1) { create(:canvas, kanban_id: kanban.id, user_id: user_1.id, updated_date: 1.day.ago.to_i) }

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
      let(:params) {{ canvas: [{ id: canvas_1.id, kanban_id: kanban.id }] }}

      it 'return canvas id deleted' do
        expect(response).to be_successful
        expect(json_response[:data].first[:id]).to eq canvas_1.id
      end
    end
  end
end
