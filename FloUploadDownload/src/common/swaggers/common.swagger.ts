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
