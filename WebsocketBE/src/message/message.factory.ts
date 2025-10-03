import { v4 as uuidv4 } from 'uuid';
import { WS_CURRENT_USER_CHANNEL_PREFIX } from '../common/constants';
import { getUTCSeconds } from '../common/utils/common';
import { Message } from '../database/entities';
import {
  ChannelUserLastSeenEvent,
  ChannelUserTypingEvent,
  ChatDeleteMessageEvent,
  ChatUpdateMessageEvent,
  WsClientConnectedEvent,
  WsClientDisConnectedEvent,
} from '../events/interface.event';
import {
  ChannelType,
  ChannelTypeNumber,
  IChatMessagePayload,
  IMessage,
  IMessageHeader,
  IMessagePayload,
  IMessageSendOption,
  MessageCode,
  Persistence,
  QoS,
  SendOffline,
  SendType,
  Type
} from '../interface/message.interface';
import { MessageChatParam, MessageQueueParam } from '../interface/microservice-subcriber.interface';
import { IUser } from '../interface/user.interface';
import { BROADCAST_CHANNEL } from '../websocket/websocket.gateway';
import { ChatMessageDto, MessageDto } from './dto/message.dto';
import { ChatMessageParam, MessageParam } from './dto/message.post.dto';

export class MessageFactory {
  static createFromApiParams(params: MessageParam, user: IUser): IMessage {
    const message = new MessageDto();
    message.ignore_device_tokens = params.ignore_device_tokens;

    message.header = {
      event_type: params.event_type,
      send_type: params.send_type,
      from: user?.email,
      to: [],
      time: getUTCSeconds(),
    } as IMessageHeader;
    message.payload = {
      message_uid: uuidv4(),
      message_code: params.message_code,
      content: params.content,
      metadata: params.metadata,
    } as IMessagePayload;
    message.option = {
      delay: params.delay,
      persistence: params.persistence,
      qos: params?.qos || params?.qos === QoS.AT_MOST_ONCE ? params.qos : QoS.AT_LEAST_ONCE,
      send_offline:
        params?.send_offline || params?.send_offline === SendOffline.no
          ? params.send_offline
          : SendOffline.yes,
    } as IMessageSendOption;

    return this.buildHeaderTo(message, params.to);
  }

  static createFromSubscription(params: MessageQueueParam) {
    const message = new MessageDto();
    message.header = {
      event_type: params.event_type,
      send_type: params.send_type,
      from: params.from,
      to: [],
      time: getUTCSeconds(),
    } as IMessageHeader;
    message.payload = {
      message_uid: uuidv4(),
      message_code: params.message_code,
      content: params.content,
      metadata: params.metadata,
    } as IMessagePayload;
    message.option = {
      delay: params.delay,
      persistence: params.persistence,
      qos: params?.qos || params?.qos === QoS.AT_MOST_ONCE ? params.qos : QoS.AT_LEAST_ONCE,
      send_offline:
        params?.send_offline || params?.send_offline === SendOffline.no
          ? params.send_offline
          : SendOffline.yes,
    } as IMessageSendOption;

    return this.buildHeaderTo(message, params.to);
  }

  static createFromSubscriptionChat(params: MessageChatParam) {
    const { to, from, content, metadata } = params;
    const message = new ChatMessageDto();

    // TODO: need to implement
    // message.header = {
    //   event_type: Type.CHAT,
    //   send_type: SendType.CHANNEL,
    //   from,
    //   to,
    //   time: getUTCSeconds(),
    // } as IMessageHeader;
    // message.payload = {
    //   message_uid: uuidv4(),
    //   message_code: MessageCode.CHAT_USER_MESSAGE,
    //   content,
    //   metadata,
    // } as IMessagePayload;
    // message.option = {
    //   delay: 0,
    //   persistence: Persistence.PERSISTENCE,
    //   qos: QoS.AT_LEAST_ONCE,
    //   send_offline: SendOffline.no,
    // } as IMessageSendOption;

    return message;
  }

  static createFromApiChat(params: ChatMessageParam, user: IUser) {
    const { channel, content, metadata, external_message_uid, parent_uid, marked } = params;
    const message = new ChatMessageDto();
    const { channel_id, channel_type } = this.detachChannelIdAndChannelType(channel);

    message.header = {
      event_type: Type.CHAT,
      send_type: SendType.CHANNEL,
      from: user?.email,
      to: [channel],
      time: getUTCSeconds(),
    } as IMessageHeader;
    message.payload = {
      message_uid: external_message_uid || uuidv4(),
      message_code: MessageCode.CHAT_USER_MESSAGE,
      content,
      event_timestamp: getUTCSeconds(),
      metadata: metadata || {},

      channel,
      channel_id,
      channel_type,
      created_date: 0,
      updated_date: 0,
      deleted_date: 0,

      parent_uid: parent_uid ?? '',
      content_marked: marked?.content_marked ?? '',
      message_marked: marked ? {
        message_uid: marked.message_uid
      } : {},
    } as IChatMessagePayload;
    message.option = {
      delay: 0,
      persistence: Persistence.PERSISTENCE,
      qos: QoS.AT_MOST_ONCE,
      send_offline: SendOffline.no,
    } as IMessageSendOption;

    return message;
  }

