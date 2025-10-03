describe Api::CloudStoragesController, type: :controller do
  include_context 'initialize auth with app_token'
  include_examples :index_spec, CloudStorage, "cloud_storage", [:modifiedGTE, :modifiedLT, :ids, :minID, :pItem, :fields]

  let!(:time_now) { Time.zone.now.to_i }

  describe '#create' do
    let(:make_request) { post :create, params: params }

    before do
      create(:cloud_storage)
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

    context 'when valid' do
      let(:params) do
        { cloud_storages:
          [{
            real_filename: 'test_90',
            ext: 'jpg',
            device_uid: 'my_device',
            size: 123,
            bookmark_data: 'base64-format_90',
            uid_filename: 'uid_filename_1'
          }] }
      end

      it 'create url bookmark success' do
        expect(response).to be_successful
        expect(CloudStorage.count).to eq 2
        expect(json_response[:data].first[:cloud_storage][:real_filename]).to eq 'test_90'
      end
    end
  end

  describe '#update' do
    let(:make_request) { put :update, params: params }
    let(:created_cloud_storage) { create(:cloud_storage) }

    before do
      created_cloud_storage
      make_request
    end

    context 'when valid' do
      let(:params) do
        { cloud_storages:
          [{
            real_filename: 'test_90',
            ext: 'jpg',
            device_uid: 'my_device',
            size: 123,
            id: created_cloud_storage.id,
            bookmark_data: 'base64-format_90',
            uid_filename: 'uid_filename_1'
          }] }
      end

      it 'update successful' do
        expect(response).to be_successful
        expect(CloudStorage.count).to eq 1
        expect(json_response[:data].first[:cloud_storage][:real_filename]).to eq 'test_90'
        expect(json_response[:data].first[:cloud_storage][:uid_filename]).to eq created_cloud_storage.uid_filename
        expect(json_response[:data].first[:cloud_storage][:ext]).to eq 'jpg'
        expect(json_response[:data].first[:cloud_storage][:device_uid]).to eq 'my_device'
      end
    end

    context 'when invalid' do
      let(:params) do
        { cloud_storages:
          [{
            real_filename: 'test_90',
            ext: 'jpg',
            device_uid: 'my_device',
            size: 123,
            id: 100_000,
            bookmark_data: 'base64-format_90',
            uid_filename: 'uid_filename_1'
          }] }
      end

      it 'do nothings' do
        expect(CloudStorage.count).to eq 1
      end
    end
  end

  describe '#destroy' do
    let(:make_request) { delete :destroy, params: params }
    let(:created_cloud_storage_1) { create(:cloud_storage) }
    let(:created_cloud_storage_2) { create(:cloud_storage) }
    let(:created_cloud_storage_3) { create(:cloud_storage) }

    before do
      created_cloud_storage_1
      created_cloud_storage_2
      created_cloud_storage_3

      make_a_file(created_cloud_storage_1.uid_filename)
      make_a_file(created_cloud_storage_2.uid_filename)
      make_a_file(created_cloud_storage_3.uid_filename)

      make_request
    end

    context 'when valid' do
      let(:params) {{ id: "#{created_cloud_storage_1.id},#{created_cloud_storage_3.id}" }}

      it 'delete successful' do
        expect(response).to be_successful
        expect(CloudStorage.count).to eq 1
        expect(DeletedItem.count).to eq 2
      end
    end

    context 'when invalid' do
      let(:params) {{ id: "100000" }}

      it 'do nothings' do
        expect(response).to be_successful
        expect(CloudStorage.count).to eq 3
        expect(DeletedItem.count).to eq 0
      end
    end
  end

  describe '#recovery' do
    let(:make_request) { delete :recovery, params: params }

    let(:created_cloud_storage_1) { create(:cloud_storage) }
    let(:created_cloud_storage_2) { create(:cloud_storage) }
    let(:created_cloud_storage_3) { create(:cloud_storage) }
    before do
      created_cloud_storage_1
      created_cloud_storage_2
      created_cloud_storage_3

      make_request
    end

    context 'when valid' do
      let(:params) {{ id: "#{created_cloud_storage_1.id},#{created_cloud_storage_3.id}" }}

      it 'delete successful' do
        expect(response).to be_successful
        expect(CloudStorage.count).to eq 3
        expect(DeletedItem.count).to eq 2
        expect(DeletedItem.first.is_recovery).to eq 1
        expect(DeletedItem.last.is_recovery).to eq 1
      end
    end
  end

  describe '#upload' do
    let(:make_request) { post :upload, params: params }
    let(:created_cloud_storage_1) { create(:cloud_storage) }
    let(:file) { fixture_file_upload('/sample_txt.txt', 'text/txt') }

    before do
      created_cloud_storage_1
      make_request
    end

    context 'when valid' do
      let(:params) {{ file: file }}

      it 'upload successful' do

        expect(json_response[:data][:description]).to include 'Upload successful'
        expect(json_response[:data][:cloud_storage][:real_filename]).to include 'sample_txt.txt'
        expect(json_response[:data][:cloud_storage][:uid_filename]).not_to be_nil
      end
    end

    context 'when invalid' do
      let(:params) {{ file: nil }}

      it 'upload fail' do
        expect(json_response[:data][:description]).to include 'Upload failed'
      end
    end
  end

  describe '#download' do
    let(:make_request) { get :download, params: params, xhr: true }
    let(:created_cloud_storage_1) { create(:cloud_storage) }

    before do
      created_cloud_storage_1
      make_a_file(created_cloud_storage_1.uid_filename)

      make_request
    end

    context 'when valid' do
      let(:params) {{ uid: created_cloud_storage_1.uid_filename }}

      it 'download successful' do
        expect(response.body).to include 'This is content of example file'
      end
    end

    context 'when invalid' do
      let(:params) {{ uid: 0 }}

      it 'show message file not found' do
        expect(json_response[:description]).to include 'File not found'
      end
    end
  end

  def make_a_file(file_name)
    storage_path = UPLOAD_FILE_PATH + "1" + "/"
    content = 'This is content of example file'

    File.open(storage_path + file_name, "w+") do |f|
      f.write(content)
    end
  end
end
