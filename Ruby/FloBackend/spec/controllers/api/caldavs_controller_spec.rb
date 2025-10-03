describe Api::CaldavsController, type: :controller do
  include_context 'initialize auth with app_token'
  let!(:time_now) { Time.zone.now.to_i }
  let!(:virtual_domain) { create(:virtual_domain) }
  let!(:user_1) { create(:user, domain_id: virtual_domain.id, username: 'user_1@123flo.com', email: 'user_1@123flo.com') }
  let!(:user_2) { create(:user, domain_id: virtual_domain.id, username: 'user_2@123flo.com', email: 'user_2@123flo.com') }
  let!(:calendar) { create(:calendar, principaluri: API_PRINCIPAL + user_1.email) }
  let!(:private_project_1) { create(:project, proj_name: 'private_project_1', user_id: user_1.id, updated_date: 1.day.from_now.to_i) }
  let!(:shared_collection_1) { create(:project, proj_name: 'shared_collection_1', proj_type: 3, user_id: user_1.id, calendar_id: calendar.uri) }
  let!(:shared) { create(:projects_user, user: current_user, project: shared_collection_1,
                                         status: ProjectsUser::STATUS_ACCEPTED,
                                         permission: ProjectsUser::PERMISION_READ_WRITE) }
  let!(:todo_1_day_ago) { create(:calendar_object, componenttype: 'VTODO', calendarid: calendar.id, uid: '3c6cc1fe-a17c-4983-8a1c-751a7aafb9ec', lastmodified: 1.day.ago.to_i) }
  let!(:todo_2_day_ago) { create(:calendar_object, componenttype: 'VTODO', calendarid: calendar.id, lastmodified: 2.days.ago.to_i) }
  let!(:todo_1_day_from_now) { create(:calendar_object, componenttype: 'VTODO', calendarid: calendar.id, uid: UUID.new.generate, lastmodified: 1.days.from_now.to_i) }

  let!(:event_1) { create(:calendar_object, componenttype: 'VEVENT', calendarid: calendar.id, calendardata: "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:icalendar-ruby\nCALSCALE:GREGORIAN\nBEGIN:VEVENT\nDTSTAMP:20160421T025410Z\nUID:3f2a18d0-e99a-0133-f069-005056030716\nDTSTART;TZID=Asia/Jakarta:20160420T180000\nDTEND;TZID=Asia/Jakarta:20160420T200000\nDURATION:P\nDESCRIPTION:Soccer game\nLOCATION:\nSUMMARY:Soccer game\nURL:http://123flo.com:8058\nX-LCL-COLOR:#4986e7\nX-LCL-FOLDERID:15377\nEND:VEVENT\nEND:VCALENDAR") }
  let!(:event_2) { create(:calendar_object, componenttype: 'VEVENT', calendarid: calendar.id, calendardata:  "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:icalendar-ruby\nCALSCALE:GREGORIAN\nBEGIN:VEVENT\nDTSTAMP:20160421T025410Z\nUID:3f2a18d0-e99a-0133-f069-005056030718\nDTSTART;TZID=Asia/Jakarta:20160420T180000\nDTEND;TZID=Asia/Jakarta:20160420T200000\nDURATION:P\nDESCRIPTION:Soccer game\nLOCATION:\nSUMMARY:Soccer game\nURL:http://123flo.com:8058\nX-LCL-COLOR:#4986e7\nX-LCL-FOLDERID:15377\nEND:VEVENT\nEND:VCALENDAR") }
  let!(:note_1) { create(:calendar_object, componenttype: 'VJOURNAL', calendarid: calendar.id, calendardata: "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Flo Online//EN\nMETHOD:PUBLISH\nCALSCALE:GREGORIAN\nBEGIN:VJOURNAL\nUID:20a5a431-02f7-433b-97f7-e31feb0ce80c\nDTSTAMP:20160420T074545Z\nCREATED:20160420T074545Z\nSUMMARY:dsad\nDESCRIPTION:dsad\nX-LCL-COLOR:#4986e7\nX-LCL-NOTECONTENT:ZHNhZA==\nEND:VJOURNAL\nEND:VCALENDAR") }
  let!(:note_2) { create(:calendar_object, componenttype: 'VJOURNAL', calendarid: calendar.id, calendardata: "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Flo Online//EN\nMETHOD:PUBLISH\nCALSCALE:GREGORIAN\nBEGIN:VJOURNAL\nUID:20a5a431-02f7-433b-97f7-e31feb0ce80d\nDTSTAMP:20160420T074545Z\nCREATED:20160420T074545Z\nSUMMARY:dsad\nDESCRIPTION:dsad\nX-LCL-COLOR:#4986e7\nX-LCL-NOTECONTENT:ZHNhZA==\nEND:VJOURNAL\nEND:VCALENDAR") }

  describe '#shared_calendar_object' do
    let(:make_request) { get :calendar_objects, params: params }

    before do
      make_request
    end

    context 'get VEVENT' do
      let(:params) { { obj_type: 'VEVENT', project_id: shared_collection_1.id, months: ['2018-10-23T17:21:06+07:00'] } }

      it 'return 2 events' do
        expect(json_response[:num_of_errors]).to eq 0
        expect(json_response[:num_of_trashed_items]).to eq 0
        expect(json_response[:total_num_of_items]).to eq 2
      end
    end

    context 'get VTODO' do
      let(:params) { { obj_type: 'VTODO', project_id: shared_collection_1.id } }

      it 'return 2 todos' do
        expect(json_response[:data].count).to eq 3
        expect(json_response[:num_of_errors]).to eq 0
        expect(json_response[:num_of_trashed_items]).to eq 0
        expect(json_response[:total_num_of_items]).to eq 3
      end
    end

    context 'get VJOURNAL' do
      let(:params) { { obj_type: 'VJOURNAL', project_id: shared_collection_1.id } }

      it 'return 2 notes' do
        expect(json_response[:data].count).to eq 2
        expect(json_response[:num_of_errors]).to eq 0
        expect(json_response[:num_of_trashed_items]).to eq 0
        expect(json_response[:total_num_of_items]).to eq 2
      end
    end
  end

  describe '#create' do
    let(:make_request) { post :create, params: params }

    before do
      make_request
    end

    context 'with no params' do
      let(:params) {{}}

      it 'throw error' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'with idea params' do
      let(:params) {{ calendar_objects: [{calendar_object: "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Flo Online//EN\nMETHOD:PUBLISH\nCALSCALE:GREGORIAN\nBEGIN:VTODO\nUID:4c6cc1fe-a17c-4983-8a1c-751a7aafb9ec\nDTSTAMP:20180917T032548Z\nLAST-MODIFIED:20180917T032548Z\nCREATED:20180917T032548Z\nSUMMARY:todo_xxx\nDURATION:PT30M\nDTSTART;TZID=Asia/Jakarta:20180917T102548\nEND:VTODO\nEND:VCALENDAR",
                                                 project_id: shared_collection_1.id}] }}
      it 'create successful' do
        expect(response).to be_successful
        expect(json_response[:data].first[:calendar_object][:uid]).to eq '4c6cc1fe-a17c-4983-8a1c-751a7aafb9ec'
        expect(json_response[:data].first[:calendar_object][:uri]).to eq '4c6cc1fe-a17c-4983-8a1c-751a7aafb9ec.ics'
        expect(json_response[:data].first[:calendar_object][:calendarid]).to eq calendar.id
      end
    end

    context 'with collection not shared' do
      let(:params) {{ calendar_objects: [{calendar_object: "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Flo Online//EN\nMETHOD:PUBLISH\nCALSCALE:GREGORIAN\nBEGIN:VTODO\nUID:3c6cc1fe-a17c-4983-8a1c-751a7aafb9ec\nDTSTAMP:20180917T032548Z\nLAST-MODIFIED:20180917T032548Z\nCREATED:20180917T032548Z\nSUMMARY:todo_xxx\nDURATION:PT30M\nDTSTART;TZID=Asia/Jakarta:20180917T102548\nEND:VTODO\nEND:VCALENDAR",
                                                 project_id: private_project_1.id}] }}
      it 'throw error' do
        expect(json_response[:error]).to eq NOT_AUTHORIZED
        expect(json_response[:description]).to include 'You are not authorized to perform this action.'
      end
    end

  end


  describe '#update' do
    let(:make_request) { get :update, params: params }

    before do
      make_request
    end

    context 'with no params' do
      let(:params) {{}}

      it 'throw error' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'with idea params' do
      let(:params) {{ calendar_objects: [{calendar_object: "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Flo Online//EN\nMETHOD:PUBLISH\nCALSCALE:GREGORIAN\nBEGIN:VTODO\nUID:3c6cc1fe-a17c-4983-8a1c-751a7aafb9ec\nDTSTAMP:20180917T032548Z\nLAST-MODIFIED:20180917T032548Z\nCREATED:20180917T032548Z\nSUMMARY:todo_zzz\nDURATION:PT30M\nDTSTART;TZID=Asia/Jakarta:20180917T102548\nEND:VTODO\nEND:VCALENDAR",
                                                 project_id: shared_collection_1.id}] }}
      it 'update successful' do
        expect(response).to be_successful
        expect(json_response[:data].first[:calendar_object][:uid]).to eq '3c6cc1fe-a17c-4983-8a1c-751a7aafb9ec'
        expect(json_response[:data].first[:calendar_object][:uri]).to eq '3c6cc1fe-a17c-4983-8a1c-751a7aafb9ec.ics'
        expect(json_response[:data].first[:calendar_object][:calendardata]).to include('todo_zzz')
      end
    end

    context 'with calendar object not shared' do
      let(:params) {{ calendar_objects: [{calendar_object: "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Flo Online//EN\nMETHOD:PUBLISH\nCALSCALE:GREGORIAN\nBEGIN:VTODO\nUID:3c6cc1fe-a17c-4983-8a1c-751a7aafb9ec\nDTSTAMP:20180917T032548Z\nLAST-MODIFIED:20180917T032548Z\nCREATED:20180917T032548Z\nSUMMARY:todo_xxx\nDURATION:PT30M\nDTSTART;TZID=Asia/Jakarta:20180917T102548\nEND:VTODO\nEND:VCALENDAR",
                                                 project_id: private_project_1.id}] }}
      it 'throw error' do
        expect(json_response[:error]).to eq NOT_AUTHORIZED
        expect(json_response[:description]).to include 'You are not authorized to perform this action.'
      end
    end
  end

  describe '#destroy' do
    let(:make_request) { get :destroy, params: params }

    before do
      make_request
    end

    context 'with no params' do
      let(:params) {{}}

      it 'throw error' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq PARAMETER_MISSING
        expect(json_response[:description]).to include 'param is missing or the value is empty'
      end
    end

    context 'with idea params' do
      let(:params) {{ calendar_objects: [{uid: todo_1_day_ago.uid,
                                                 project_id: shared_collection_1.id}] }}

      it 'destroy successful' do
        expect(response).to be_successful
        expect(json_response[:data].first[:uid]).to eq todo_1_day_ago.uid
      end
    end

    context 'with calendar object not shared'
      let(:params) {{ calendar_objects: [{uid: todo_1_day_ago.uid,
                                                 project_id: private_project_1.id}] }}
      it 'throw error' do
        expect(json_response[:error]).to eq NOT_AUTHORIZED
        expect(json_response[:description]).to include 'You are not authorized to perform this action.'
      end
  end

  describe '#index' do
    let(:make_request) { get :index, params: params }

    before do
      create(:project, user_id: current_user.id, proj_name: 'private_project')

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

    context 'with modifiedLT params is valid' do
      let(:params) { { project_ids: [shared_collection_1.id], modifiedLT: time_now } }

      it 'response data with updated_date less than from now' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 2
        expect(json_response[:data][0][:calendar_object][:uid]).to eq todo_1_day_ago.uid
        expect(json_response[:data][1][:calendar_object][:uid]).to eq todo_2_day_ago.uid
      end
    end

    context 'with modifiedGTE params is valid' do
      let(:params) { { project_ids: [shared_collection_1.id], modifiedGTE: time_now } }

      it 'response data with updated_date greater than or equal from now' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 5
      end
    end

    context 'with ids params is valid' do
      let(:params) {{ project_ids: [shared_collection_1.id], ids: "#{todo_1_day_ago.id}, #{todo_2_day_ago.id}" }}

      it 'return 2 items' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 2
      end
    end

    context 'with mindID params is valid' do
      let(:params) { { project_ids: [shared_collection_1.id], minID: "#{todo_2_day_ago.id}" } }

      it 'return 2 deleted item' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 5
        expect(json_response[:data].first[:calendar_object][:uid]).to eq todo_1_day_from_now.uid
      end
    end
  end
end
