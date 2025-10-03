describe Api::LinksController, type: :controller do
  include_context 'initialize auth with app_token'

  let!(:time_now) { Time.zone.now.to_i }
  let!(:virtual_domain) { create(:virtual_domain) }
  let!(:user_1) { create(:user, domain_id: virtual_domain.id, username: 'user_1@123flo.com', email: 'user_1@123flo.com') }
  let!(:user_2) { create(:user, domain_id: virtual_domain.id, username: 'user_2@123flo.com', email: 'user_2@123flo.com') }
  let!(:calendar_1) { create(:calendar, principaluri: API_PRINCIPAL + user_1.email) }
  let!(:calendar_2) { create(:calendar, principaluri: API_PRINCIPAL + user_1.email) }
  let!(:calendar_3) { create(:calendar, principaluri: API_PRINCIPAL + user_1.email) }

  let!(:private_project_1) { create(:project, proj_name: 'private_project_1', user_id: current_user.id, updated_date: 1.day.from_now.to_i, calendar_id: calendar_3.id) }
  let!(:private_project_2) { create(:project, proj_name: 'private_project_2', user_id: user_1.id, updated_date: 1.day.from_now.to_i) }
  let!(:shared_collection_1) { create(:project, proj_name: 'shared_collection_1', proj_type: 3, user_id: user_1.id, calendar_id: calendar_1.id) }
  let!(:shared_collection_2) { create(:project, proj_name: 'shared_collection_2', proj_type: 3, user_id: current_user.id, calendar_id: calendar_2.id) }
  let!(:project_user) { create(:projects_user, user: current_user, project: shared_collection_1,
                                               status: ProjectsUser::STATUS_ACCEPTED,
                                               permission: ProjectsUser::PERMISION_READ_WRITE) }

  let!(:todo_1) { create(:calendar_object, componenttype: 'VTODO', calendarid: calendar_1.id, uid: UUID.new.generate) }
  let!(:todo_2) { create(:calendar_object, componenttype: 'VTODO', calendarid: calendar_3.id, uid: UUID.new.generate) }
  let!(:linked_1) { create(:link, source_type: API_VJOURNAL, source_id: todo_1.uid,
                                  destination_type: API_FOLDER, destination_id: shared_collection_1.id) }
  describe '#create' do
    let(:make_request) { post :create, params: params }

    before do
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

    context 'link object from shared collection to private collection' do
      let(:params) {{ links: [{ source_type: API_VJOURNAL, source_id: todo_1.uid,
                                destination_type: API_FOLDER, destination_id: private_project_1.id }] }}

      it 'add successful' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 1
        expect(json_response[:data].first[:link][:source_id]).to eq todo_1.uid
        expect(json_response[:data].first[:link][:destination_id].to_i).to eq private_project_1.id
      end
    end

    context 'link object from shared collection to another shared collection' do
      let(:params) {{ links: [{ source_type: API_VJOURNAL, source_id: todo_1.uid,
                                destination_type: API_FOLDER, destination_id: shared_collection_2.id }] }}

      it 'add fail' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 0
      end
    end

    context 'link object from private collection to shared collection' do
      let(:params) {{ links: [{ source_type: API_VJOURNAL, source_id: todo_2.uid,
                                destination_type: API_FOLDER, destination_id: shared_collection_1.id }] }}

      it 'add successful' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 1
        expect(json_response[:data].first[:link][:source_id]).to eq todo_2.uid
        expect(json_response[:data].first[:link][:destination_id].to_i).to eq shared_collection_1.id
      end
    end

    context 'link todo to event' do
      let!(:todo_1) { create(:calendar_object, componenttype: 'VTODO') }
      let!(:event_1) { create(:calendar_object, componenttype: 'VEVENT') }

      let(:params) {{ links: [{ source_type: 'VTODO', source_id: todo_1.uid,
                                destination_type: 'VEVENT', destination_id: event_1.uid }] }}

      it 'add successful' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 1
        expect(json_response[:data].first[:link][:source_id]).to eq todo_1.uid
        expect(json_response[:data].first[:link][:destination_id]).to eq event_1.uid
      end
    end

    context 'without meta_data' do
      let!(:todo_1) { create(:calendar_object, componenttype: 'EMAIL') }
      let!(:event_1) { create(:calendar_object, componenttype: 'VEVENT') }

      let(:params) {{ links: [{ source_type: 'EMAIL', source_id: 'eyJ1aWQiOjY1LCJwYXRoIjoiSU5CT1giLCJ0aXRsZSI6IldvcmtzaG9wIFTGsCB24bqlbiBDViBtaeG7hW4gcGjDrSAtIGLhuqFuIMSRw6MgYmnhur90IGPDoWNoIGzDoG0gbmjDoCB0dXnhu4NuIGThu6VuZyBcInRo4bqjIHRow61uaFwiIG3DrG5oPyJ9',
                                source_root_uid: 'source_root_uid',
                                destination_root_uid: 'destination_root_uid',
                                destination_type: 'VEVENT', destination_id: event_1.uid }] }}
      it 'add successful' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 1
        expect(json_response[:data].first[:link][:source_id]).to eq 'eyJ1aWQiOjY1LCJwYXRoIjoiSU5CT1giLCJ0aXRsZSI6IldvcmtzaG9wIFTGsCB24bqlbiBDViBtaeG7hW4gcGjDrSAtIGLhuqFuIMSRw6MgYmnhur90IGPDoWNoIGzDoG0gbmjDoCB0dXnhu4NuIGThu6VuZyBcInRo4bqjIHRow61uaFwiIG3DrG5oPyJ9'
        expect(json_response[:data].first[:link][:destination_id]).to eq event_1.uid
      end
    end

    context 'meta_data valid' do
      let!(:todo_1) { create(:calendar_object, componenttype: 'EMAIL') }
      let!(:event_1) { create(:calendar_object, componenttype: 'VEVENT') }

      let(:params) {{ links: [{ source_type: 'EMAIL', source_id: 'eyJ1aWQiOjY1LCJwYXRoIjoiSU5CT1giLCJ0aXRsZSI6IldvcmtzaG9wIFTGsCB24bqlbiBDViBtaeG7hW4gcGjDrSAtIGLhuqFuIMSRw6MgYmnhur90IGPDoWNoIGzDoG0gbmjDoCB0dXnhu4NuIGThu6VuZyBcInRo4bqjIHRow61uaFwiIG3DrG5oPyJ9',
                                meta_data: {
                                            "source": {
                                              "message_id": "yyy",
                                              "subject": "yyy",
                                              "from": "yyy@xyz.com", "to": [
                                                "to@xyz.com",
                                                "to@123.com"
                                              ],
                                              "cc": [
                                                "cc@xyz.com",
                                                "cc@123.com"
                                              ],
                                              "bcc": [],
                                              "sent_time": 123456.123,
                                              "received_time": 123456.123
                                            }
                                          },
                                source_root_uid: 'source_root_uid',
                                destination_root_uid: 'destination_root_uid',
                                destination_type: 'VEVENT', destination_id: event_1.uid }] }}
      it 'add successful' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 1
      end
    end

    context 'meta_data invalid' do
      let!(:todo_1) { create(:calendar_object, componenttype: 'EMAIL') }
      let!(:event_1) { create(:calendar_object, componenttype: 'VEVENT') }

      let(:params) {{ links: [{ source_type: 'EMAIL', source_id: 'eyJ1aWQiOjY1LCJwYXRoIjoiSU5CT1giLCJ0aXRsZSI6IldvcmtzaG9wIFTGsCB24bqlbiBDViBtaeG7hW4gcGjDrSAtIGLhuqFuIMSRw6MgYmnhur90IGPDoWNoIGzDoG0gbmjDoCB0dXnhu4NuIGThu6VuZyBcInRo4bqjIHRow61uaFwiIG3DrG5oPyJ9',
                                meta_data: 'META_DATA INVALID',
                                source_root_uid: 'source_root_uid',
                                destination_root_uid: 'destination_root_uid',
                                destination_type: 'VEVENT', destination_id: event_1.uid }] }}
      it 'add successful' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 0
        expect(json_response[:data_error].count).to eq 1
      end
    end

    context 'meta_data without from field' do
      let!(:todo_1) { create(:calendar_object, componenttype: 'EMAIL') }
      let!(:event_1) { create(:calendar_object, componenttype: 'VEVENT') }

      let(:params) {{ links: [{ source_type: 'EMAIL', source_id: 'eyJ1aWQiOjY1LCJwYXRoIjoiSU5CT1giLCJ0aXRsZSI6IldvcmtzaG9wIFTGsCB24bqlbiBDViBtaeG7hW4gcGjDrSAtIGLhuqFuIMSRw6MgYmnhur90IGPDoWNoIGzDoG0gbmjDoCB0dXnhu4NuIGThu6VuZyBcInRo4bqjIHRow61uaFwiIG3DrG5oPyJ9',
                                meta_data: {
                                            "source": {
                                              "message_id": "yyy",
                                              "subject": "yyy",
                                              "to": [
                                                "to@xyz.com",
                                                "to@123.com"
                                              ],
                                              "cc": [
                                                "cc@xyz.com",
                                                "cc@123.com"
                                              ],
                                              "bcc": [],
                                              "sent_time": 123456.123,
                                              "received_time": 123456.123
                                            }
                                          },
                                source_root_uid: 'source_root_uid',
                                destination_root_uid: 'destination_root_uid',
                                destination_type: 'VEVENT', destination_id: event_1.uid }] }}
      it 'throw error' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 0
        expect(json_response[:data_error].count).to eq 1
      end
    end

    context 'meta_data with cc invalid' do
      let!(:todo_1) { create(:calendar_object, componenttype: 'EMAIL') }
      let!(:event_1) { create(:calendar_object, componenttype: 'VEVENT') }

      let(:params) {{ links: [{ source_type: 'EMAIL', source_id: 'eyJ1aWQiOjY1LCJwYXRoIjoiSU5CT1giLCJ0aXRsZSI6IldvcmtzaG9wIFTGsCB24bqlbiBDViBtaeG7hW4gcGjDrSAtIGLhuqFuIMSRw6MgYmnhur90IGPDoWNoIGzDoG0gbmjDoCB0dXnhu4NuIGThu6VuZyBcInRo4bqjIHRow61uaFwiIG3DrG5oPyJ9',
                                meta_data: {
                                            "source": {
                                              "message_id": "yyy",
                                              "subject": "yyy",
                                              "from": "yyy@xyz.com",
                                              "to": [
                                                "to@xyz.com",
                                                "to@123.com"
                                              ],
                                              "cc": [
                                                "cc@xyz.com",
                                                "cc123.com"
                                              ],
                                              "bcc": [],
                                              "sent_time": 123456.123,
                                              "received_time": 123456.123
                                            }
                                          },
                                source_root_uid: 'source_root_uid',
                                destination_root_uid: 'destination_root_uid',
                                destination_type: 'VEVENT', destination_id: event_1.uid }] }}
      it 'throw error' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 0
        expect(json_response[:data_error].count).to eq 1
      end
    end
  end

  describe '#update' do
    let(:make_request) { post :update, params: params }

    before do
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

    context 'move object from shared collection to private collection' do
      let(:params) {{ links: [{ source_type: API_VJOURNAL, source_id: todo_1.uid,
                                destination_type: API_FOLDER, destination_id: private_project_1.id,
                                id: linked_1.id }] }}

      it 'move fail' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 0
      end
    end

    context 'move object from shared collection to another shared collection' do
      let(:params) {{ links: [{ source_type: API_VJOURNAL, source_id: todo_1.uid,
                                destination_type: API_FOLDER, destination_id: shared_collection_1.id,
                                id: linked_1.id}] }}

      it 'move fail' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 0
      end
    end

    context 'move object from private collection to shared collection' do
      let(:params) {{ links: [{ source_type: API_VJOURNAL, source_id: todo_2.uid,
                                destination_type: API_FOLDER, destination_id: shared_collection_1.id,
                                id: linked_1.id}] }}

      it 'move successful' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 1
      end
    end

    context 'move object from event to another event' do
      let!(:event_1) { create(:calendar_object, componenttype: 'VEVENT') }
      let!(:event_2) { create(:calendar_object, componenttype: 'VEVENT') }
      let!(:event_3) { create(:calendar_object, componenttype: 'VEVENT') }
      let!(:event_4) { create(:calendar_object, componenttype: 'VEVENT') }
      let!(:link) { create(:link, source_type: 'VEVENT', source_id: event_3.id,
                           destination_type: 'VEVENT', destination_id: event_4.id)}

      let(:params) {{ links: [{ source_type: 'VEVENT', source_id: event_1.uid,
                                destination_type: 'VEVENT', destination_id: event_2.uid, id: link.id}] }}

      it 'move successful' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 1
        expect(json_response[:data].first[:link][:source_id]).to eq event_1.uid
        expect(json_response[:data].first[:link][:destination_id]).to eq event_2.uid
      end
    end
  end

  describe '#destroy' do
    let(:make_request) { delete :destroy, params: params }
    let!(:link_1) { create(:link, source_type: API_FOLDER,
                          source_id: shared_collection_1.id,
                          user_id: current_user.id,
                          updated_date: 1.day.ago.to_i) }

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
      let(:params) {{ links: [{ id: link_1.id }] }}

      it 'return link id deleted' do
        expect(response).to be_successful
        expect(json_response[:data].first[:id]).to eq link_1.id
      end
    end
  end

  describe '#shared' do
    let(:make_request) { get :shared, params: params }
    let!(:private_link_1) { create(:link, source_type: API_VJOURNAL,
                                          source_id: todo_2.uid,
                                          destination_type: API_FOLDER,
                                          destination_id: private_project_1.id,
                                          user_id: current_user.id,
                                          updated_date: 1.day.ago.to_i) }
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

    context 'with shared projecet' do
      let(:params) {{ project_ids: [ shared_collection_1.id ] }}

      it 'return links of shared collection' do
        expect(json_response[:data].count).to eq 1
        expect(json_response[:data].first[:link][:source_id]).to eq todo_1.uid
      end
    end

    context 'with private project' do
      let(:params) {{ project_ids: [ private_project_2.id ] }}

      it 'return empty' do
        expect(response).to be_successful
        expect(json_response[:error]).to eq NOT_AUTHORIZED
        expect(json_response[:description]).to include 'You are not authorized to perform this action.'
      end
    end
  end
end
