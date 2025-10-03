import { Notification, Provider } from '@parse/node-apn';
import workerEnv from '../configs/worker.config';
import { TimestampDouble } from './common';
import { Graylog } from './graylog';

export const apnSilentPushInit = (pemBundles) => {
  try {
    const apnSilentPushs = {};
    Object.keys(pemBundles).forEach((pem) => {
      try {
        const FULL_KEY_PATH = `${process.env.PUSH_NOTIFY_KEY_PATH}${pem}.pem`;
        const pemNumber = parseInt(pem, 10);
        const production = pemNumber % 2 === 0;

        apnSilentPushs[pem] = new Provider({
          cert: FULL_KEY_PATH,
          key: FULL_KEY_PATH,
          production
        });
      } catch (error) {
        Graylog.getInstance().logInfo({
          moduleName: 'Push message',
          message: error.code,
          fullMessage: error.message
        });
        return error;
      }

    });
    return apnSilentPushs;
  } catch (error) {
    Graylog.getInstance().logInfo({
      moduleName: 'Push message',
      message: error.code,
      fullMessage: error.message
    });
    return error;
  }
};

export const apnShutDown = (providers) => {
  try {
    providers.forEach((provider) => {
      try {
        provider.shutdown();
      } catch (error) {
        Graylog.getInstance().logInfo({
          moduleName: 'Push message',
          message: error.code,
          fullMessage: error.message
        });
        return error;
      }
    });
    return true;
  } catch (error) {
    Graylog.getInstance().logInfo({
      moduleName: 'Push message',
      message: error.code,
      fullMessage: error.message
    });
    return error;
  }
};

export const pushMessage = async (apnProvider, bundle, device) => {
  return new Promise((resolve) => {
    try {
      const notiMessage = new Notification();
      const pushExpiry = workerEnv().pushExpire;
      notiMessage.expiry = Math.floor(Date.now() / 1000) + pushExpiry;
      notiMessage.topic = bundle;
      notiMessage.payload = {
        from: 'node-apn'
      };

      if (device.env_silent === 1) {
        notiMessage.sound = 'default';
        notiMessage.alert = {
          title: `${device.pem} ${bundle} PushChange ${TimestampDouble()}`,
          body: `PushChange`
        };
      }
      notiMessage.aps['content-available'] = 1;
      notiMessage.aps['sound'] = '';
      notiMessage.aps['category'] = 'FLOWARE_LAST_MODIFIED';
      notiMessage.aps['priority'] = 'high';
      apnProvider.send(notiMessage, device.device_token).then((result) => {
        resolve(result);
      });
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: 'Push message',
        message: error.code,
        fullMessage: error.message
      });
      return error;
    }
  });
};