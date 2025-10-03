export const WORKER_ENV = {
  production: 'production',
  test: 'test',
  development: 'development'
};
export const WORKER_NAME = 'Worker Common';

export const EMAIL_TEMPLATE = {
  NEAR_EXPIRED: 'near_expired_subs',
  STORAGE_FULL: 'storage_full_subs',
  STORAGE_NEAR: 'storage_near_full_subs'
};
export const SUBSCRIPTION_SEND_EMAIL_QUEUE = 'subscriptionSendEmail_v4_2';
export const SUBSCRIPTION_SEND_EMAIL_JOB = {
  NAME: 'subscription_send_email',
  CONCURRENCY: 4,
};
export const SubcriptionConst = {
  MODULE_NAME : 'subcriptionCronJob',
};

export const SubcriptionValue = {
  free: 5368709120,
  pre: 10737418240,
  pro: 107374182400,
  percent80: 80,
  percent95: 95,
  percent100: 100,
  nearFullSubj: "[Flo] Almost Time for an Upgrade",
  nearFullTemp: "storage_near_full_subs",
  fullSubj: "[Flo] Time for an Upgrade",
  fullTemp: "storage_full_subs",

  monthly: 30,
  yearly: 365,
  mSendBefore: "25,20,15",
  ySendBefore: "360,355,350",
  expireSubj: "[Flo] Change to Flo Subscription",
  expireTemp: "near_expired_subs",
};

export const FILE_QUEUE = 'fileQueue_v4_2';
export const FILE_JOB = {
  NAME: {
    FILE: 'deleteFileWasabi',
    FILE_COMMON: 'deleteFileCommons',
    FILE_OBJECT_COMMON: 'deleteFileCommonsOfObject',
  },
  CONCURRENCY: 2,
};