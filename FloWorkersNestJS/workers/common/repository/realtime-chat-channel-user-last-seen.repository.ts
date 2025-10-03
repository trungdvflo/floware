import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { RealtimeChannelUserLastSeen } from "../models/realtime-channel-user-last-seen.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(RealtimeChannelUserLastSeen)
export class RealtimeChannelUserLastSeenRepository
extends BaseRepository<RealtimeChannelUserLastSeen> {
}