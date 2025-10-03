import { registerAs } from '@nestjs/config';

export default registerAs('cronjob', () => ({
  cronTime: process.env.API_LAST_MODIFY_CRONTIME || '*/5 * * * *',
  overdueTime: +process.env.API_LAST_MODIFY_OVERDUE || 10,
  cronTimeSubScription: process.env.SUBSCRIPTION_CRONTIME || '* 1 * * *',
  // delete collected invalid data every 5 min
  cronTimeDeleteInvalidDataCronTime: process.env.DELETE_INVALID_DATA_CTIME || '*/5 * * * *',
  // collect invalid data every day at 2AM
  collectInvalidFloObjectCronTime: process.env.COLLECT_INVALID_FLO_OBJECT_CTIME || '0 2 * * *',
  collectInvalidFloMailCronTime: process.env.COLLECT_INVALID_FLOMAIL_CTIME || '0 2 * * *',
  collectOutdatedNotificationCronTime: process.env.COLLECT_OUTDATED_NOTIFICATION_CTIME || '0 1 * * *',
}));