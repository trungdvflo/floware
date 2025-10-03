import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { RealtimeChatChannelStatus } from "../models/realtime-chat-channel-status.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(RealtimeChatChannelStatus)
export class RealtimeChatChannelStatusRepository extends BaseRepository<RealtimeChatChannelStatus> {
}