  static createFromDb(messageDb: Message) {
    const message = new MessageDto();
    const to = messageDb?.to_channel?.split(',') || [];
    message.header = {
      event_type: messageDb.type,
      send_type: messageDb.send_type,
      from: messageDb.from,
      to,
      time: getUTCSeconds(),
    } as IMessageHeader;
    message.payload = {
      message_uid: messageDb.uid,
      message_code: messageDb.code,
      content: messageDb.content,
      event_timestamp: messageDb.created_date,
      metadata: messageDb?.metadata ? JSON.parse(messageDb.metadata) : {},
    } as IMessagePayload;
    message.option = {
      delay: 0,
      persistence: Persistence.NONE_PERSISTENCE,
      qos: QoS.AT_LEAST_ONCE,
      send_offline: SendOffline.no,
    } as IMessageSendOption;

    return this.buildHeaderTo(message, to);
  }

  static createMessageEventUserOnline(event: WsClientConnectedEvent, targetUser: string[]) {
    const { client, timestamp } = event;
    const message = new MessageDto();
    message.header = {
      event_type: Type.EVENT,
      send_type: SendType.USER,
      from: 'system',
      to: targetUser,
      time: getUTCSeconds(),
    } as IMessageHeader;
    message.payload = {
      message_uid: uuidv4(),
      message_code: MessageCode.CHAT_USER_ONLINE,
      content: `${client?.data?.user?.email} have go online`,
      event_timestamp: timestamp,
      metadata: {
        user: client?.data?.user?.email,
      },
    } as IMessagePayload;
    message.option = {
      delay: 0,
      persistence: Persistence.NONE_PERSISTENCE,
      qos: QoS.AT_MOST_ONCE,
      send_offline: SendOffline.no,
    } as IMessageSendOption;

    return this.buildHeaderTo(message, targetUser);
  }

  static createMessageNotificationNewChatMessage(
    m: IMessage,
    channelTitle: string,
    isHideChatContent: boolean
  ) {
    const message = new MessageDto();
    message.header = {
      event_type: Type.NOTIFICATION,
      send_type: SendType.CHANNEL,
      from: m.header.from,
      to: m.header.to,
      time: getUTCSeconds(),
    } as IMessageHeader;
    message.payload = {
      message_uid: uuidv4(),
      message_code: MessageCode.CHAT_NEW_MESSAGE,
      content: `You have new message from chat`,
      event_timestamp: m.payload.event_timestamp,
      metadata: {
        message_uid: m.payload.message_uid,
        channel: m.payload.channel,
        title: `${m.header.from} in ${channelTitle}`,
        created_date: m.payload.event_timestamp
      },
    } as IMessagePayload;

    if (!isHideChatContent) {
      message.payload.content = m.payload.content;
    }

    message.option = {
      delay: 0,
      persistence: Persistence.NONE_PERSISTENCE,
      qos: QoS.AT_MOST_ONCE,
      send_offline: SendOffline.yes,
    } as IMessageSendOption;

    return message;
  }

  static createMessageEventUserOffline(event: WsClientDisConnectedEvent, targetUser: string[]) {
    const { client, timestamp } = event;
    const message = new MessageDto();
    message.header = {
      event_type: Type.EVENT,
      send_type: SendType.USER,
      from: 'system',
      to: targetUser,
      time: getUTCSeconds(),
    } as IMessageHeader;
    message.payload = {
      message_uid: uuidv4(),
      message_code: MessageCode.CHAT_USER_OFFLINE,
      content: `${client?.data?.user?.email} have go offline`,
      event_timestamp: timestamp,
      metadata: {
        user: client?.data?.user?.email,
      },
    } as IMessagePayload;
    message.option = {
      delay: 0,
      persistence: Persistence.NONE_PERSISTENCE,
      qos: QoS.AT_MOST_ONCE,
      send_offline: SendOffline.no,
    } as IMessageSendOption;

    return this.buildHeaderTo(message, targetUser);
  }

  static createMessageEventMessageChatDelete(event: ChatDeleteMessageEvent) {
    const { new_message, email } = event;
    const { channel_id, channel_type } = this.detachChannelIdAndChannelType(new_message.to_channel);

    const m = new ChatMessageDto();
    m.header = {
      event_type: Type.CHAT,
      send_type: SendType.CHANNEL,
      from: email,
      to: [new_message.to_channel],
      time: getUTCSeconds(),
    } as IMessageHeader;

    m.payload = {
      message_uid: uuidv4(),
      message_code: MessageCode.CHAT_USER_DELETED,
      content: '',
      event_timestamp: getUTCSeconds(),
      metadata: {},

      channel_id,
      channel_type,
      created_date: new_message.created_date,
      updated_date: new_message.updated_date,
      deleted_date: new_message.deleted_date,

      parent_uid: new_message.parent_uid ?? '',
      content_marked: new_message.content_marked ?? '',
      message_marked: new_message.message_marked ? JSON.parse(new_message.message_marked) : {},
    } as IChatMessagePayload;
    m.option = {
      delay: 0,
      persistence: Persistence.NONE_PERSISTENCE,
      qos: QoS.AT_MOST_ONCE,
      send_offline: SendOffline.no,
    } as IMessageSendOption;

    return m;
  }

