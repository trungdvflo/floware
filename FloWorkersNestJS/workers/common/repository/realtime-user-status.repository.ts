import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { RealtimeUserStatus } from "../models/realtime-user-status.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(RealtimeUserStatus)
export class RealtimeUserStatusRepository extends BaseRepository<RealtimeUserStatus> {
}