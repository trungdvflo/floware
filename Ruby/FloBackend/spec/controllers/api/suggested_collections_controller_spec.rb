describe Api::SuggestedCollectionsController, type: :controller do
  include_context 'initialize auth with app_token'

  include_examples :index_spec, SuggestedCollection, "suggested_collection", [:modifiedGTE, :modifiedLT, :ids, :minID, :pItem, :fields]
  include_examples :destroy_spec, SuggestedCollection, "suggested_collection", [:id]

  describe '#suggested' do
    let!(:project_1) { create(:project) }
    let!(:project_2) { create(:project) }
    let!(:project_3) { create(:project) }
    let!(:project_4) { create(:project) }
    let!(:project_5) { create(:project) }
    let!(:project_6) { create(:project) }
    let!(:project_7) { create(:project) }

    let!(:suggested_1) { create(:suggested_collection,
                                criterion_type: Criterion::EMAIL_TYPE,
                                criterion_value: 'hello',
                                project_id: project_1.id,
                                frequency_used: 5) }
    let!(:suggested_2) { create(:suggested_collection,
                                criterion_type: Criterion::EMAIL_TYPE,
                                criterion_value: 'hello',
                                project_id: project_2.id,
                                frequency_used: 5) }
    let!(:suggested_3) { create(:suggested_collection,
                                criterion_type: Criterion::EMAIL_TYPE,
                                criterion_value: 'hello',
                                project_id: project_3.id,
                                frequency_used: 5) }
    let!(:suggested_4) { create(:suggested_collection,
                                criterion_type: Criterion::EMAIL_TYPE,
                                criterion_value: 'hello',
                                project_id: project_4.id,
                                frequency_used: 5) }
    let!(:suggested_5) { create(:suggested_collection,
                                criterion_type: Criterion::EMAIL_TYPE,
                                project_id: project_5.id,
                                frequency_used: 4) }
    let!(:suggested_6) { create(:suggested_collection,
                                criterion_type: Criterion::EMAIL_TYPE,
                                project_id: project_6.id,
                                updated_date: 5.day.ago.to_f,
                                frequency_used: 3) }
    let!(:suggested_7) { create(:suggested_collection,
                                criterion_type: Criterion::EMAIL_TYPE,
                                project_id: project_1.id,
                                updated_date: 4.days.ago.to_f,
                                frequency_used: 2) }
    let!(:suggested_8) { create(:suggested_collection,
                                criterion_type: Criterion::EMAIL_TYPE,
                                project_id: project_7.id,
                                updated_date: 3.days.ago.to_f,
                                frequency_used: 10) }

    let!(:suggested_9) { create(:suggested_collection,
                                project_id: project_1.id,
                                criterion_type: Criterion::EVENT_TITLE,
                                criterion_value: 'shit',
                                frequency_used: 4,
                                updated_date: 4.days.ago.to_f) }
    let!(:suggested_10) { create(:suggested_collection,
                                  criterion_type: Criterion::EVENT_LOCATION,
                                  criterion_value: 'some_where',
                                  project_id: project_2.id,
                                  updated_date: 3.day.ago.to_f) }
    let!(:suggested_11) { create(:suggested_collection,
                                  project_id: project_3.id,
                                  criterion_type: Criterion::EVENT_INVITEE,
                                  updated_date: 3.days.ago.to_f) }
    let!(:suggested_12) { create(:suggested_collection,
                                 criterion_type: Criterion::EVENT_INVITEE,
                                 project_id: project_4.id,
                                 updated_date: 2.day.ago.to_f) }
    let!(:suggested_13) { create(:suggested_collection,
                                 criterion_type: Criterion::EVENT_INVITEE,
                                 frequency_used: 5,
                                 project_id: project_7.id,
                                 updated_date: 1.day.ago.to_f) }

    let!(:suggested_14) { create(:suggested_collection,
                                 criterion_type: Criterion::CONTACT_COMPANY,
                                 criterion_value: 'floware',
                                 project_id: project_1.id,
                                 updated_date: 3.day.ago.to_f) }
    let!(:suggested_15) { create(:suggested_collection,
                                 criterion_type: Criterion::CONTACT_COMPANY,
                                 criterion_value: 'lcl',
                                 project_id: project_4.id,
                                 updated_date: 2.day.ago.to_f) }
    let!(:suggested_16) { create(:suggested_collection,
                                 criterion_type: Criterion::CONTACT_DOMAIN,
                                 criterion_value: 'floware.net',
                                 frequency_used: 5,
                                 project_id: project_7.id,
                                 updated_date: 1.day.ago.to_f) }

    let!(:suggested_17) { create(:suggested_collection,
                                 criterion_type: Criterion::TODO_TITLE,
                                 criterion_value: 'to_read_list',
                                 project_id: project_1.id,
                                 updated_date: 3.day.ago.to_f) }
    let!(:suggested_18) { create(:suggested_collection,
                                 criterion_type: Criterion::TODO_TITLE,
                                 criterion_value: 'to_view_list',
                                 project_id: project_4.id,
                                 updated_date: 2.day.ago.to_f) }
    let!(:suggested_19) { create(:suggested_collection,
                                 criterion_type: Criterion::TODO_TITLE,
                                 criterion_value: 'to_do_list',
                                 frequency_used: 5,
                                 project_id: project_7.id,
                                 updated_date: 1.day.ago.to_f) }

    let!(:suggested_20) { create(:suggested_collection,
                                 criterion_type: Criterion::NOTE_TITLE,
                                 criterion_value: 'note_1',
                                 project_id: project_1.id,
                                 updated_date: 3.day.ago.to_f) }
    let!(:suggested_21) { create(:suggested_collection,
                                 criterion_type: Criterion::NOTE_TITLE,
                                 criterion_value: 'note_2',
                                 project_id: project_4.id,
                                 updated_date: 2.day.ago.to_f) }
    let!(:suggested_22) { create(:suggested_collection,
                                 criterion_type: Criterion::NOTE_TITLE,
                                 criterion_value: 'note_3',
                                 frequency_used: 5,
                                 project_id: project_7.id,
                                 updated_date: 1.day.ago.to_f) }

    let!(:suggested_23) { create(:suggested_collection,
                                 criterion_type: Criterion::FILE_TYPE,
                                 criterion_value: 'file_1',
                                 project_id: project_1.id,
                                 updated_date: 3.day.ago.to_f) }
    let!(:suggested_24) { create(:suggested_collection,
                                 criterion_type: Criterion::FILE_TYPE,
                                 criterion_value: 'file_2',
                                 project_id: project_4.id,
                                 updated_date: 2.day.ago.to_f) }
    let!(:suggested_25) { create(:suggested_collection,
                                 criterion_type: Criterion::FILE_TYPE,
                                 criterion_value: 'file_3',
                                 frequency_used: 5,
                                 project_id: project_7.id,
                                 updated_date: 1.day.ago.to_f) }

    let!(:suggested_26) { create(:suggested_collection,
                                 criterion_type: Criterion::URL_TYPE,
                                 criterion_value: 'file_1',
                                 project_id: project_1.id,
                                 updated_date: 3.day.ago.to_f) }
    let!(:suggested_27) { create(:suggested_collection,
                                 criterion_type: Criterion::URL_TYPE,
                                 criterion_value: 'file_2',
                                 project_id: project_4.id,
                                 updated_date: 2.day.ago.to_f) }
    let!(:suggested_28) { create(:suggested_collection,
                                 criterion_type: Criterion::URL_TYPE,
                                 criterion_value: 'file_3',
                                 frequency_used: 5,
                                 project_id: project_7.id,
                                 updated_date: 1.day.ago.to_f) }

    let!(:sender_1) { create(:identical_sender,
                             email_address: 'tho.vo_1@123flo.com',
                             suggested_collection: suggested_3) }
    let!(:sender_2) { create(:identical_sender,
                             email_address: 'tho.vo_2@123flo.com',
                             suggested_collection: suggested_4) }
    let!(:sender_3) { create(:identical_sender, email_address: 'tho.vo_3@123flo.com') }

    let!(:sender_4) { create(:identical_sender,
                             email_address: 'tho.vo_1@123flo.com',
                             suggested_collection: suggested_11) }
    let!(:sender_5) { create(:identical_sender,
                             email_address: 'tho.vo_2@123flo.com',
                             suggested_collection: suggested_12) }

    let(:make_request) { get :suggested, params: params }

    before do
      make_request
    end

    context 'with no params' do
      let(:params) { {} }

      it 'throw error' do
        expect(response).to be_successful
      end
    end

    context 'email with title and identical senders' do
      let(:params) {{ object_type: 'EMAIL',
                      emails: ['tho.vo_1@123flo.com', 'tho.vo_2@123flo.com'],
                      subject: 'hello'
                   }}

      it 'return 7 items' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 7
        expect(json_response[:data][0][:project][:id]).to eq project_4.id
        expect(json_response[:data][1][:project][:id]).to eq project_3.id
        expect(json_response[:data][2][:project][:id]).to eq project_2.id
      end
    end

    context 'email without title and identical sender' do
      let(:params) {{ object_type: 'EMAIL' }}

      it 'return 7 items' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 7
        expect(json_response[:data][0][:project][:id]).to eq project_5.id
        expect(json_response[:data][1][:project][:id]).to eq project_4.id
        expect(json_response[:data][2][:project][:id]).to eq project_3.id
        expect(json_response[:data][3][:project][:id]).to eq project_2.id
        expect(json_response[:data][4][:project][:id]).to eq project_7.id
      end
    end

    context 'event with invitees' do
      let(:params) {{ object_type: 'EVENT',
                      invitees: ['tho.vo_1@123flo.com', 'tho.vo_2@123flo.com'] }}

      it 'return 2 items of invitess' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 7
        expect(json_response[:data][0][:project][:id]).to eq project_4.id
        expect(json_response[:data][1][:project][:id]).to eq project_3.id
        expect(json_response[:data][3][:project][:id]).to eq project_2.id
      end
    end

    context 'event with location' do
      let(:params) {{ object_type: 'EVENT', location: 'some_where' }}
      it 'return 2 items of location' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 7
        expect(json_response[:data][0][:project][:id]).to eq project_2.id
        expect(json_response[:data][1][:project][:id]).to eq project_5.id
      end
    end

    context 'event with title' do
      let(:params) {{ object_type: 'EVENT', title: 'shit' }}
      it 'return 2 items of title' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 7
        expect(json_response[:data][0][:project][:id]).to eq project_1.id
        expect(json_response[:data][1][:project][:id]).to eq project_5.id
      end
    end

    context 'event without params' do
      let(:params) {{ object_type: 'EVENT' }}
      it 'return items recents and frequency' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 6
        expect(json_response[:data][0][:project][:id]).to eq project_5.id
        expect(json_response[:data][1][:project][:id]).to eq project_4.id
        expect(json_response[:data][2][:project][:id]).to eq project_3.id
        expect(json_response[:data][3][:project][:id]).to eq project_7.id
      end
    end

    context 'contact without params' do
      let(:params) {{ object_type: 'CONTACT' }}

      it 'return items recents and frequency' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 3
        expect(json_response[:data][0][:project][:id]).to eq project_7.id
        expect(json_response[:data][1][:project][:id]).to eq project_4.id
        expect(json_response[:data][2][:project][:id]).to eq project_1.id
      end
    end

    context 'contact with company name' do
      let(:params) {{ object_type: 'CONTACT', company_name: 'floware' }}

      it 'return 2 items of company name' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 3
        expect(json_response[:data][0][:project][:id]).to eq project_1.id
        expect(json_response[:data][1][:project][:id]).to eq project_7.id
        expect(json_response[:data][2][:project][:id]).to eq project_4.id
      end
    end

    context 'contact with email address domain' do
      let(:params) {{ object_type: 'CONTACT', email_domain: 'floware.net' }}

      it 'return 2 items of email address domain' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 3
        expect(json_response[:data][0][:project][:id]).to eq project_7.id
        expect(json_response[:data][1][:project][:id]).to eq project_4.id
        expect(json_response[:data][2][:project][:id]).to eq project_1.id
      end
    end

    context 'todo with title' do
      let(:params) {{ object_type: 'TODO', title: 'to_read_list' }}

      it 'return items with title' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 3
        expect(json_response[:data][0][:project][:id]).to eq project_1.id
        expect(json_response[:data][1][:project][:id]).to eq project_7.id
        expect(json_response[:data][2][:project][:id]).to eq project_4.id
      end
    end

    context 'todo without title' do
      let(:params) {{ object_type: 'TODO' }}

      it 'return items with title' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 3
        expect(json_response[:data][0][:project][:id]).to eq project_7.id
        expect(json_response[:data][1][:project][:id]).to eq project_4.id
        expect(json_response[:data][2][:project][:id]).to eq project_1.id
      end
    end

    context 'note with title' do
      let(:params) {{ object_type: 'NOTE', title: 'note_2' }}

      it 'return items with title' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 3
        expect(json_response[:data][0][:project][:id]).to eq project_4.id
        expect(json_response[:data][1][:project][:id]).to eq project_7.id
        expect(json_response[:data][2][:project][:id]).to eq project_1.id
      end
    end

    context 'note without title' do
      let(:params) {{ object_type: 'NOTE' }}

      it 'return items with title' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 3
        expect(json_response[:data][0][:project][:id]).to eq project_7.id
        expect(json_response[:data][1][:project][:id]).to eq project_4.id
        expect(json_response[:data][2][:project][:id]).to eq project_1.id
      end
    end

    context 'file params' do
      let(:params) {{ object_type: 'FILE' }}

      it 'return items with title' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 3
        expect(json_response[:data][0][:project][:id]).to eq project_7.id
        expect(json_response[:data][1][:project][:id]).to eq project_4.id
        expect(json_response[:data][2][:project][:id]).to eq project_1.id
      end
    end

    context 'url params' do
      let(:params) {{ object_type: 'URL' }}

      it 'return items with title' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 6
        expect(json_response[:data][0][:project][:id]).to eq project_7.id
        expect(json_response[:data][1][:project][:id]).to eq project_4.id
        expect(json_response[:data][2][:project][:id]).to eq project_1.id
      end
    end
  end

  describe '#create' do
    let(:make_request) { get :create, params: params }

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

    context 'with ideal params' do
      let!(:project) { create(:project) }
      let(:params) { { suggested_collections: [{ project_id: project.id,
                                                 criterion_type: 1,
                                                 criterion_value: 2 },
                                               { project_id: project.id,
                                                 criterion_type: 2,
                                                 criterion_value: 3
                                               } ] } }

      it 'return 2 suggest collection created' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 2
        expect(json_response[:data].first[:project][:id]).to eq project.id
        expect(json_response[:data].last[:criterion_type]).to eq 2
      end
    end

    context 'when criterion_type is EMAIL_SENDER' do
      let!(:project) { create(:project) }
      let!(:criterion_type) { create(:criterion, name: 'EMAIL_SENDER', criterion_type: '2') }
      let(:params) { { suggested_collections: [{ project_id: project.id,
                                                 criterion_type: 1,
                                                 criterion_value: 2 },
                                               { project_id: project.id,
                                                 criterion_type: 2,
                                                 criterion_value: 3
                                               } ] } }

      it 'return 2 suggest collection created with identical senders' do
        expect(response).to be_successful
        expect(json_response[:data].count).to eq 2
        expect(json_response[:data].first[:project][:id]).to eq project.id
        expect(json_response[:data].last[:criterion_type]).to eq 2
      end
    end
  end
end
