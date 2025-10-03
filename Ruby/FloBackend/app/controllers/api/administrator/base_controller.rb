class Api::Administrator::BaseController < ApplicationController
  include ApiHelperV2

  rescue_from ActiveRecord::RecordNotFound, with: :handle_record_not_found!
  rescue_from ApiUnauthorized, with: :handle_unauthorized
  rescue_from ApiTokenExpired, with: :handle_token_expired!
  rescue_from ApiUserInvalid, with: :handle_user_invalid!
  rescue_from ApiUserDisable, with: :handle_user_disable!

  # error uninitialized constant when run Rspec, it fixed on Rails 4
  rescue_from 'ActiveRecord::RecordInvalid', with: :handle_invalid_record!

  before_action :default_json_format
  before_action :authenticate, :except => [:reset_subs,:check_admin,:token, :recover_pass, :user_token, :reset_pass, :check_email,:push_noti,:subs_update,:users_disabled]
  before_action :admin?, except: [:check_admin]
  before_action :user_info, :except => [:reset_subs,:check_admin, :push_noti,:subs_update,:users_disabled]
  after_action :set_headers

  def set_headers
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, DELETE, OPTIONS'
    headers['Access-Control-Allow-Headers'] = %w[Origin Accept Range Content-Type X-Requested-With X-CSRF-Token].join(',')
    headers['Access-Control-Max-Age'] = "1728000"
    headers['Access-Control-Expose-Headers'] = %w[Accept-Ranges Content-Encoding Content-Length Content-Range].join(',')
  end

  protected

  def authenticate
    raise ApiUserInvalid unless params[:keyapi]

    token = AppToken.find_by(key_api: params[:keyapi])
    raise ApiUserInvalid unless token

    user = User.where(id: token.user_id, disabled: 0).first
    raise ApiUserDisable unless user

    expireTime = API_TIME_DEFAULT.to_i
    expireTime = (Time.now.to_i - token.time_expire.to_i) if token

    raise ApiTokenExpired if expireTime.to_i > EXPIRE_TIME.to_i

    @app_token = token
  end

  def current_user_id
    @app_token
  end

  def user_info
    @user_id = current_user_id.user_id
    @email = current_user_id.email
  end

  def admin?
    admin = Admin.where(email: current_user_id.email).first
    raise ApiUnauthorized if admin.nil?
  end

  def default_json_format
    if headers['Accept'].nil?
      request.format = 'json'
    end
  end

  def paginator
    per_page = params[:per_page].to_i
    page = params[:page].to_i
    @paginator = {
      per_page: per_page > 0 == true ? per_page : 50,
      page: page > 0 == true ? page : 1
    }
  end
end
