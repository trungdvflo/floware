import { registerAs } from '@nestjs/config';

export default registerAs('apns', () => ({
  apnKeyPath: process.env.PUSH_NOTIFY_KEY_PATH || '',
  apnKeyVoipIPad: process.env.KEY_MAP_VOIP_NOTIFY_IPAD || '{}',
  apnKeyMapIPad: process.env.KEY_MAP_PUSH_NOTIFY_IPAD || '{}',
  apnKeyVoipIPhone: process.env.KEY_MAP_VOIP_NOTIFY_IPHONE || '{}',
  apnKeyMapIPhone: process.env.KEY_MAP_PUSH_NOTIFY_IPHONE || '{}',
  apnKeyMapMacOS: process.env.KEY_MAP_PUSH_NOTIFY_MACOS || '{}',

  buildAlertIPad: +process.env.IPAD_ENABLE_ALERT_BUILD || 0,
  buildAlertIPhone: +process.env.IPHONE_ENABLE_ALERT_BUILD || 0,
  buildAlertMac: +process.env.MAC_ENABLE_ALERT_BUILD || 0,
}));
