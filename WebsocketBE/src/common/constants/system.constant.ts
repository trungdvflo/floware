export const WS_CURRENT_USER_CHANNEL_PREFIX = 'user_';
export enum FixedChannel {
  WEB = 'web',
  MAC = 'mac',
  IPHONE = 'iphone',
  IPAD = 'ipad',
  SABRE_DAV = 'sabreDav',
  MAC_INTERNAL = 'macInternal',
}

export const FixedChannels = [
  FixedChannel.IPAD,
  FixedChannel.IPHONE,
  FixedChannel.MAC,
  FixedChannel.MAC_INTERNAL,
  FixedChannel.SABRE_DAV,
  FixedChannel.WEB,
];

export enum WS_ADAPTER {
  REDIS_ADAPTER = 'redis-adapter',
  REDIS_STREAMS_ADAPTER = 'redis-streams-adapter',
}
