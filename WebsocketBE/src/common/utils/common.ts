import { APP_IDS } from '../constants';
import { LoggerService } from '../logger/logger.service';

export const logRequest = (req) => {
  const app_id = req['header']?.appId || req['user']?.appId || '';
  const [appName] = Object.entries(APP_IDS).find(([, v]) => v === app_id);
  const info = {
    request_time: new Date(),
    method: req.method,
    app_name: `FLO${appName.toLocaleUpperCase()}`,
    path: req.url || '',
    app_id,
    device_uid: req['header']?.deviceUid || req['user']?.deviceUid || '',
  };
  LoggerService.getInstance().logInfo(`${JSON.stringify(info)}`);
};

// example: n=3 => ?,?,?
export const getPlaceholderByN = (n: number) => '?,'.repeat(n).substring(0, n * 2 - 1);

export const getUTCSeconds = (): number => Date.now() / 1000;