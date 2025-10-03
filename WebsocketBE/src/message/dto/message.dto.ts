import {
  APNS_CATEGORY,
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
  Type,
} from '../../interface/message.interface';

export class MessageDto implements IMessage {
  header: IMessageHeader;
  payload: IMessagePayload;
  option?: IMessageSendOption;
  private ignoreDevices?: string[];
  private ignoreDeviceTokens?: string[];

  isSendBroadCast(): boolean {
    return this.header.send_type === SendType.BROADCAST;
  }

  isSendChannel(): boolean {
    return this.header.send_type === SendType.CHANNEL;
  }

  isSendUser(): boolean {
    return this.header.send_type === SendType.USER;
  }

  isNotification(): boolean {
    return this.header.event_type === Type.NOTIFICATION;
  }
  isEvent(): boolean {
    return this.header.event_type === Type.EVENT;
  }

  // @deprecated
  isChat(): boolean {
    return this.header.event_type === Type.CHAT;
  }

  isMessageChat(): boolean {
    return (
      this.header.event_type === Type.CHAT &&
      this.payload.message_code === MessageCode.CHAT_USER_MESSAGE
    );
  }

  isPersistence(): boolean {
    return this.option.persistence === Persistence.PERSISTENCE;
  }
  isSendAllDeviceOfUserOffline(): boolean {
    return (this.isNotification() || this.isEvent())
      && this.option.send_offline === SendOffline.yes;
  }

  isSendAllDevices(): boolean {
    return (this.isNotification() || this.isEvent())
      && this.option.send_offline === SendOffline.both;
  }

  isSendAtLeastOnce(): boolean {
    return this.option?.qos === QoS.AT_LEAST_ONCE;
  }

  isVoIP(): boolean {
    return this.payload.message_code === MessageCode.CONFERENCE_SEND_INVITE;
  }

  getAPNsCategory(): APNS_CATEGORY {
    switch (this.payload.message_code) {
      case MessageCode.CONFERENCE_SEND_INVITE:
      case MessageCode.CONFERENCE_CANCEL_INVITE:
      case MessageCode.CONFERENCE_REPLY_INVITE_SUCCESS:
      case MessageCode.CONFERENCE_REPLY_INVITE_LEFT:
      case MessageCode.CONFERENCE_REPLY_INVITE_BUSY:
      case MessageCode.CONFERENCE_REPLY_INVITE_DECLINE:
      case MessageCode.CONFERENCE_REPLY_INVITE_NOT_ANSWER:
      case MessageCode.CONFERENCE_REPLY_INVITE_CANCEL:
        return APNS_CATEGORY.VIDEO_CALL;

      default:
        return APNS_CATEGORY.NOTIFICATION;
    }
  }

  set ignore_devices(devices: string[]) {
    this.ignoreDevices = devices;
  }

  get ignore_devices(): string[] {
    return this.ignoreDevices;
  }

  set ignore_device_tokens(tokens: string[]) {
    this.ignoreDeviceTokens = tokens;
  }
  get ignore_device_tokens(): string[] {
    return this.ignoreDeviceTokens;
  }

  isNotSendSelf(): boolean {
    return [
      MessageCode.CHAT_NEW_MESSAGE, // prevent show new message for sender send message
      MessageCode.CONFERENCE_SEND_INVITE // prevent show ringtone for sender send invite
    ].includes(this.payload.message_code as MessageCode);
  }

  isChatNotification(): boolean {
    return this.payload.message_code === MessageCode.CHAT_NEW_MESSAGE;
  }

  isNeedAck(): boolean {
    return this.payload.message_code === MessageCode.TEST_MESSAGE;
  }
}

export class ChatMessageDto extends MessageDto {
  payload: IChatMessagePayload;
}