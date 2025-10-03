import { EmailDTO } from "../../../common/dtos/email.dto";
import { HeaderAuth } from "../../../common/interfaces";
import { ChannelType, Persistence, RealTimeMessageCode, SendOffline } from "../interfaces";

export interface RealTimeEvent {
  headers: HeaderAuth;
}
export interface RealTimeEventMetadata {
  event_timestamp: number;
}
export interface RealTimeEventMessage extends RealTimeEvent {
  message_code: RealTimeMessageCode;
  metadata?: RealTimeEventMetadata;
  content: any;
  persistence?: Persistence;
  send_offline?: SendOffline;
}

export interface EventToChannel extends RealTimeEventMessage {
  channelId: number;
  type?: ChannelType;
}

export interface EventToIndividual extends RealTimeEventMessage {
  email: string[] | string;
}

export interface CreateChannel extends RealTimeEvent {
  channelId: number;
  members?: EmailDTO[];
  type: ChannelType;
  title: string;
}
export interface DeleteChannel extends RealTimeEvent {
  channelId: number;
  type?: ChannelType;
}

export interface AddMemberToChannel extends RealTimeEvent {
  channelId: number;
  members: EmailDTO[];
  type?: ChannelType;
}

export interface RemoveMemberFromChannel extends RealTimeEvent {
  channelId: number;
  members: EmailDTO[];
  type?: ChannelType;
}

export interface DeleteChannel extends RealTimeEvent {
  channelId: number;
}