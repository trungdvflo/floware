export enum DatabaseName {
  REALTIME_MESSAGE = 'realtime_message',
  REALTIME_MESSAGE_CLONE = 'realtime_message_clone',
  MESSAGE_SEND_ITEM = 'message_sent_item',
  REALTIME_CHANNEL = 'realtime_channel',
  REALTIME_CHANNEL_MEMBER = 'realtime_channel_member',
  REALTIME_MESSAGE_CHANNEL = 'realtime_message_channel',
  REALTIME_MESSAGE_CHANNEL_SENT = 'realtime_message_channel_sent',
  REALTIME_MESSAGE_USER_STATUS = 'realtime_message_user_status',
  REALTIME_MESSAGE_EDITED_HISTORY = 'realtime_message_edited_history',
  REALTIME_MESSAGE_ATTACHMENT = 'realtime_message_attachment',
  REALTIME_USER_USAGE = 'realtime_user_usage',
  REALTIME_CHAT_CHANNEL_USER_LAST_SEEN = 'realtime_chat_channel_user_last_seen',
  REALTIME_CHAT_CHANNEL_STATUS = 'realtime_chat_channel_status',
  DEVICE_TOKEN = 'device_token',
  REALTIME_SETTING = 'realtime_user_settings',
}

export enum PAGING {
  DEFAULT_LIMIT = 50,
  DEFAULT_PAGE = 1,
}
