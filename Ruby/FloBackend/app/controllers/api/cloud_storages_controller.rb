class Api::CloudStoragesController < Api::BaseController
  def index
    @cloud_storages = CloudStorage.where(user_id: current_user_id.user_id)
                                  .order(:updated_date)
                                  .with_modifiedGTE(params[:modifiedGTE])
                                  .with_modifiedLT(params[:modifiedLT])
                                  .with_ids(params[:ids])
                                  .with_min_id(params[:minID])
                                  .with_p_item(params[:pItem])
                                  .with_fields(params[:fields])
    @cloud_storages_deleted = del_items if params[:has_del].to_i == 1
  end

  def create
    return unless params[:cloud_storages].present?
    @data_err = []
    @cloud_storages = []

    if params[:cloud_storages].size > API_LIMIT_PARAMS
      return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
    end

    # valid_cloud_storages = []
    params[:cloud_storages].each do |cs_params|
      cloud_storage = CloudStorage.new(hash_cloud_storages_params(cs_params).merge(uid_filename: SecureRandom.uuid))
      if cloud_storage.save
        # valid_cloud_storages << cloud_storage
        @cloud_storages << cloud_storage
      else
        @data_err << {
                      error: API_ITEM_CANNOT_SAVE,
                      description: MSG_ERR_NOT_SAVED,
                      attributes: cs_params
                    }
      end
    end

    # @cloud_storages = CloudStorage.create(valid_cloud_storages)
  end

  def update
    return unless params[:cloud_storages].present?
    @data_err = []
    @cloud_storages = []

    if params[:cloud_storages].size > API_LIMIT_PARAMS
      return render json: { error: OVER_LIMITED_PARAMS, description: MSG_OVER_LIMITED_PARAMS }
    end

    params[:cloud_storages].each do |cs|
      cloud_storage = CloudStorage.where(user_id: current_user_id.user_id, id: cs[:id]).first
      next unless cloud_storage.present?

      if cloud_storage.update_attributes(hash_cloud_storages_params(cs))
        @cloud_storages << cloud_storage
      else
        @data_err << {
                        error: API_ITEM_CANNOT_SAVE,
                        description: MSG_ERR_NOT_SAVED,
                        attributes: cs
                     }
      end
    end
  end

  def destroy
    return unless params[:id].to_i > 0
    @data_err = []
    @deleted_ids = []

    # Find before insert to make sure that ids are exist
    begin
      cloud_storage_by_ids = CloudStorage.find_by_ids(current_user_id.user_id, permit_id_params(params[:id]))

      # delete files on disk before delete in database
      delete_files(cloud_storage_by_ids)

      @deleted_ids = cloud_storage_by_ids.map(&:id)
      cloud_storage_by_ids.delete_all

      deleted_item_service(ids: @deleted_ids).execute
    rescue
      @data_err << { error: API_ITEM_CANNOT_DELETE, description: MSG_DELETE_FAIL}
    end
  end

  def recovery
    return unless params[:id].to_i > 0
    @deleted_ids = []

    cloud_storage_by_ids = CloudStorage.find_by_ids(current_user_id.user_id, permit_id_params(params[:id]))
    @deleted_ids = cloud_storage_by_ids.map(&:id)
    deleted_item_service(ids: @deleted_ids, is_recovery: 1).execute
  end

  def upload
    @data_response = { error: UPLOAD_FAILED, description: 'Upload failed' }
    init_upload
    file = create_or_update_file_uploaded(params[:file])

    unless file == false
      @data_response = { description: 'Upload successful', cloud_storage: file.attributes }
    end
  end

  def download
    # In MySQL comparing zero to a string 0 = "any string" is always true!
    # So we need to make sure params uid is a string
    file_metadata = CloudStorage.where(user_id: current_user_id.user_id, uid_filename: params[:uid].to_s).first
    raise FileNotFound if file_metadata.nil?

    begin
      file = File.open(storage_path + file_metadata.uid_filename, 'rb')
      send_data(file.read, filename: file_metadata.real_filename)
    rescue => e
      raise CanNotDownload, e
    end
  end

  private

  # permit params because we don't trust anythings from client
  def hash_cloud_storages_params(cs_params, upload_params = {})
    hash_param = {}

    hash_param[:real_filename] = cs_params[:real_filename] if cs_params[:real_filename].present?
    hash_param[:ext] = cs_params[:ext] if cs_params[:ext].present?
    hash_param[:device_uid] = cs_params[:device_uid] if cs_params[:device_uid].present?
    hash_param[:bookmark_data] = cs_params[:bookmark_data] if cs_params[:bookmark_data].present?
    hash_param[:user_id] = current_user_id.user_id
    hash_param[:upload_status] = upload_params[:upload_status] || 0
    hash_param[:ref] = cs_params[:ref] || ""

    hash_param
  end

  def deleted_item_service(hash_param)
    CreateDeletedItemService.new(ids: hash_param[:ids],
                                 user_id: current_user_id.user_id,
                                 item_type: :CSFILE,
                                 is_recovery: hash_param[:is_recovery])
  end

  def del_items
    DeletedItem.del_items({ user_id: current_user_id.user_id,
                            item_type: :CSFILE,
                            modifiedLT: params[:modifiedLT],
                            modifiedGTE: params[:modifiedGTE] })
  end

  def init_upload
    FileUtils.mkpath(storage_path)
  end

  # after upload files successful, we need to update file info in database
  def create_or_update_file_uploaded(file_uploaded)
    file = find_or_initialize_file
    return false if file.nil?

    begin
      file.real_filename = file_uploaded.original_filename
      file.ext = file_uploaded.original_filename.split('.').last
      file.size = file_uploaded.size
      file.upload_status = 1

      # make sure upload done before save to database
      write_file(file.uid_filename, file_uploaded)

      file.save!
    rescue
      return false
    end

    file
  end

  def find_or_initialize_file
    return CloudStorage.new(bookmark_data: "", uid_filename: SecureRandom.uuid, user_id: current_user_id.user_id) if params[:uid].nil?
    CloudStorage.where(uid_filename: params[:uid].to_s, user_id: current_user_id.user_id).first
  end

  def write_file(uid_filename, file)
    full_path = storage_path + uid_filename
    File.open(full_path, 'wb') { |f| f.write(file.read) }
  rescue
    raise 'Error while writing file on disk'
  end

  def storage_path
    UPLOAD_FILE_PATH + current_user_id.user_id.to_s + "/"
  end

  def delete_files(files_metadata)
    files_metadata.each do |file|
      full_path = storage_path + file.uid_filename
      File.delete(full_path) if File.file?(full_path)
    end
  rescue
    raise 'Error while deleting file on disk'
  end
end
