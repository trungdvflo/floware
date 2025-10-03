import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { RealtimeChannel } from "../models/realtime-channel.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(RealtimeChannel)
export class RealtimeChannelRepository extends BaseRepository<RealtimeChannel> {
}