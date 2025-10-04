const Joi = require('joi');
const AppsConstant = require('../constants/AppsConstant');
const Code = require('../constants/ResponseCodeConstant');
const QuerysConstant = require('../constants/QuerysConstant');
const MessageConstant = require('../constants/MessageConstant');
const Oauth2 = require('../modules/Oauth2Module');

const routers = [];

const payloadToken = Joi.object({
  grant_type: QuerysConstant.GRANT_TYPE.valid('password').required(),
  username: QuerysConstant.EMAIL.required(),
  password: QuerysConstant.PASSWORD64.required(),
  ip: QuerysConstant.IP.optional().allow(null, '')
});

const payloadSignUp = Joi.object({
  username: QuerysConstant.EMAIL.required(),
  password: QuerysConstant.PASSWORD64.required(),
  timezone: QuerysConstant.TIMEZONE,
  grant_type: QuerysConstant.GRANT_TYPE.valid('password').required(),
  internal_group: QuerysConstant.INTERNAL_GROUP,
  ip: QuerysConstant.IP.optional().allow(null, '')
});

const payloadChangePass = Joi.object({
  new_password: QuerysConstant.PASSWORD64.required()
});

const payloadResetPass = Joi.object({
  password: QuerysConstant.PASSWORD64.required(),
  token: QuerysConstant.RESET_PASSWORD_TOKEN.required()
});

const payloadRefresh = Joi.object({
  grant_type: QuerysConstant.GRANT_TYPE_REFRESH.valid('refresh_token').required(),
  refresh_token: QuerysConstant.REFRESH_TOKEN.required()
});

const payloadRevoke = Joi.object({
  revoke_type: QuerysConstant.REVOKE_TYPE.required()
});

const payloadCheckEmail = Joi.object({
  email: QuerysConstant.EMAIL.required()
});

const resAcc = Joi.object({
  access_token: QuerysConstant.OAUTH_ACCESS_TOKEN,
  refresh_token: QuerysConstant.REFRESH_TOKEN,
  token_type: QuerysConstant.TOKEN_TYPE,
  expires_in: QuerysConstant.EXPIRY_DATE,
  migrate_status: QuerysConstant.MIGRATE_STATUS
});

const resAccRefresh = Joi.object({
  access_token: QuerysConstant.OAUTH_ACCESS_TOKEN,
  refresh_token: QuerysConstant.REFRESH_TOKEN,
  token_type: QuerysConstant.TOKEN_TYPE,
  expires_in: QuerysConstant.EXPIRY_DATE
});

routers.push({
  method: 'POST',
  path: '/token',
  options: {
    auth: 'AppId',
    handler(request, h) {
      return Oauth2.Token(request, h);
    },
    description: MessageConstant.SENDING_THE_CREDENTIALS_TO_AUTHORIZATION_SERVER_HEADERS_APPID_DEVICEUID,
    validate: {
      headers: QuerysConstant.HEADERS_APP_ID_DEVICE_UID,
      payload: payloadToken.required(),
      options: {
        allowUnknown: AppsConstant.JOI_ALLOW_UNKNOWN
      }
    },

    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          data: resAcc
        }).description(MessageConstant.REQUEST_SUCCESSFULLY),

        [`${Code.INVALID_TOKEN}#1`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_USER_BLOCK),
            message: QuerysConstant.MESSAGE.example(MessageConstant.YOUR_ACCOUNT_HAS_BEEN_DISABLED_PLEASE_CONTACT_YOUR_ADMINISTRATOR)
          })
        }).description(MessageConstant.ACCOUNT_HAS_BEEN_DISABLED),

        [`${Code.INVALID_TOKEN}#2`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_AUTHENTICATION_FAILED),
            message: QuerysConstant.MESSAGE.example(MessageConstant.AUTHENTICATION_FAILED)
          })
        }).description(MessageConstant.LOGIN_FAILED),

        [`${Code.INVALID_TOKEN}#3`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.USERNAME_MUST_BE_A_VALID_EMAIL)
          })
        }).description(MessageConstant.USERNAME_MUST_BE_A_VALID_EMAIL),
        [`${Code.INVALID_TOKEN}#4`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_APP_ID)
          })
        }).description(MessageConstant.INVALID_APP_ID),
        [`${Code.INVALID_TOKEN}#5`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_DEVICE_UID)
          })
        }).description(MessageConstant.INVALID_DEVICE_UID)
      }
    },
    tags: ['api', 'OAuth 2.0']
  }
});

routers.push({
  method: 'POST',
  path: '/signup',
  options: {
    auth: 'AppId',
    handler(request, h) {
      return Oauth2.SignUp(request, h);
    },
    description: MessageConstant.REGISTER_NEW_USER_INFORMATION_DESCRIPTION,
    validate: {
      headers: QuerysConstant.HEADERS_APP_ID_DEVICE_UID,
      payload: payloadSignUp.required(),
      options: {
        allowUnknown: AppsConstant.JOI_ALLOW_UNKNOWN
      }
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          data: resAcc
        }).description(MessageConstant.REQUEST_SUCCESSFULLY)
      }
    },
    tags: ['api', 'OAuth 2.0']
  }
});

