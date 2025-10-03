class AdminConstraint
  def matches?(request)
    @token_params = request.headers[:keyapi] || request.query_parameters[:keyapi] || request.session[:key_api]
    return false unless @token_params.present?

    if request.env['REQUEST_PATH'] == "/sidekiq/logout"
      @token_params = request.query_parameters[:keyapi]
      token = AppToken.find_by(key_api: @token_params)
      if token.present?
        token.destroy
      end
      request.session[:key_api] = nil
    end

    token = AppToken.find_by(key_api: @token_params)
    return false unless token.present?

    user = User.where(id: token.user_id, disabled: 0).first
    return false unless user.present?

    # expireTime = API_TIME_DEFAULT.to_i
    # expireTime = (Time.now.to_i - token.time_expire.to_i) if token

    # return false if expireTime.to_i > EXPIRE_TIME.to_i
    admin = Admin.where(email: user.email).first
    if admin.present?
      request.session[:key_api] = @token_params if @token_params.present?
      return true
    end
    return false
  end
end