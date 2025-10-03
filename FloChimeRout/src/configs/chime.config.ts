import { registerAs } from '@nestjs/config';

export default registerAs('chime', () => ({
  region: process.env.CHIME_REGION,
  role_arn: process.env.CHIME_ROLE_ARN,
  meetingEndpoint: process.env.CHIME_ENDPOINT,
  messengingEndpoint: process.env.CHIME_MESSENGING_ENDPOINT || 'https://messaging-chime.us-east-1.amazonaws.com',
  appInstanceArn: process.env.CHIME_APP_INSTANCE_ARN,
  userInstanceArn: process.env.CHIME_USER_INSTANCE_ARN,
  secretKey: process.env.CHIME_JWT_SECRET_KEY,
  accessKeyId: process.env.CHIME_ACCESS_KEY,
  meetingEventQueue: process.env.SQS_CHIME_MEETING_EVENT_NAME,
  meetingEventQueueUrl: process.env.SQS_CHIME_MEETING_EVENT_URL
}));
