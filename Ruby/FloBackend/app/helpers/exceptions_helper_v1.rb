module ExceptionsHelperV1
  def handle_record_not_found(e)
    render json: { error: RECORD_NOT_FOUND, description: e.message }, status: :not_found
  end

  def handle_invalid_record!(e)
    render json: { error: INVALID_RECORD, description: e.record.errors }, status: :unprocessable_entity
  end

  def handle_unauthorized
    render json: { error: UNAUTHORIZED, description: 'Permission denied' }, status: 403
  end

  def handle_token_expired!
    respond_to do |format|
      format.json {render json: { error: API_TOKEN_EXPIRED, description: MSG_TOKEN_EXPIRED }, status: 200}
    end
  end

  def handle_user_disable!
    render json: { error: API_USER_DISABLED , description: MSG_USER_DISABLED }, status: 200
  end

  def handle_user_invalid!
    render json: { error: API_USER_INVALID, description: MSG_USER_INVALID }, status: 200
  end

  def handle_image_not_found!
    send_data({status: 404, error: "not found"}.to_json(), :type => "application/json", :status => "404")
  end

  def handle_unexpected_errors(e)
    raise e if Rails.env.development? || Rails.env.test?

    render json: [{errors: UNEXPECTED_ERROR, description: 'Unexpected error happened on server' }], status: 500
  end
end
