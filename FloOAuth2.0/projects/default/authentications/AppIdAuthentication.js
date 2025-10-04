const _ = require('lodash');
const Logics = require('./LogicsAuthentication');

const ValidateAppId = async (request, h) => {
  const appId = _.get(request, 'headers.app_id', false);
  if (_.isEmpty(appId) === true) {
    return h.continue;
  }

  const deviceUid = _.get(request, 'headers.device_uid', false);
  if (_.isEmpty(deviceUid) === true) {
    return h.continue;
  }

  const validate = await Logics.ValidateAppId(h, appId);
  if (!_.isUndefined(validate.source)) {
    return validate;
  }
  return h.continue;
};

module.exports.Apply = (Server, AuthenticationName) => {
  const AppId = () => {
    return {
      async authenticate(request, h) {
        const params = _.get(request, 'query', false);
        if (_.isEmpty(params)) {
          return h.unauthenticated();
        }
        return ValidateAppId(request, h);
      },
      async payload(request, h) {
        // Check for case POT, PUT, DELETE
        return ValidateAppId(request, h);
      },
      options: {
        payload: true
      }
    };
  };
  Server.auth.scheme('AppId', AppId);
  Server.auth.strategy(AuthenticationName, 'AppId');
};