routers.push({
  method: 'POST',
  path: '/refresh',
  options: {
    auth: 'AppId',
    handler(request, h) {
      return Oauth2.RefreshToken(request, h);
    },
    description: MessageConstant.THE_API_IS_USED_TO_RETURN_NEW_ACCESSTOKEN_INFORMATION_AND_NEW_REFRESHTOKEN_HEADERS_APPID_DEVICEUID,
    validate: {
      headers: QuerysConstant.HEADERS_APP_ID_DEVICE_UID,
      payload: payloadRefresh.required(),
      options: {
        allowUnknown: AppsConstant.JOI_ALLOW_UNKNOWN
      }
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          data: resAccRefresh
        }).description(MessageConstant.REQUEST_SUCCESSFULLY),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_INVALID_REFRESH_TOKEN),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_REFRESH_TOKEN_INFORMATION)
          })
        }).description(MessageConstant.INVALID_REFRESH_TOKEN_INFORMATION),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_REFRESH_TOKEN_EXPIRED),
            message: QuerysConstant.MESSAGE.example(MessageConstant.REFRESH_TOKEN_HAS_EXPIRED)
          })
        }).description(MessageConstant.REFRESH_TOKEN_HAS_EXPIRED),

        [`${Code.INVALID_PAYLOAD_PARAMS}#4`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_APP_ID)
          })
        }).description(MessageConstant.INVALID_APP_ID),

        [`${Code.INVALID_PAYLOAD_PARAMS}#5`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_DEVICE_UID)
          })
        }).description(MessageConstant.INVALID_DEVICE_UID)
      }
    },
    tags: ['api', 'OAuth 2.0']
  }
});

routers.push({
  method: 'POST',
  path: '/revoke',
  options: {
    auth: 'Oauth',
    handler(request, h) {
      return Oauth2.Revoke(request, h);
    },
    description: MessageConstant.REVOKE_DATA_ACCESS_HEADERS_APPID_DEVICEUID_AUTHORIZATION,
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: payloadRevoke.required(),
      options: {
        allowUnknown: AppsConstant.JOI_ALLOW_UNKNOWN
      }
    },
    response: {
      status: {
        [`${Code.REQUEST_SUCCESS}#1`]: Joi.object({
          data: Joi.object({
            is_revoke: QuerysConstant.REVOKE_SUCCESS.valid(true)
          })
        }).description(MessageConstant.THE_TOKEN_IS_REVOKED),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_DATA)
          })
        }).description(MessageConstant.REQUEST_FAIL),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.REVOKE_ACCESSTOKEN_FAILED)
          })
        }).description(MessageConstant.REVOKE_ACCESSTOKEN_FAILED),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_INVALID_ACCESS_TOKEN),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_ACCESS_TOKEN_INFORMATION)
          })
        }).description(MessageConstant.INVALID_REFRESH_TOKEN_INFORMATION),

        [`${Code.INVALID_PAYLOAD_PARAMS}#4`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_APP_ID)
          })
        }).description(MessageConstant.INVALID_APP_ID),

        [`${Code.INVALID_PAYLOAD_PARAMS}#5`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_DEVICE_UID)
          })
        }).description(MessageConstant.INVALID_DEVICE_UID),

        [`${Code.INVALID_TOKEN}#`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
            message: QuerysConstant.MESSAGE.example('Unauthorized')
          })
        }).description('Unauthorized')
      }
    },
    tags: ['api', 'OAuth 2.0']
  }
});

routers.push({
  method: 'POST',
  path: '/changepass',
  options: {
    auth: 'Oauth',
    handler(request, h) {
      return Oauth2.ChangePassword(request, h);
    },
    description: MessageConstant.CHANGE_PASSWORD_OF_USER_HEADERS_APPID_DEVICEUID_AUTHORIZATION,
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: payloadChangePass.required(),
      options: {
        allowUnknown: AppsConstant.JOI_ALLOW_UNKNOWN
      }
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          data: resAcc
        }).description(MessageConstant.REQUEST_SUCCESSFULLY),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_ACCOUNT_INFORMATION)
          })
        }).description(MessageConstant.INVALID_ACCOUNT_INFORMATION),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_PASSWORD)
          })
        }).description(MessageConstant.INVALID_PASSWORD),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.PASSWORDS_LENGTH_MUST_HAVE_A_MINIMUM_OF_6_AND_A_MAXIMUM_OF_32_CHARACTERS_RESPECTIVELY)
          })
        }).description(MessageConstant.PASSWORDS_LENGTH_MUST_HAVE_A_MINIMUM_OF_6_AND_A_MAXIMUM_OF_32_CHARACTERS_RESPECTIVELY),

        [`${Code.INVALID_PAYLOAD_PARAMS}$4`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_USER_BLOCK),
            message: QuerysConstant.MESSAGE.example(MessageConstant.YOUR_ACCOUNT_HAS_BEEN_DISABLED_PLEASE_CONTACT_YOUR_ADMINISTRATOR)
          })
        }).description(MessageConstant.ACCOUNT_HAS_BEEN_DISABLED),

        [`${Code.INVALID_PAYLOAD_PARAMS}#4`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_APP_ID)
          })
        }).description(MessageConstant.INVALID_APP_ID),

        [`${Code.INVALID_PAYLOAD_PARAMS}#5`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_DEVICE_UID)
          })
        }).description(MessageConstant.INVALID_DEVICE_UID),

        [`${Code.INVALID_TOKEN}#`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
            message: QuerysConstant.MESSAGE.example('Unauthorized')
          })
        }).description('Unauthorized')
      }
    },
    tags: ['api', 'OAuth 2.0']
  }
});

