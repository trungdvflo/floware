import { ConferenceMemberEntity } from "../../../common/entities";
import { InviteSilentPushDTO, ReplySilentPushDTO } from "../../../modules/conference-invite/dtos";
import { ChannelType } from "../interfaces";
import { RealTimeEvent, RealTimeEventMetadata } from "./real-time.event";

export interface ConferenceEvent extends RealTimeEvent {
  confMembers: ConferenceMemberEntity[];
  dateItem: number;
  type: ChannelType;
}

export interface ConferenceEventMetadata extends RealTimeEventMetadata {
  member_id: number;
  email: string;
  channel_id: number;
}

export interface MeetingSendEventMetadata extends RealTimeEventMetadata, InviteSilentPushDTO { }
export interface MeetingReplyEventMetadata extends RealTimeEventMetadata, ReplySilentPushDTO { }

export interface MeetingSendEvent extends RealTimeEvent {
  sender: string;
  emails: string[];
  data: InviteSilentPushDTO;
  dateItem: number;
}

export interface MeetingReplyEvent extends RealTimeEvent {
  sender: string;
  emails: string[];
  data: ReplySilentPushDTO;
  dateItem: number;
}
