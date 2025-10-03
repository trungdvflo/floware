import {
  RealTimeEventMessage,
  RealTimeEventMetadata
} from "./real-time.event";

export interface ChatMentionEventMetadata extends RealTimeEventMetadata {
  from: string;
  email: string;
  updated_date: number;
}

export interface ChatMentionToIndividual extends RealTimeEventMessage {
  email: string;
  message_uid: string;
  metadata: ChatMentionEventMetadata;
}