routers.push({
  method: 'POST',
  path: '/resetpass',
  options: {
    auth: 'AppId',
    handler(request, h) {
      return Oauth2.ResetPassword(request, h);
    },
    description: MessageConstant.RESET_PASSWORD_OF_USER_HEADERS_APPID_DEVICEUID,
    validate: {
      headers: QuerysConstant.HEADERS_APP_ID_DEVICE_UID,
      payload: payloadResetPass.required(),
      options: {
        allowUnknown: AppsConstant.JOI_ALLOW_UNKNOWN
      }
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          data: Joi.object({
            is_reset: QuerysConstant.RESET_SUCCESS.valid(true)
          })
        }).description(MessageConstant.PASSWORD_HAS_BEEN_RESET_SUCCESSFULLY),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_TOKEN_OR_ALREADY_EXPIRED)
          })
        }).description(MessageConstant.INVALID_TOKEN_OR_ALREADY_EXPIRED),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_PASSWORD)
          })
        }).description(MessageConstant.INVALID_PASSWORD),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.PASSWORDS_LENGTH_MUST_HAVE_A_MINIMUM_OF_6_AND_A_MAXIMUM_OF_32_CHARACTERS_RESPECTIVELY)
          })
        }).description(MessageConstant.PASSWORDS_LENGTH_MUST_HAVE_A_MINIMUM_OF_6_AND_A_MAXIMUM_OF_32_CHARACTERS_RESPECTIVELY),

        [`${Code.INVALID_PAYLOAD_PARAMS}#4`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_USER_BLOCK),
            message: QuerysConstant.MESSAGE.example(MessageConstant.YOUR_ACCOUNT_HAS_BEEN_DISABLED_PLEASE_CONTACT_YOUR_ADMINISTRATOR)
          })
        }).description(MessageConstant.ACCOUNT_HAS_BEEN_DISABLED),

        [`${Code.INVALID_PAYLOAD_PARAMS}#5`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_APP_ID)
          })
        }).description(MessageConstant.INVALID_APP_ID),

        [`${Code.INVALID_PAYLOAD_PARAMS}#6`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_DEVICE_UID)
          })
        }).description(MessageConstant.INVALID_DEVICE_UID)
      }
    },
    tags: ['api', 'OAuth 2.0']
  }
});

routers.push({
  method: 'POST',
  path: '/checkemail',
  options: {
    auth: 'AppId',
    handler(request, h) {
      return Oauth2.CheckEmail(request, h);
    },
    description: MessageConstant.CHECK_THE_EXISTENCE_OF_EMAIL_HEADERS_APPID_DEVICEUID,
    validate: {
      headers: QuerysConstant.HEADERS_APP_ID_DEVICE_UID,
      payload: payloadCheckEmail.required(),
      options: {
        allowUnknown: AppsConstant.JOI_ALLOW_UNKNOWN
      }
    },
    response: {
      status: {
        [`${Code.REQUEST_SUCCESS}#1`]: Joi.object({
          data: Joi.object({
            is_exist: QuerysConstant.EMAIL_EXIST.valid(true)
          })
        }).description(MessageConstant.THIS_EMAIL_ALREADY_EXISTS),
        [`${Code.REQUEST_SUCCESS}#2`]: Joi.object({
          data: Joi.object({
            is_exist: QuerysConstant.EMAIL_EXIST.valid(false)
          })
        }).description(MessageConstant.IT_APPEARS_THAT_THE_EMAIL_ADDRESS_IS_NOT_REGISTERED_WITH_US),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.EMAIL_FORMAT_IS_NOT_VALID)
          })
        }).description(MessageConstant.EMAIL_FORMAT_IS_NOT_VALID),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_APP_ID)
          })
        }).description(MessageConstant.INVALID_APP_ID),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_BAD_REQUEST),
            message: QuerysConstant.MESSAGE.example(MessageConstant.INVALID_DEVICE_UID)
          })
        }).description(MessageConstant.INVALID_DEVICE_UID)

      }
    },
    tags: ['api', 'OAuth 2.0']
  }
});

module.exports = routers;
