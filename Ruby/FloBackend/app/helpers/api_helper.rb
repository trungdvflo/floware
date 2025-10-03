module ApiHelper
  class ApiUnauthorized < StandardError; end
  class ApiTokenExpired < StandardError; end
  class ApiUserInvalid < StandardError; end
  class ApiUserDisable < StandardError; end
  class CanNotDownload < StandardError; end
  class FileNotFound < StandardError; end
  class ParameterMissing < StandardError; end
  class UnexpectedError < StandardError; end
  class ImageNotFound < StandardError; end
end
