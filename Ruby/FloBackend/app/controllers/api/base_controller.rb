class Api::BaseController < ApplicationController
  before_action :default_json_format
  before_action :authenticate, :except => [:token, :recover_pass, :user_token, :reset_pass, :check_email]
  before_action :user_info

  include ApiHelperV2
  rescue_from CanNotDownload, with: :handle_can_not_download_file!
  rescue_from FileNotFound, with: :handle_file_not_found!
  rescue_from ApiTokenExpired, with: :handle_token_expired!
  rescue_from ApiUserInvalid, with: :handle_user_invalid!
  rescue_from ApiUserDisable, with: :handle_user_disable!

  rescue_from ActionController::ParameterMissing, with: :handle_params_missing!
  rescue_from ActiveRecord::RecordNotFound, with: :handle_record_not_found!
  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  protected

  def set_headers
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, DELETE, OPTIONS'
    headers['Access-Control-Allow-Headers'] = %w[Origin Accept Range Content-Type X-Requested-With X-CSRF-Token].join(',')
    headers['Access-Control-Max-Age'] = "1728000"
    headers['Access-Control-Request-Method'] = '*'
    headers['Access-Control-Allow-Credentials'] = 'true'
    headers['Access-Control-Expose-Headers'] = %w[Accept-Ranges Content-Encoding Content-Length Content-Range].join(',')
  end

  def authenticate
    @token_params = request.headers[:keyapi] || params[:keyapi]
    raise ApiUserInvalid unless @token_params

    raise ApiUserInvalid unless current_user
    raise ApiUserDisable unless current_user.disabled == 0

    expire_time = (Time.now.utc.to_i - current_user.app_token.time_expire.to_i)
    raise ApiTokenExpired if expire_time.to_i > EXPIRE_TIME.to_i
  end

  def current_user
    @_current_user ||= AppToken.joins(:user).find_by(key_api: @token_params)&.user
  end

  def current_user_id
    @_current_user_id ||= current_user.app_token
  end

  def user_info
    @user_id = current_user_id.user_id
    @email = current_user_id.email
  end

  def default_json_format
    request.format = 'json' if headers['Accept'].blank?
  end

  # def render_error(exception)
    # status = 404
    # message = 'Unknow error.'
    # respond_to do |format|
      # format.xml  { render :xml => {:error => message}.to_xml(:root => API_KEY_ROOT), :status => status }
      # format.json  { render :json => {:error => message}.to_json(:root => API_KEY_ROOT), :status => status }
    # end
  # end

  # def render_not_found(exception)
    # status = 500
    # message = "Sorry, what you are looking for isn't here."
    # respond_to do |format|
      # format.xml  { render :xml => {:error => message}.to_xml(:root => API_KEY_ROOT), :status => status }
      # format.json  { render :json => {:error => message}.to_json(:root => API_KEY_ROOT), :status => status }
    # end
  # end

  def save_delete_item(type, id, is_recovery = 0)
    id = id.to_s.strip

    if id.present?
      item = DeletedItem.new
      item.item_type = type.to_s
      item.user_id = @user_id
      item.item_id = id
      item.is_recovery = is_recovery if is_recovery and is_recovery.to_i == 1
      item.save
    end
  end

  # create a array params valid and skip all parameter invalid
  def permit_id_params(ids_params)
    ids_params
      .to_s
      .split(',')
      .select { |id| id.to_i }
      .map(&:to_i)
  end

  def destroy
    @data_error = []
    @deleted_ids = []

    if params[:id].to_i > 0
      @deleted_ids = delete(params[:id])
      @data_error = log_ids_cannot_delete(permit_id_params(params[:id]), @deleted_ids)
    end

    if params[:re_ids].to_i > 0
      @deleted_ids = recover(params[:re_ids])
      @data_error = log_ids_cannot_delete(permit_id_params(params[:re_ids]), @deleted_ids)
    end
  end

  def log_ids_cannot_delete(expect_ids, actual_ids)
    errors = []
    ids_not_found = expect_ids - actual_ids
    ids_not_found.each do |id|
      errors << { id: id.to_s, error: API_ITEM_CANNOT_DELETE, description: MSG_FIND_NOT_FOUND }
    end
    errors
  end
end
