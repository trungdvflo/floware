export enum MessagePartern {
  MESSAGE = 'message',
  CHANNEL_CREATE = 'channel-create',
  CHANNEL_REMOVE = 'channel-remove',
  CHANNEL_ADD_MEMBER = 'channel-add-member',
  CHANNEL_REMOVE_MEMBER = 'channel-remove-member',
  CHAT_MESSAGE = 'chat_message',
}

export enum ServiceType {
  RMQ = 'rabbit-mq',
  REDIS = 'redis',
  KAFKA = 'kafka',
}

export enum ClientName {
  RMQ_REALTIME_MODULE = 'rabbit-mq-realtime-module',
}
