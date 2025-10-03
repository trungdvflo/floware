describe Api::ProjectsController, type: :controller do
  include_context 'initialize auth with app_token'

  let!(:time_now) { Time.zone.now.to_i }
  let!(:virtual_domain) { create(:virtual_domain) }
  let!(:user_1) { create(:user, domain_id: virtual_domain.id, username: 'user_1@123flo.com', email: 'user_1@123flo.com') }
  let!(:user_2) { create(:user, domain_id: virtual_domain.id, username: 'user_2@123flo.com', email: 'user_2@123flo.com') }

  describe '#index' do
    let(:make_request) { get :index, params: params }

    let(:project_1_day_ago) { create(:project, proj_name: 'project_1_day_ago', user_id: current_user.id, updated_date: 1.day.ago.to_i) }
    let(:project_2_day_ago) { create(:project, proj_name: 'project_2_day_ago', user_id: current_user.id, updated_date: 2.days.ago.to_i) }
    let(:project_1_day_from_now) { create(:project, proj_name: 'project_1_day_from_now', user_id: current_user.id, updated_date: 1.day.from_now.to_i) }
    let(:shared_collection_1) { create(:project, proj_name: 'shared_collection_1', proj_type: 3, user_id: user_1.id) }
    let(:shared_collection_2) { create(:project, proj_name: 'shared_collection_2', proj_type: 3, user_id: user_1.id) }

    before do
      create(:project, user_id: current_user.id, proj_name: 'private_project')
      # shared with current user
      create(:projects_user, user: current_user, project: shared_collection_1, status: ProjectsUser::STATUS_ACCEPTED)
      create(:projects_user, user: current_user, project: shared_collection_2, status: ProjectsUser::STATUS_PENDING)

      project_1_day_ago
      project_2_day_ago
      project_1_day_from_now

      make_request
    end

    context 'with no params' do
      let(:params) { {} }

      it 'get all collection include shared collection accepted' do
        expect(response).to be_successful
        expect(Project.count).to eq 6
        expect(ProjectsUser.count).to eq 2
        expect(json_response[:data].count).to eq 6
      end
    end

    context 'with modifiedLT params is valid' do
      let(:params) { { modifiedLT: time_now } }

      it 'response data with updated_date less than from now' do
        expect(response).to be_successful
        expect(Project.count).to eq 6
        expect(json_response[:data].count).to eq 2
        expect(json_response[:data][0][:project][:proj_name]).to eq 'project_1_day_ago'
        expect(json_response[:data][1][:project][:proj_name]).to eq 'project_2_day_ago'
      end
    end

    context 'with modifiedGTE params is valid' do
      let(:params) { { modifiedGTE: time_now } }

      it 'response data with updated_date greater than or equal from now' do
        expect(response).to be_successful
        expect(Project.count).to eq 6
        expect(json_response[:data].count).to eq 4
        expect(json_response[:data][0][:project][:proj_name]).to eq 'private_project'
        expect(json_response[:data][1][:project][:proj_name]).to eq 'shared_collection_1'
        expect(json_response[:data][1][:project][:join_status]).to eq 1
        expect(json_response[:data][2][:project][:proj_name]).to eq 'shared_collection_2'
        expect(json_response[:data][2][:project][:join_status]).to eq 0
        expect(json_response[:data][3][:project][:proj_name]).to eq 'project_1_day_from_now'
      end
    end

    context 'with ids params is valid' do
      let(:params) {{ ids: "#{project_1_day_ago.id},#{shared_collection_2.id}" }}

      it 'return 2 items' do
        expect(response).to be_successful
        expect(Project.count).to eq 6
        expect(json_response[:data].count).to eq 2
      end
    end

    context 'with fields params is valid' do
      let(:params) { { fields: 'id,updated_date,proj_name' } }

      it 'return 5 deleted item with fields selected' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 6
        expect(json_response[:data].first[:project][:id]).not_to be_nil
        expect(json_response[:data].first[:project][:proj_name]).not_to be_nil
        expect(json_response[:data].first[:project][:updated_date]).not_to be_nil
        expect(json_response[:data].first[:project][:created_date]).to be_nil
      end
    end

    context 'with mindID params is valid' do
      let(:params) { { minID: "#{project_2_day_ago.id}" } }

      it 'return 2 deleted item' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 1
        expect(json_response[:data].first[:project][:id]).to eq project_1_day_from_now.id
      end
    end
  end

  describe '#create' do
    let(:make_request) { post :create, params: params }

    context 'with no params' do
      let(:params) { {} }

      it 'throw error' do
        make_request
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'with params' do
      let(:params) { { projects: [{ proj_name: 'project_1', proj_type: Project::SHARED, calendar_id: '123' }, { proj_name: 'project_2', proj_type: Project::SHARED }] } }

      it 'return 2 projects' do
        make_request
        expect(response).to be_successful
        expect(json_response[:data].first[:project][:proj_name]).to eq 'project_1'
        expect(json_response[:data].first[:project][:calendar_id]).to eq '123'
        expect(json_response[:data].last[:project][:proj_name]).to eq 'project_2'
        expect(json_response[:data].count).to eq 2
      end
    end

    context 'with STANDARD acc and create more than 3 shared collection' do
      let!(:standard) { create(:subscription, subs_type: 0) }
      let!(:create_standard_acc) { create(:sub_purchase, subID: standard.id, user_id: current_user.id, is_current: 1) }
      let!(:shared_collection_1) { create(:project, proj_name: 'shared_collection_1', proj_type: 3, user_id: current_user.id) }
      let!(:shared_collection_2) { create(:project, proj_name: 'shared_collection_2', proj_type: 3, user_id: current_user.id) }
      let!(:shared_collection_3) { create(:project, proj_name: 'shared_collection_3', proj_type: 3, user_id: current_user.id) }
      let(:params) { { projects: [{ proj_name: 'project_1', proj_type: Project::SHARED }, { proj_name: 'project_2', proj_type: Project::SHARED }] } }

      it 'return error' do
        make_request
        expect(json_response[:data].count).to eq 0
        expect(json_response[:data_error].first[:error]).to eq 10
        expect(json_response[:data_error].last[:error]).to eq 10
      end
    end

    context 'with STANDARD acc and create less than 3 shared collection' do
      let!(:standard) { create(:subscription, subs_type: 0) }
      let!(:create_standard_acc) { create(:sub_purchase, subID: standard.id, user_id: current_user.id, is_current: 1) }
      let!(:shared_collection_1) { create(:project, proj_name: 'shared_collection_1', proj_type: 3, user_id: current_user.id) }
      let!(:shared_collection_2) { create(:project, proj_name: 'shared_collection_2', proj_type: 3, user_id: current_user.id) }
      let(:params) { { projects: [{ proj_name: 'project_1', proj_type: Project::SHARED }, { proj_name: 'project_2', proj_type: Project::SHARED }] } }

      it 'create successful one collection and fail one collection' do
        make_request
        expect(json_response[:data].count).to eq 1
        expect(json_response[:data_error].last[:error]).to eq 10
      end
    end

    context 'with PREMIUM acc and create more than 10 shared collection' do
      let!(:standard) { create(:subscription, subs_type: 1) }
      let!(:create_standard_acc) { create(:sub_purchase, subID: standard.id, user_id: current_user.id, is_current: 1) }
      let(:params) { { projects: [{ proj_name: 'project_1', proj_type: Project::SHARED }, { proj_name: 'project_2', proj_type: Project::SHARED }] } }

      before do
        10.times do |i|
          create(:project, proj_name: "shared_collection_#{i}", proj_type: 3, user_id: current_user.id)
        end
      end

      it 'return error' do
        make_request
        expect(Project.count).to eq 10
        expect(json_response[:data].count).to eq 0
        expect(json_response[:data_error].first[:error]).to eq 10
        expect(json_response[:data_error].last[:error]).to eq 10
      end
    end

    context 'with PREMIUM acc and create less than 10 shared collection' do
      let!(:standard) { create(:subscription, subs_type: 1) }
      let!(:create_standard_acc) { create(:sub_purchase, subID: standard.id, user_id: current_user.id, is_current: 1) }
      let(:params) { { projects: [{ proj_name: 'project_1', proj_type: Project::SHARED }, { proj_name: 'project_2', proj_type: Project::SHARED }] } }

      before do
        9.times do |i|
          create(:project, proj_name: "shared_collection_#{i}", proj_type: 3, user_id: current_user.id)
        end
      end

      it 'create successful one collection and fail one collection' do
        make_request
        expect(Project.count).to eq 10
        expect(json_response[:data].count).to eq 1
        expect(json_response[:data_error].last[:error]).to eq 10
      end
    end

    context 'with PRO acc and create more than 100 shared collection' do
      let!(:standard) { create(:subscription, subs_type: 2) }
      let!(:create_standard_acc) { create(:sub_purchase, subID: standard.id, user_id: current_user.id, is_current: 1) }
      let(:params) { { projects: [{ proj_name: 'project_1', proj_type: Project::SHARED }, { proj_name: 'project_2', proj_type: Project::SHARED }] } }

      before do
        100.times do |i|
          create(:project, proj_name: "shared_collection_#{i}", proj_type: 3, user_id: current_user.id)
        end
      end

      it 'create successful' do
        make_request
        expect(Project.count).to eq 102
        expect(json_response[:data].count).to eq 2
      end
    end
  end

  describe '#invite' do
    let(:make_request) { post :invite, params: params }
    let(:private_project) { create(:project, user_id: current_user.id, proj_name: 'private_project') }
    let(:shared_collection_1) { create(:project, proj_name: 'shared_collection_1', proj_type: 3, user_id: current_user.id) }
    let(:shared_collection_2) { create(:project, proj_name: 'shared_collection_2', proj_type: 3, user_id: current_user.id) }
    let(:shared_collection_3) { create(:project, proj_name: 'shared_collection_3', proj_type: 3, user_id: user_1.id) }

    before do
      private_project
      shared_collection_1
      shared_collection_2
      shared_collection_3

      make_request
    end

    context 'with no params' do
      let(:params) { {} }

      it 'return empty array' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'with ideal params' do
      let(:params) { { projects_users: [{ project_id: shared_collection_1.id,
                                          email: 'user_1@123flo.com',
                                          card_uid: 'ffcdc39e-57bc-44c7-ae76-256b220e9a13.vcf',
                                          href: 'user_1@123flo' },
                                        { project_id: shared_collection_2.id, email: 'user_1@123flo.com' }] } }

      it 'return projects and users added' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 2
        expect(json_response[:data][:projects_users].first[:email]).to eq 'user_1@123flo.com'
        expect(json_response[:data][:projects_users].first[:project_id]).to eq shared_collection_1.id
        expect(json_response[:data][:projects_users].first[:status]).to eq 0
        expect(json_response[:data][:projects_users].first[:permission]).to eq 0
      end
    end

    context 'invite self' do
      let(:params) { { projects_users: [{ project_id: shared_collection_1.id, email: 'test@123flo.com' }] } }

      it 'skip and return empty array' do
        expect(response).to be_successful
        expect(json_response[:data][:projects_users].count).to eq 0
        expect(json_response[:data][:projects_cards].count).to eq 0
      end
    end

    context 'with project not exist' do
      let(:params) { { projects_users: [{ project_id: 100_000, email: 'user_1@123flo.com' },
                                          project_id: shared_collection_1.id, email: 'user_1@123flo.com'] } }

      it 'throw error not authorized' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq NOT_AUTHORIZED
        expect(json_response[:description]).to include 'You are not authorized to perform this action.'
      end
    end

    context 'with user not exist' do
      let(:params) { { projects_users: [{ project_id: shared_collection_1.id,
                                          email: 'user_3@123flo.com',
                                          card_uid: 'ffcdc39e-57bc-44c7-ae76-256b220e9a13.vcf',
                                          href: 'user_3@123flo.com' },
                                          project_id: shared_collection_1.id,
                                          card_uid: 'eecdc39e-57bc-44c7-ae76-256b220e9a13.vcf',
                                          href: 'user_1@123flo.com',
                                          email: 'user_1@123flo.com'] } }

      it 'return data_error for params is invalid and data for params is valid' do
        expect(response).to be_successful
        expect(json_response[:data][:projects_users].count).to eq 1
        expect(json_response[:data][:projects_users].first[:project_id]).to eq shared_collection_1.id
        expect(json_response[:data_error][:projects_users_errors].first[:description]).to include "User can't be blank"
        expect(json_response[:data_error][:projects_users_errors].first[:error]).to eq API_ITEM_CANNOT_SAVE
      end
    end

    context 'with user already is a member of a project' do
      let(:params) { { projects_users: [{ project_id: shared_collection_1.id,
                                          card_uid: 'ffcdc39e-57bc-44c7-ae76-256b220e9a13.vcf',
                                          href: 'user_3@123flo.com',
                                          email: 'user_1@123flo.com' },
                                          project_id: shared_collection_1.id,
                                          card_uid: 'ffcdc39e-57bc-44c7-ae76-256b220e9a13.vcf',
                                          href: 'user_3@123flo.com',
                                          email: 'user_1@123flo.com' ] } }
      it 'return error' do
        expect(response).to be_successful
        expect(json_response[:data][:projects_users].count).to eq 1
        expect(json_response[:data][:projects_cards].count).to eq 1
        expect(json_response[:data_error][:projects_cards_errors].first[:error]).to eq API_ITEM_CANNOT_SAVE
      end
    end

    context 'with non-flo user' do
      let(:params) { { projects_users: [{ project_id: shared_collection_1.id,
                                          email: 'abc@gmail.com',
                                          card_uid: 'e0cdc39e-57bc-44c7-ae76-256b220e9a13.vcf',
                                          href: 'test@123flo.com' } ] } }

      it 'return without error' do
        expect(response).to be_successful
        expect(json_response[:data][:projects_users].count).to eq 0
        expect(json_response[:data][:projects_cards].count).to eq 1
      end
    end

    context 'with another project but not is owner' do
      let(:params) { { projects_users: [{ project_id: shared_collection_3.id, email: 'user_1@123flo.com' } ] } }

      it 'throw error not authoized' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq NOT_AUTHORIZED
        expect(json_response[:description]).to include 'You are not authorized to perform this action.'
      end
    end
  end

  describe '#accept_invite' do
    let(:make_request) { post :accept_invite, params: params }

    let(:shared_collection_1) { create(:project, proj_name: 'shared_collection_1', proj_type: 3, user_id: current_user.id) }
    let(:shared_collection_2) { create(:project, proj_name: 'shared_collection_2', proj_type: 3, user_id: current_user.id) }

    before do
      shared_collection_1
      shared_collection_2

      # shared with current user
      create(:projects_user, user: current_user, project: shared_collection_1)

      make_request
    end

    context 'with no params' do
      let(:params) { {} }

      it 'return empty array' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'with ideal params' do
      let(:params) { { projects: [{id: shared_collection_1.id}] } }

      it 'return list project_id accepted' do
        expect(response).to be_successful
        expect(json_response[:data].first[:project_user][:project_id]).to eq shared_collection_1.id
        expect(json_response[:data].first[:project_user][:status]).to eq 1
        expect(json_response[:data].first[:project_user][:permission]).to eq 0
      end
    end

    context 'accept but without receive invitation' do
      let(:params) { { projects: [{id: shared_collection_2.id}] } }

      it 'return error' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 0
        expect(json_response[:data_error].first[:error]).to eq API_ITEM_NOT_EXIST
        expect(json_response[:data_error].first[:description]).to eq MSG_ERR_NOT_EXIST
        expect(json_response[:data_error].first[:project][:id].to_i).to eq shared_collection_2.id
      end
    end
  end

  describe '#remove_members' do
    let(:make_request) { post :remove_members, params: params }

    let(:shared_collection_1) { create(:project, proj_name: 'shared_collection_1', proj_type: 3, user_id: current_user.id) }
    let(:shared_collection_2) { create(:project, proj_name: 'shared_collection_2', proj_type: 3, user_id: current_user.id) }
    let(:shared_collection_3) { create(:project, proj_name: 'shared_collection_3', proj_type: 3, user_id: user_1.id) }

    before do
      shared_collection_1
      shared_collection_2

      # shared with current user
      create(:projects_user, user: user_1, project: shared_collection_1)
      create(:projects_card, project: shared_collection_1, card_uid: 'uri-123')

      make_request
    end

    context 'no params' do
      let(:params) { {} }

      it 'return empty array' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'ideal params' do
      let(:params) { { projects_users: [{ project_id: shared_collection_1.id, email: 'user_1@123flo.com', card_uid: 'uri-123' }] } }

      it 'return empty array' do
        expect(response).to be_successful
        expect(json_response[:data][:projects_users].first[:email]).to eq 'user_1@123flo.com'
        expect(json_response[:data][:projects_users].first[:project_id]).to eq shared_collection_1.id

        expect(json_response[:data][:projects_cards].first[:card_uid]).to eq 'uri-123'
        expect(json_response[:data][:projects_cards].first[:project_id]).to eq shared_collection_1.id
      end
    end

    context 'remove members not already in project' do
      let(:params) { { projects_users: [{ project_id: shared_collection_2.id, user_id: user_2.id }] } }

      it 'throw error not exist' do
        expect(response).to be_successful
        expect(json_response[:data_error][:projects_cards_errors].first[:error]).to eq API_ITEM_NOT_EXIST
        expect(json_response[:data_error][:projects_cards_errors].first[:description]).to eq MSG_ERR_NOT_EXIST
        expect(json_response[:data_error][:projects_cards_errors].first[:project_card][:project_id].to_i).to eq shared_collection_2.id
      end
    end

    context 'remove members without owner permission' do
      let(:params) { { projects_users: [{ project_id: shared_collection_3.id, user_id: user_2.id }] } }

      it 'throw error not authorized' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq NOT_AUTHORIZED
        expect(json_response[:description]).to include 'You are not authorized to perform this action.'
      end
    end
  end

  describe '#destroy' do
    let(:make_request) { get :destroy, params: params }

    let!(:private_project) { create(:project, proj_name: 'project_1_day_ago', user_id: current_user.id, updated_date: 1.day.ago.to_i) }
    let!(:shared_collection_1) { create(:project, proj_name: 'shared_collection_1', proj_type: 3, user_id: current_user.id) }
    let!(:shared_collection_2) { create(:project, proj_name: 'shared_collection_2', proj_type: 3, user_id: user_1.id) }

    before do
      # shared with current user
      create(:projects_user, user: user_1, project: shared_collection_1, status: ProjectsUser::STATUS_ACCEPTED)
      create(:projects_user, user: user_2, project: shared_collection_1, status: ProjectsUser::STATUS_PENDING)

      make_request
    end

    context 'no params' do
      let(:params) { {} }

      it 'return empty array' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'ideal params' do
      let(:params) { { projects: [{ id: shared_collection_1.id }, { id: private_project.id }] } }

      it 'return id deleted' do
        expect(response).to be_successful
        expect(json_response[:data].first[:id]).to eq shared_collection_1.id
        expect(json_response[:data].last[:id]).to eq private_project.id
      end
    end

    context 'have not permission' do
      let(:params) { { projects: [{ id: shared_collection_2.id }] } }
      
      it 'throw error not authorized' do
        expect(response).to be_successful
        expect(json_response[:data_error].first[:error]).to eq API_ITEM_NOT_EXIST
        expect(json_response[:data_error].first[:description]).to eq MSG_ERR_NOT_EXIST
      end
    end

    context 'not exist' do
      let(:params) { { projects: [{ id: 100_000 }] } }

      it 'throw error not exist' do
        expect(response).to be_successful
        expect(json_response[:data_error].first[:error]).to eq API_ITEM_NOT_EXIST
        expect(json_response[:data_error].first[:description]).to eq MSG_ERR_NOT_EXIST
      end
    end
  end

  describe '#members' do
    let(:make_request) { get :members, params: params }
    let!(:private_project) { create(:project, proj_name: 'project_1_day_ago', user_id: current_user.id, updated_date: 1.day.ago.to_i) }
    let!(:shared_collection_1) { create(:project, proj_name: 'shared_collection_1', proj_type: 3, user_id: current_user.id) }
    let!(:shared_collection_2) { create(:project, proj_name: 'shared_collection_2', proj_type: 3, user_id: user_1.id) }
    let!(:project_user_1) { create(:projects_user, user: user_1, project: shared_collection_1, status: ProjectsUser::STATUS_ACCEPTED) }
    let!(:project_user_2) { create(:projects_user, user: current_user, project: shared_collection_2, status: ProjectsUser::STATUS_ACCEPTED) }
    let!(:project_card) { create(:projects_card, set_account_id: 1, project: shared_collection_2) }

    before do
      make_request
    end

    context 'no params' do
      let(:params) { {} }

      it 'return empty array' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'with private project' do
      let(:params) { { project_ids: [private_project.id] } }

      it 'return empty array' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 0
      end
    end

    context 'when you are owner' do
      let(:params) { { project_ids: [shared_collection_1.id] } }

      it 'return empty array' do
        expect(response).to be_successful
        expect(json_response[:data].first[:members][:project_id]).to eq shared_collection_1.id
        expect(json_response[:data].first[:members][:users].first[:email]).to eq user_1.email
      end
    end

    context 'when you are member' do
      let(:params) { { project_ids: [shared_collection_2.id] } }

      it 'return flo member' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 0
      end
    end

    context 'with non-flo members' do
      let(:params) { { project_ids: [shared_collection_2.id] } }

      it 'return non-flo members' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 0
      end
    end
  end

  describe '#update_personal_setting' do
    let(:make_request) { get :update_personal_setting, params: params }
    let!(:shared_collection_1) { create(:project, proj_name: 'shared_collection_1', proj_type: 3, user_id: current_user.id) }
    let!(:shared_collection_2) { create(:project, proj_name: 'shared_collection_2', proj_type: 3, user_id: user_1.id) }

    let!(:project_user_1) { create(:projects_user, user: user_1, project: shared_collection_1, status: ProjectsUser::STATUS_ACCEPTED) }
    let!(:project_user_2) { create(:projects_user, user: current_user, project: shared_collection_2, status: ProjectsUser::STATUS_ACCEPTED) }

    before do
      make_request
    end

    context 'no params' do
      let(:params) { {} }

      it 'return empty array' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'when user is a owner' do
      let(:params) { { projects_users: [{ id: project_user_1.id, project_id: shared_collection_1.id, is_hide: 1 }] } }

      it 'throw not authorized' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq NOT_AUTHORIZED
        expect(json_response[:description]).to include 'You are not authorized to perform this action.'
      end
    end

    context 'when user is a member' do
      let(:params) { { projects_users: [{ id: project_user_2.id, project_id: shared_collection_2.id, is_hide: 1 }] } }

      it 'update successful' do
        expect(response).to be_successful
        expect(json_response[:data].first[:project_user][:project_id]).to eq shared_collection_2.id
        expect(json_response[:data].first[:project_user][:is_hide]).to eq 1
      end
    end
  end

  describe '#update' do
    let(:make_request) { get :update, params: params }
    let!(:shared_collection_1) { create(:project, proj_name: 'shared_collection_1', proj_type: 3, user_id: current_user.id) }
    let!(:shared_collection_2) { create(:project, proj_name: 'shared_collection_2', proj_type: 3, user_id: user_1.id) }
    let!(:shared_collection_3) { create(:project, proj_name: 'shared_collection_3', proj_type: 3, user_id: user_1.id) }
    let!(:private_collection_1) { create(:project, proj_name: 'private_collection_1', user_id: current_user.id) }

    let!(:project_user_1) { create(:projects_user, user: user_1, project: shared_collection_1, status: ProjectsUser::STATUS_ACCEPTED) }
    let!(:project_user_2) { create(:projects_user, user: current_user, project: shared_collection_2, status: ProjectsUser::STATUS_ACCEPTED) }

    before do
      make_request
    end

    context 'no params' do
      let(:params) { {} }

      it 'return empty array' do
        expect(response).to be_success
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'when you are owner' do
      let(:params) { { projects: [ { id: shared_collection_1.id, proj_name: 'shared_collection_1_updated', proj_color: 'xxx' } ] } }

      it 'update successful' do
        expect(response).to be_successful
        expect(json_response[:data].first[:project][:id]).to eq shared_collection_1.id
        expect(json_response[:data].first[:project][:proj_name]).to eq 'shared_collection_1_updated'
        expect(json_response[:data].first[:project][:proj_color]).to eq 'xxx'
      end
    end

    context 'when you are member' do
      let(:params) { { projects: [ { id: shared_collection_2.id, proj_name: 'shared_collection_2_updated', proj_color: 'xxx' } ] } }

      it 'update all params except project name' do
        expect(response).to be_successful
        expect(json_response[:data].first[:project][:id]).to eq shared_collection_2.id
        expect(json_response[:data].first[:project][:proj_name]).to eq 'shared_collection_2'
        expect(json_response[:data].first[:project][:proj_color]).to eq 'xxx'
      end
    end

    context 'when you are not join to project' do
      let(:params) { { projects: [ { id: shared_collection_3.id, proj_name: 'shared_collection_2_updated', proj_color: 'xxx' } ] } }

      it 'throw error not authorized' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq NOT_AUTHORIZED
        expect(json_response[:description]).to include 'You are not authorized to perform this action.'
      end
    end

    context 'private collection can be update parent_id' do
      let(:params) { { projects: [ { id: private_collection_1.id, proj_name: 'private_collection_1_updated', parent_id: 1 } ] } }

      it 'update successful' do
        expect(response).to be_successful
        expect(json_response[:data].first[:project][:id]).to eq private_collection_1.id
        expect(json_response[:data].first[:project][:proj_name]).to eq 'private_collection_1_updated'
        expect(json_response[:data].first[:project][:parent_id]).to eq 1
      end
    end
  end
end