  static createMessageEventMessageChatEdit(event: ChatUpdateMessageEvent) {
    const { new_message, email } = event;
    const message = new ChatMessageDto();
    const { channel_id, channel_type } = this.detachChannelIdAndChannelType(new_message.to_channel);

    message.header = {
      event_type: Type.CHAT,
      send_type: SendType.CHANNEL,
      from: email,
      to: [new_message.to_channel],
      time: getUTCSeconds(),
    } as IMessageHeader;

    message.payload = {
      message_uid: uuidv4(),
      message_code: MessageCode.CHAT_USER_EDITED,
      content: new_message.content,
      event_timestamp: getUTCSeconds(),
      metadata: new_message.metadata ? JSON.parse(new_message.metadata) : {},

      channel_id,
      channel_type,
      created_date: new_message.created_date,
      updated_date: new_message.updated_date,
      deleted_date: 0,

      parent_uid: new_message.parent_uid ?? '',
      content_marked: new_message.content_marked ?? '',
      message_marked: new_message.message_marked ? JSON.parse(new_message.message_marked) : {},
    } as IChatMessagePayload;
    message.option = {
      delay: 0,
      persistence: Persistence.NONE_PERSISTENCE,
      qos: QoS.AT_MOST_ONCE,
      send_offline: SendOffline.no,
    } as IMessageSendOption;

    return message;
  }

  static createMessageEventUserSeen(event: ChannelUserLastSeenEvent) {
    const { channel, last_message_uid, last_seen, email } = event;
    const message = new MessageDto();
    message.header = {
      event_type: Type.EVENT,
      send_type: SendType.CHANNEL,
      from: 'system',
      to: [channel],
      time: getUTCSeconds(),
    } as IMessageHeader;
    message.payload = {
      message_uid: uuidv4(),
      message_code: MessageCode.CHAT_USER_LAST_SEEN,
      content: `${email} is updated last seen`,
      channel,
      metadata: {
        event_timestamp: last_seen,
        last_message_uid,
        user: email,
      },
    } as IMessagePayload;
    message.option = {
      delay: 0,
      persistence: Persistence.NONE_PERSISTENCE,
      qos: QoS.AT_MOST_ONCE,
      send_offline: SendOffline.no,
    } as IMessageSendOption;

    return message;
  }

  static createMessageEventUserTyping(event: ChannelUserTypingEvent) {
    const { channel, email, isTyping } = event;
    const content = isTyping ? `${email} is typing` : `${email} is end typing`;
    const message = new MessageDto();
    message.header = {
      event_type: Type.EVENT,
      send_type: SendType.CHANNEL,
      from: 'system',
      to: [channel],
      time: getUTCSeconds(),
    } as IMessageHeader;
    message.payload = {
      message_uid: uuidv4(),
      message_code: isTyping
        ? MessageCode.CHAT_USER_TYPING
        : MessageCode.CHAT_USER_END_TYPING,
      content,
      channel,
      metadata: {
        event_timestamp: getUTCSeconds(),
        user: email,
      },
    } as IMessagePayload;
    message.option = {
      delay: 0,
      persistence: Persistence.NONE_PERSISTENCE,
      qos: QoS.AT_MOST_ONCE,
      send_offline: SendOffline.no,
    } as IMessageSendOption;

    return message;
  }

  static buildHeaderTo = (message: MessageDto, to: string[]) => {
    if (message.isSendUser()) {
      message.header.to = [];
      for (const t of to) {
        const userChannel = this.createUserChannel(t);
        message.header.to.push(userChannel);
      }
      return message;
    }
    if (message.isSendBroadCast()) {
      message.header.to = [BROADCAST_CHANNEL];
      return message;
    }
    message.header.to = to;
    return message;
  }

  static createUserChannel = (email: string) => {
    return WS_CURRENT_USER_CHANNEL_PREFIX + email;
  }

  static detachChannelIdAndChannelType(channel: string) {
    try {
      const [channelType, channelId] = channel.split('_');
      return {
        channel_type: this.getChannelTypeNumber(channelType as ChannelType),
        channel_id: +channelId
      };
    } catch (e) {
      return {
        channel_type: null,
        channel_id: 0
      };
    }
  }

  static getChannelTypeNumber(channelType: ChannelType): ChannelTypeNumber | null {
    switch (channelType) {
      case ChannelType.SHARED_COLLECTION:
        return ChannelTypeNumber.SHARED_COLLECTION;
      case ChannelType.CONFERENCE:
        return ChannelTypeNumber.CONFERENCE;
    }
  }
}