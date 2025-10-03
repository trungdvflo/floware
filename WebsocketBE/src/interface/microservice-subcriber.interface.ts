import { Persistence } from './message.interface';

export interface MessageQueueParam {
  from: any;
  event_type: string;
  send_type: string;
  content: string;
  message_code: string;
  metadata: any;
  send_offline: number;
  to: string[];
  delay: number;
  persistence: Persistence;
  qos?: number;
}

export interface MessageChatParam {
  from: any;
  content: string;
  metadata: any;
  to: string[];
}
