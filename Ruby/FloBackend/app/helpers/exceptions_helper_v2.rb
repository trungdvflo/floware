module ExceptionsHelperV2
  def handle_record_not_found!(e)
    render json: { error: RECORD_NOT_FOUND, description: e.message }, status: :not_found
  end

  def handle_invalid_record!(e)
    render json: { error: INVALID_RECORD, description: e.record.errors }, status: :unprocessable_entity
  end

  def handle_unauthorized!
    render json: { error: UNAUTHORIZED, description: 'Permission denied' }, status: 403
  end

  def handle_token_expired!
    render json: { error: API_TOKEN_EXPIRED, description: MSG_TOKEN_EXPIRED }, status: 200
  end

  def handle_user_disable!
    render json: { error: API_USER_DISABLED , description: MSG_USER_DISABLED }, status: 200
  end

  def handle_user_invalid!
    render json: { error: API_USER_INVALID, description: MSG_USER_INVALID }, status: 200
  end

  def handle_can_not_download_file!(e)
    render json: { error: CAN_NOT_DOWNLOAD, description: e.message }
  end

  def handle_file_not_found!
    render json: { error: FILE_NOT_FOUND, description: 'File not found' }
  end

  def handle_params_missing!(key)
    render json: { error: PARAMETER_MISSING, description: key.to_s }
  end

  def user_not_authorized
    render json: { error: NOT_AUTHORIZED, description: 'You are not authorized to perform this action.' }
  end

  def handle_unexpected_errors!(e)
    render json: { error: UNEXPECTED_ERROR, description: e } if Rails.env.development? || Rails.env.test?

    render json: { error: UNEXPECTED_ERROR, description: 'Unexpected error happened on server' }, status: 500
  end
end
