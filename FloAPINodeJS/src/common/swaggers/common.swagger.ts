import { MSG_TOKEN_INVALID } from '../constants/message.constant';

export const ResponseSchema = {
  un_authorized: {
    schema: {
      example: {
        message: MSG_TOKEN_INVALID
      }
    }
  }
};

export const ApiHeaderSchema = [{
  name: 'device_uid',
  required: true,
  allowEmptyValue: false,
  example: 'cd111a93-a3b3-4625-bafe-1cc9e25d7541',
  description: '* Character identifier string of the device \n * With FloOnline, Device UUID is generated at random and stored in local storage.'
}, {
  name: 'app_id',
  required: true,
  allowEmptyValue: false,
  example: 'e70f1b125cbad944424393cf309efaf0',
  description: 'Flo app type, refer to table app_register'
}, {
  name: 'user_agent',
  required: false,
  allowEmptyValue: true,
  example: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36',
  description: '* User Agent is a client\'s identification string when sending requests to the web server.'
}];

export const SingleResponseCommonCode = {
  RES_400: {
    status: 400,
    description: 'Bad request.',
    schema: {
      example: {
        "error": {
          "code": "FUNCTIONAL_CODE_STRING",
          "message": "The error description",
          "attributes": {}
        }
      }
    }
  },
};

export const MultiResponseCommonCode = {
  RES_401: {
    status: 401,
    description: 'Unauthorized.',
    schema: {
      example: {
        "error": {
          "code": "unauthorized",
          "message": "Unauthorized. Authorization info is undefined or the wrong format"
        }
      }
    }
  },
  RES_403: {
    status: 403,
    description: 'Forbidden.',
    schema: {
      example: {
        "error": {
          "code": "forbidden",
          "message": "Authentication was provided, but the authenticated user is not permitted to perform the requested operation"
        }
      }
    }
  },
  RES_404: {
    status: 404,
    description: 'Not object found.',
    schema: {
      example: {
        "error": {
          "code": "notFound",
          "message": "The server has not found anything matching the Request-URI"
        }
      }
    }
  },
  RES_429: {
    status: 429,
    description: 'API rate limit exceeded.',
    schema: {
      example: {
        "message": "API rate limit exceeded"
      }
    }
  },
  RES_500: {
    status: 500,
    description: 'Internal Server Error.',
    schema: {
      example: {
        "message": "Internal Server Error"
      }
    }
  },
  RES_503: {
    status: 503,
    description: 'Service Unavailable.',
    schema: {
      example: {
        "message": "Service Unavailable"
      }
    }
  }
};

export const PLATFORM_SETTING_DEFAULT_API_TAG = 'Platform Setting Default';
