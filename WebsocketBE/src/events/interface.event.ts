import { Socket } from 'socket.io';
import { Message } from '../database/entities';
import { IMessage } from '../interface/message.interface';
import { IUser } from '../interface/user.interface';

export interface ChatSendMessageEvent {
  user: IUser;
  message: IMessage;
}

export interface ChatDeleteMessageEvent {
  email: string;
  old_message: Message;
  new_message: Message;
}

export interface ChatEditMessageEvent {
  email: string;
  message: IMessage;
}

export interface ChatUpdateMessageEvent {
  email: string;
  old_message: Message;
  new_message: Message;
}

export interface MesageBeforeSend {
  message: IMessage;
  to_actual_user: string[];
}

export interface ChannelUserLastSeenEvent {
  email: string;
  channel: string;
  last_seen: number;
  last_message_uid: string;
}

export interface ChannelUserTypingEvent {
  email: string;
  channel: string;
  isTyping: boolean;
}

export interface CreateChannelEvent {
  user: IUser;
  channel: string[];
}

export interface MemberChannelEvent {
  channel: string[];
  member: string[];
}
// tslint:disable-next-line: no-empty-interface
export interface RemoveMemberToChannelEvent extends MemberChannelEvent {}
// tslint:disable-next-line: no-empty-interface
export interface AddMemberToChannelEvent extends MemberChannelEvent {}
// tslint:disable-next-line: no-empty-interface
export interface AddChannelEvent extends MemberChannelEvent {}
// tslint:disable-next-line: no-empty-interface
export interface RemoveChannelEvent extends MemberChannelEvent {}

export interface WsClientMessageEvent {
  client: Socket;
  timestamp: number;
  data: any;
}
export interface WsClientAckEvent {
  clientId: string;
  timestamp: number;
  messageUid: string;
  user: string;
}
export interface WsClientConnectedEvent {
  client: Socket;
  timestamp: number;
  isUserOnline: boolean;
}

export interface WsClientDisConnectedEvent {
  client: Socket;
  timestamp: number;
  isUserOffline: boolean;
}
export interface WsChangeRoom {
  room: string;
  email: string;
}

export enum EventName {
  CHAT_MESSAGE_SEND = 'chat.message.send',
  CHAT_MESSAGE_DELETE = 'chat.message.delete',
  CHAT_MESSAGE_EDIT = 'chat.message.edit',
  CHAT_CHANNEL_USER_LAST_SEEN = 'chat.channel.user.lastseen',
  MESSAGE_BEFORE_SEND = 'message.send',
  CHANNEL_CREATE = 'channel.create',
  CHANNEL_REMOVE = 'channel.remove',
  CHANNEL_ADD_MEMBER = 'channel.add.memeber',
  CHANNEL_REMOVE_MEMBER = 'channel.remove.member',
  WS_CLIENT_MSG = 'websocket.client.msg',
  WS_CLIENT_CONNECTED = 'websocket.client.connected',
  WS_CLIENT_DISCONNECTED = 'websocket.client.disconnected',
  WS_JOIN_ROOM = 'websocket.user.join.room',
  WS_LEAVE_ROOM = 'websocket.user.leave.room',
  WS_CLIENT_OFFLINE = 'websocket.client.offline',
  WS_CLIENT_ONLINE = 'websocket.client.online',
  WS_CLIENT_ACK = 'websocket.client.ack',
}
