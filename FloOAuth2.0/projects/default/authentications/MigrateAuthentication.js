const _ = require('lodash');
const Logics = require('./LogicsAuthentication');
const { DEVICE_UID_LENGTH_ALLOW } = require('../constants/AppsConstant');

module.exports.Apply = (Server, AuthenticationName) => {
  const Migrate = () => {
    return {
      async authenticate(request, h) {
        const appId = _.get(request, 'headers.app_id', false);
        if (_.isEmpty(appId) === true) {
          return h.continue;
        }

        const deviceUid = _.get(request, 'headers.device_uid', false);
        if (_.isEmpty(deviceUid) === true) {
          return h.continue;
        }

        if (deviceUid.length < DEVICE_UID_LENGTH_ALLOW[0] || deviceUid.length > DEVICE_UID_LENGTH_ALLOW[1]) {
          return h.continue;
        }

        const validate = await Logics.ValidateMigrate(request, h, appId);
        if (!_.isUndefined(validate.source)) {
          return validate;
        }

        return h.authenticated({
          credentials: validate
        });
      },
      async payload(request, h) {
        return h.continue;
      },
      options: {
        payload: true
      }
    };
  };
  Server.auth.scheme('Migrate', Migrate);
  Server.auth.strategy(AuthenticationName, 'Migrate');
};
