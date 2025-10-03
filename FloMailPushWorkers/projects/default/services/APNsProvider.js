const apn = require('apn');

const instances = {};

function getProviderInstance(keyMaps) {
  const key = `k${keyMaps}`;
  if (!instances[key]) {
    const production = (keyMaps % 2 === 0);
    const KEY_PATH = process.env.PUSH_NOTIFY_KEY_PATH;
    const FULL_KEY_PATH = `${KEY_PATH}${keyMaps}.pem`;

    instances[key] = new apn.Provider({
      cert: FULL_KEY_PATH,
      key: FULL_KEY_PATH,
      production
    });
  }

  return instances[key];
}

module.exports = {
  getProviderInstance
};
