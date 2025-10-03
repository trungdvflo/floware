import { ApiLastModifiedName } from "../../../common/constants";
import { EventToChannel, RealTimeEventMessage, RealTimeEventMetadata } from "./real-time.event";

export interface LastModifiedEventMetadata extends RealTimeEventMetadata {
  api_name: ApiLastModifiedName;
  updated_date: number;
}

export interface LastModifiedToCollection extends EventToChannel {
  metadata: LastModifiedEventMetadata;
  channelId: number;
}

export interface LastModifiedToConference extends EventToChannel {
  metadata: LastModifiedEventMetadata;
  channelId: number;
}

export interface LastModifiedToIndividual extends RealTimeEventMessage {
  email: string;
  metadata: LastModifiedEventMetadata;
}