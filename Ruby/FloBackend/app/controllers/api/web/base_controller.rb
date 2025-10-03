class Api::Web::BaseController < ApplicationController
  before_action :default_json_format
  before_action :authenticate, :except => [:reset_subs,:check_admin,:token, :recover_pass, :user_token, :reset_pass, :check_email,:push_noti,:subs_update,:users_disabled]
  before_action :user_info, :except => [:reset_subs,:check_admin, :push_noti,:subs_update,:users_disabled]

  include ApiHelperV1
  rescue_from ApiTokenExpired, with: :handle_token_expired!
  rescue_from ApiUserInvalid, with: :handle_user_invalid!
  rescue_from ApiUserDisable, with: :handle_user_disable!
  rescue_from ImageNotFound, with: :handle_image_not_found!

  # error uninitialized constant when run Rspec, it fixed on Rails 4
  rescue_from 'ActiveRecord::RecordInvalid', with: :handle_invalid_record!

  # rescue_from Exception, :with => :respond_error # comment this to debug

  # def respond_error(exception)
  #   p exception
  #   respond_to do |format|
  #     format.json { render :status => 400, :json => { error: 'something went wrong' } }
  #   end
  # end

  def cors_preflight_check
    respond_to do |format|
      format.json { head :ok }
    end
  end

  protected
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
    @email = current_user_id.email.downcase.strip
  end

  def default_json_format
    request.format = 'json' if headers['Accept'].blank?
  end

  # def render_error(exception)
    # status = 404
    # message = 'Unknow error.'
    # respond_to do |format|
      # format.json  { render :json => {:error => message}.to_json(:root => API_KEY_ROOT), :status => status }
    # end
  # end

  # def render_not_found(exception)
    # status = 500
    # message = "Sorry, what you are looking for isn't here."
    # respond_to do |format|
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
end
