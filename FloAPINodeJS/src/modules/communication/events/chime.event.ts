import { IUser } from "../../../common/interfaces";
import { EditMessageIntDTO } from "../../../modules/conference-chat/dtos/conference-chat.put.dto";
import { ChatChannel, ChatMember } from "../interfaces";
import { IChimeChatMessage } from "../services";
import { RealTimeEvent } from "./real-time.event";

export interface CreateChimeChannel extends RealTimeEvent {
  channels: ChatChannel[];
  user: IUser;
}

export interface ChannelMember extends RealTimeEvent {
  user?: IUser;
  members: ChatMember[];
}

export interface ChimeMessageChannel extends RealTimeEvent {
  messages: EditMessageIntDTO[];
  user: IUser;
}

export interface ChimeCreateMessage extends RealTimeEvent {
  message: IChimeChatMessage;
  user: IUser;
}
